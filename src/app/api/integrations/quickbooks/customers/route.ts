import { NextResponse } from "next/server";
import { quickbooksService } from "@/lib/integrations/quickbooks";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const customers = await quickbooksService.searchCustomers(query);
    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error("[QB_CUSTOMERS_GET]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
