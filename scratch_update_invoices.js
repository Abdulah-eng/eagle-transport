const fs = require('fs');

async function main() {
  const envText = fs.readFileSync('.env', 'utf8');
  const supaUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\r\n]+)"?/)?.[1];
  const supaKey = envText.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\r\n]+)"?/)?.[1];

  if (!supaUrl || !supaKey) {
    console.error("Missing Supabase credentials in .env");
    return;
  }

  console.log("Fetching existing invoices from Supabase REST...");
  const res = await fetch(`${supaUrl}/rest/v1/invoices?select=*`, {
    headers: {
      'apikey': supaKey,
      'Authorization': `Bearer ${supaKey}`
    }
  });

  if (!res.ok) {
    console.error("Failed to fetch invoices:", await res.text());
    return;
  }

  const invoices = await res.json();
  console.log(`Found ${invoices.length} invoices in Supabase.`);

  for (const inv of invoices) {
    console.log(`Updating invoice ${inv.id} (${inv.invoiceNumber}) quickbooksInvoiceId to '149'...`);
    const patchRes = await fetch(`${supaUrl}/rest/v1/invoices?id=eq.${inv.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supaKey,
        'Authorization': `Bearer ${supaKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quickbooksInvoiceId: '149',
        updatedAt: new Date().toISOString()
      })
    });
    console.log(`Updated ${inv.id}: status ${patchRes.status}`);
  }
}

main().catch(console.error);
