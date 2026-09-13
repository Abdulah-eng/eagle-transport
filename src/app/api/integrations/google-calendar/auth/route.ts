import { redirect } from "next/navigation";
import { googleCalendarService } from "@/lib/integrations/google-calendar";

export async function GET() {
  const authUrl = googleCalendarService.getAuthUrl();
  redirect(authUrl);
}
