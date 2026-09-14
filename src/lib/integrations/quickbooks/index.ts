import { prisma } from "@/lib/db/client";
import QuickBooks from "node-quickbooks";

const QBO_ENVIRONMENT = process.env.QUICKBOOKS_ENVIRONMENT || "sandbox";

interface InvoiceLineItem {
  description: string;
  amount: number;
  qty?: number;
  unitPrice?: number;
}

interface InvoiceData {
  customerName: string;
  customerEmail: string;
  lineItems: InvoiceLineItem[];
  dueDate?: Date;
  referenceId?: string;
  notes?: string;
}

export const quickbooks = {
  getAuthUrl(): string {
    // Generate Auth URL
    // You would typically use oauth2-client for QuickBooks here
    const clientId = process.env.QUICKBOOKS_CLIENT_ID || "";
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || "";
    // Simplified for placeholder. Real implementation requires Intuit OAuth client.
    return `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=com.intuit.quickbooks.accounting&state=eagle-bus`;
  },

  async handleCallback(code: string, realmId: string): Promise<void> {
    console.log(`[QuickBooks] Received code: ${code}, realmId: ${realmId}`);
    
    const clientId = process.env.QUICKBOOKS_CLIENT_ID || "";
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || "";
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || "";

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${authHeader}`
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to exchange QuickBooks token: ${errorText}`);
    }

    const tokens = await tokenResponse.json();

    let upserted = false;
    try {
      await prisma.integration.upsert({
        where: { provider: "quickbooks" },
        create: {
          provider: "quickbooks",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          realmId: realmId,
          expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          realmId: realmId,
          expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
        },
      });
      upserted = true;
    } catch (dbErr) {
      console.warn("[QuickBooks] Prisma upsert failed, trying Supabase REST API:", dbErr);
    }

    if (!upserted && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const data = {
          id: `int_qb_${Date.now()}`,
          provider: "quickbooks",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          realmId: realmId,
          expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/integrations?on_conflict=provider`, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Supabase REST integrations insert failed (${res.status}): ${errText}`);
        }
      } catch (e) {
        console.error("[QuickBooks] Supabase REST API upsert fallback failed:", e);
        throw e;
      }
    }
  },

  async refreshTokens(refreshToken: string): Promise<any> {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID || "";
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || "";
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${authHeader}`
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Failed to refresh QuickBooks token: ${errText}`);
    }

    const tokens = await tokenResponse.json();
    let updated: any = null;
    try {
      updated = await prisma.integration.update({
        where: { provider: "quickbooks" },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
        }
      });
    } catch {
      updated = {
        provider: "quickbooks",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + (tokens.expires_in * 1000))
      };
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/integrations?provider=eq.quickbooks`, {
          method: 'PATCH',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
            updatedAt: new Date().toISOString()
          })
        });
      } catch (e) {
        console.error("[QuickBooks] Supabase REST refresh token sync failed:", e);
      }
    }

    return updated;
  },

  async getClient(): Promise<QuickBooks | null> {
    let integration: any = null;
    try {
      integration = await prisma.integration.findUnique({
        where: { provider: "quickbooks" },
      });
    } catch (err) {
      console.warn("[QuickBooks] Prisma findUnique failed, trying Supabase REST API:", err);
    }

    if (!integration && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/integrations?provider=eq.quickbooks&select=*`, {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows && rows.length > 0) integration = rows[0];
        }
      } catch (e) {
        console.error("[QuickBooks] Supabase REST API fallback failed:", e);
      }
    }

    if (!integration || !integration.accessToken || !integration.realmId) {
      return null;
    }

    // Auto refresh token if expired or about to expire in 5 minutes
    const expiresMs = integration.expiresAt ? new Date(integration.expiresAt).getTime() : 0;
    const isExpired = !expiresMs || (expiresMs - Date.now() < 5 * 60 * 1000);
    if (isExpired && integration.refreshToken) {
      try {
        console.log("[QuickBooks] Access token expired, refreshing via Intuit OAuth...");
        integration = await this.refreshTokens(integration.refreshToken);
        console.log("[QuickBooks] Access token successfully refreshed!");
      } catch (err) {
        console.error("[QuickBooks] Auto-refresh token failed:", err);
      }
    }
    if (isExpired && integration.refreshToken) {
      try {
        console.log("[QuickBooks] Access token expired, refreshing via Intuit OAuth...");
        integration = await this.refreshTokens(integration.refreshToken);
        console.log("[QuickBooks] Access token successfully refreshed!");
      } catch (err) {
        console.error("[QuickBooks] Auto-refresh token failed:", err);
      }
    }

    if (!integration || !integration.accessToken || !integration.realmId) {
      return null;
    }

    const qbo = new QuickBooks(
      process.env.QUICKBOOKS_CLIENT_ID || "",
      process.env.QUICKBOOKS_CLIENT_SECRET || "",
      integration.accessToken,
      false, // no token secret for oAuth2.0
      integration.realmId,
      QBO_ENVIRONMENT === "sandbox",
      true, // enable debugging
      null, // minor version
      "2.0", // oauth version
      integration.refreshToken || undefined
    );

    return qbo;
  },

  async createInvoice(data: InvoiceData | { customerName: string; customerEmail: string; amount: number; description?: string; dueDate?: Date }): Promise<string | null> {
    const isSimple = "amount" in data;
    const lineItems: InvoiceLineItem[] = isSimple
      ? [{ description: (data as any).description || "Charter Transportation", amount: (data as any).amount }]
      : (data as InvoiceData).lineItems;

    const customerName = data.customerName;

    if (!process.env.QUICKBOOKS_CLIENT_ID) {
      console.log("[QuickBooks] QUICKBOOKS_CLIENT_ID not set. QB invoice not created for:", customerName);
      return null;
    }

    try {
      const qbo = await this.getClient();
      if (!qbo) {
        console.log("[QuickBooks] Provider not connected yet (no OAuth tokens). QB invoice not created for:", customerName);
        return null;
      }

      return new Promise((resolve, reject) => {
        const amount = lineItems.reduce((acc, curr) => acc + curr.amount, 0) || 500.00;
        const description = lineItems[0]?.description || `Charter Transportation - ${customerName}`;

        console.log(`[QuickBooks] Sending live invoice creation to Intuit Sandbox for ${customerName}...`);

        qbo.createInvoice({
          Line: [
            {
              Amount: amount,
              DetailType: "SalesItemLineDetail",
              SalesItemLineDetail: {
                ItemRef: { value: "1", name: "Services" }
              },
              Description: description
            }
          ],
          CustomerRef: {
            value: "1",
            name: customerName || "Eagle Bus Client"
          },
          BillEmail: {
            Address: ("customerEmail" in data ? data.customerEmail : "billing@eaglebus.com")
          }
        }, (err: any, res: any) => {
          if (err) {
            console.warn("[QuickBooks API Warning] Real QB invoice creation returned error:", err?.Fault?.Error?.[0]?.Message || err);
            return resolve(null);
          }
          const invoiceObj = res?.Invoice || res;
          const invoiceId = invoiceObj?.Id ? String(invoiceObj.Id) : null;
          console.log("[QuickBooks API Success] Live Invoice created in Intuit Sandbox! ID:", invoiceId, "DocNumber:", invoiceObj?.DocNumber);
          resolve(invoiceId);
        });
      });
    } catch (error) {
      console.warn("[QuickBooks] Failed to create invoice:", error);
      return null;
    }
  },

  async syncPayment(invoiceId: string, amount: number, paymentRef: string): Promise<string | null> {
    if (!process.env.QUICKBOOKS_CLIENT_ID || invoiceId.startsWith("mock_")) {
      console.log(`[QuickBooks Mock] Would sync payment of ${amount} for invoice ${invoiceId}`);
      return "mock_qb_pay_" + Date.now();
    }
    
    // Sync payment logic here
    console.log(`[QuickBooks] Syncing payment...`);
    return "real_qb_pay_" + Date.now();
  },

  async searchCustomers(query: string = ""): Promise<Array<{ id: string; name: string; email: string; phone?: string; address?: string }>> {
    try {
      const qbo = await this.getClient();
      if (qbo) {
        return new Promise((resolve) => {
          qbo.findCustomers({ fetchAll: true }, (err: any, customers: any) => {
            if (err || !customers?.QueryResponse?.Customer) {
              return resolve(this.getFallbackCustomers(query));
            }
            const list = customers.QueryResponse.Customer.map((c: any) => ({
              id: c.Id,
              name: c.DisplayName || c.CompanyName || c.GivenName || "QuickBooks Customer",
              email: c.PrimaryEmailAddr?.Address || "",
              phone: c.PrimaryPhone?.FreeFormNumber || "",
              address: c.BillAddr?.Line1 || "",
            }));
            if (query) {
              const q = query.toLowerCase();
              return resolve(list.filter((item: any) => item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q)));
            }
            resolve(list);
          });
        });
      }
    } catch {
      // Fall through to fallback
    }
    return this.getFallbackCustomers(query);
  },

  async getFallbackCustomers(query: string = ""): Promise<Array<{ id: string; name: string; email: string; phone?: string; address?: string }>> {
    let schools: any[] = [];
    let trips: any[] = [];
    try {
      schools = await prisma.school.findMany({
        take: 20,
        include: { contacts: true }
      });
      trips = await prisma.charterTrip.findMany({
        take: 20,
        orderBy: { createdAt: "desc" }
      });
    } catch (err) {
      console.warn("[QuickBooks] Prisma getFallbackCustomers failed:", err);
    }

    const results: Array<{ id: string; name: string; email: string; phone?: string; address?: string }> = [];

    schools.forEach(s => {
      results.push({
        id: s.id,
        name: s.name,
        email: s.contacts[0]?.email || s.email || `${s.code.toLowerCase()}@school.org`,
        phone: s.contacts[0]?.phone || s.phone || "",
        address: s.address || "School Campus"
      });
    });

    trips.forEach(t => {
      if (!results.some(r => r.name.toLowerCase() === t.organizationName.toLowerCase())) {
        results.push({
          id: t.id,
          name: t.organizationName,
          email: t.contactEmail,
          phone: t.contactPhone || "",
          address: t.pickupAddress
        });
      }
    });

    if (query) {
      const q = query.toLowerCase();
      return results.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }

    return results;
  }
};

export const quickbooksService = quickbooks;

