import { redirect } from "next/navigation";
import { quickbooksService } from "@/lib/integrations/quickbooks";

export async function GET() {
  const authUrl = quickbooksService.getAuthUrl();
  redirect(authUrl);
}
