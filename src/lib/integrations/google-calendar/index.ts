/**
 * Google Calendar Integration
 * Uses Google Calendar API v3 via googleapis package.
 * Requires OAuth2 or Service Account credentials.
 */

import { google, calendar_v3 } from "googleapis";
import { prisma } from "@/lib/db/client";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

interface TripEventData {
  tripId: string;
  organizationName: string;
  contactName: string;
  pickupAddress: string;
  destinationAddress: string;
  stagingTime: Date;
  returnStagingTime?: Date | null;
  numberOfBuses: number;
  numberOfStudents: number;
  assignedBuses?: string[];
  assignedDrivers?: string[];
  paymentStatus?: string;
  tripStatus?: string;
}

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  return oauth2Client;
}

async function getAuthenticatedClient() {
  const oauth2Client = getOAuth2Client();

  let integration: any = null;
  try {
    integration = await prisma.integration.findUnique({
      where: { provider: "google_calendar" },
    });
  } catch (err) {
    console.warn("[Google Calendar] Prisma query failed, trying Supabase REST API:", err);
  }

  if (!integration && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/integrations?provider=eq.google_calendar&select=*`, {
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
      console.error("[Google Calendar] Supabase REST API fallback failed:", e);
    }
  }

  if (!integration?.accessToken) {
    throw new Error("Google Calendar not connected. Please authorize via /api/calendar/auth");
  }

  const expiryDate = integration.expiresAt ? new Date(integration.expiresAt).getTime() : undefined;

  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken || undefined,
    expiry_date: expiryDate,
  });

  return oauth2Client;
}

function buildEventDescription(data: TripEventData): string {
  const lines = [
    `Organization: ${data.organizationName}`,
    `Contact: ${data.contactName}`,
    ``,
    `Pickup: ${data.pickupAddress}`,
    `Destination: ${data.destinationAddress}`,
    ``,
    `# of Buses: ${data.numberOfBuses}`,
    `# of Students: ${data.numberOfStudents}`,
  ];
  if (data.assignedBuses?.length) lines.push(`Buses: ${data.assignedBuses.join(", ")}`);
  if (data.assignedDrivers?.length) lines.push(`Drivers: ${data.assignedDrivers.join(", ")}`);
  if (data.paymentStatus) lines.push(`Payment: ${data.paymentStatus}`);
  if (data.tripStatus) lines.push(`Status: ${data.tripStatus}`);
  lines.push(``, `Trip ID: ${data.tripId}`);
  return lines.join("\n");
}

export const googleCalendar = {
  getAuthUrl(): string {
    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar"],
      prompt: "consent",
    });
  },

  async handleCallback(code: string): Promise<void> {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    const data = {
      id: `int_gcal_${Date.now()}`,
      provider: "google_calendar",
      accessToken: tokens.access_token || null,
      refreshToken: tokens.refresh_token || null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let upserted = false;
    try {
      await prisma.integration.upsert({
        where: { provider: "google_calendar" },
        create: {
          provider: "google_calendar",
          accessToken: tokens.access_token || undefined,
          refreshToken: tokens.refresh_token || undefined,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
        update: {
          accessToken: tokens.access_token || undefined,
          refreshToken: tokens.refresh_token || undefined,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        },
      });
      upserted = true;
    } catch (dbErr) {
      console.warn("[Google Calendar] Prisma upsert failed, trying Supabase REST API:", dbErr);
    }

    if (!upserted && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
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
        console.error("[Google Calendar] Supabase REST API upsert fallback failed:", e);
        throw e;
      }
    }
  },

  async createTripEvent(data: TripEventData): Promise<string | null> {
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.log("[Calendar Mock] Would create event:", data.organizationName, data.stagingTime);
      return "mock_event_" + Date.now();
    }

    try {
      const auth = await getAuthenticatedClient();
      const calendar = google.calendar({ version: "v3", auth });

      const endTime = data.returnStagingTime || new Date(data.stagingTime.getTime() + 4 * 60 * 60 * 1000);

      const event: calendar_v3.Schema$Event = {
        summary: `[Eagle Bus] ${data.organizationName} Field Trip`,
        description: buildEventDescription(data),
        location: data.pickupAddress,
        start: {
          dateTime: data.stagingTime.toISOString(),
          timeZone: "America/New_York",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "America/New_York",
        },
        extendedProperties: {
          private: {
            eagleTripId: data.tripId,
            organization: data.organizationName,
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        requestBody: event,
      });

      return response.data.id || "mock_event_" + Date.now();
    } catch (error: any) {
      console.warn("[Google Calendar Mock] Provider not connected or failed, using mock event ID:", error?.message || error);
      return "mock_event_" + Date.now();
    }
  },

  async updateTripEvent(eventId: string, data: Partial<TripEventData>): Promise<void> {
    if (!process.env.GOOGLE_CLIENT_ID || eventId.startsWith("mock_")) return;

    try {
      const auth = await getAuthenticatedClient();
      const calendar = google.calendar({ version: "v3", auth });

      const patch: calendar_v3.Schema$Event = {};
      if (data.organizationName) patch.summary = `[Eagle Bus] ${data.organizationName} Field Trip`;
      if (data) patch.description = buildEventDescription(data as TripEventData);

      await calendar.events.patch({
        calendarId: CALENDAR_ID,
        eventId,
        requestBody: patch,
      });
    } catch (error) {
      console.error("[Google Calendar] Failed to update event:", error);
    }
  },

  async deleteTripEvent(eventId: string): Promise<void> {
    if (!process.env.GOOGLE_CLIENT_ID || eventId.startsWith("mock_")) return;

    try {
      const auth = await getAuthenticatedClient();
      const calendar = google.calendar({ version: "v3", auth });
      await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
    } catch (error) {
      console.error("[Google Calendar] Failed to delete event:", error);
    }
  },

  async checkAvailability(date: Date): Promise<boolean> {
    if (!process.env.GOOGLE_CLIENT_ID) return true; // Mock: always available

    try {
      const auth = await getAuthenticatedClient();
      const calendar = google.calendar({ version: "v3", auth });

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
      });

      // Simple availability: date is available if < 10 events that day
      return (response.data.items?.length || 0) < 10;
    } catch {
      return true;
    }
  },

  async createCharterEvent(data: {
    organizationName: string;
    tripDate: Date;
    pickupAddress: string;
    destinationAddress: string;
    numberOfBuses: number;
    contactName: string;
    contactPhone?: string;
  }): Promise<string | null> {
    return this.createTripEvent({
      tripId: "charter_" + Date.now(),
      organizationName: data.organizationName,
      contactName: data.contactName,
      pickupAddress: data.pickupAddress,
      destinationAddress: data.destinationAddress,
      stagingTime: data.tripDate,
      numberOfBuses: data.numberOfBuses,
      numberOfStudents: 30,
    });
  }
};

export const googleCalendarService = googleCalendar;

