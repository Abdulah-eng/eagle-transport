/**
 * Messaging Provider Abstraction Layer
 * Allows swapping between Twilio, Resend, SMTP, or any future provider
 * without changing business logic.
 */

export interface MessagePayload {
  to: string;         // phone or email
  cc?: string | string[];
  from?: string;
  subject?: string;   // for email
  body: string;
  html?: string;      // for email
}

export interface MessageResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface MessagingProvider {
  sendSMS(payload: MessagePayload): Promise<MessageResult>;
  sendEmail(payload: MessagePayload): Promise<MessageResult>;
}

// ─── Twilio SMS Provider ──────────────────────────────────────────────────────

import twilio from "twilio";

class TwilioProvider implements MessagingProvider {
  private client: ReturnType<typeof twilio>;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || "";

    if (!accountSid || !authToken) {
      console.warn("[Twilio] Missing credentials. SMS will be mocked.");
    }
    this.client = twilio(accountSid || "AC_placeholder", authToken || "placeholder");
  }

  async sendSMS(payload: MessagePayload): Promise<MessageResult> {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      console.log(`[SMS Mock] To: ${payload.to} | Body: ${payload.body}`);
      return { success: true, externalId: "mock_sms_" + Date.now() };
    }
    try {
      const message = await this.client.messages.create({
        body: payload.body,
        from: payload.from || this.fromNumber,
        to: payload.to,
      });
      return { success: true, externalId: message.sid };
    } catch (error: unknown) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }

  async sendEmail(_payload: MessagePayload): Promise<MessageResult> {
    return { success: false, error: "TwilioProvider does not handle email" };
  }
}

// ─── Resend Direct HTTP REST API Provider ─────────────────────────────────────

class ResendProvider implements MessagingProvider {
  async sendSMS(_payload: MessagePayload): Promise<MessageResult> {
    return { success: false, error: "ResendProvider does not handle SMS" };
  }

  async sendEmail(payload: MessagePayload): Promise<MessageResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(`[Email Mock] To: ${payload.to} | Subject: ${payload.subject} | Body: ${payload.body}`);
      return { success: true, externalId: "mock_email_" + Date.now() };
    }

    const defaultFrom = process.env.EMAIL_FROM || "Info@eaglebusservice.com";
    let fromAddress = payload.from || defaultFrom;

    try {
      const emailBody: any = {
        from: fromAddress,
        to: [payload.to],
        reply_to: "Info@eaglebusservice.com",
        subject: payload.subject || "Eagle Bus Service Notification",
        text: payload.body,
        html: payload.html || `<p>${payload.body}</p>`,
      };

      if (payload.cc) {
        emailBody.cc = Array.isArray(payload.cc) ? payload.cc : [payload.cc];
      }

      let res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailBody),
      });

      let data = await res.json();

      if (!res.ok) {
        console.error(`[Resend Email Error for ${fromAddress}] HTTP ${res.status}:`, data);
        
        // If sending from custom domain failed because it's not verified on resend.com/domains
        if (data?.statusCode === 403 || data?.name === "validation_error" || data?.message?.includes("verify a domain")) {
          return {
            success: false,
            error: `Domain "${fromAddress}" is not verified in Resend. Please complete DNS verification at https://resend.com/domains and click 'Verify'.`
          };
        }

        return { success: false, error: data.message || "Failed to send email via Resend API" };
      }

      console.log(`[Resend Email Success] ID: ${data.id} sent to ${payload.to}`);
      return { success: true, externalId: data.id };
    } catch (error: any) {
      console.error(`[Resend Email Exception]:`, error);
      return { success: false, error: error.message };
    }
  }
}

// ─── Unified Messaging Service ────────────────────────────────────────────────

const smsProvider = new TwilioProvider();
const emailProvider = new ResendProvider();

export const messaging = {
  async sendSMS(to: string, body: string): Promise<MessageResult> {
    return smsProvider.sendSMS({ to, body });
  },

  async sendSms(to: string, body: string): Promise<MessageResult> {
    return smsProvider.sendSMS({ to, body });
  },

  async sendEmail(to: string, subject: string, body: string, html?: string, cc?: string | string[]): Promise<MessageResult> {
    return emailProvider.sendEmail({ to, subject, body, html, cc });
  },

  async notifyDriver(
    driver: { phone?: string | null; email: string; firstName: string },
    trip: {
      organizationName: string;
      tripDate: Date;
      pickupAddress: string;
      destinationAddress: string;
      stagingTime?: Date | null;
    }
  ): Promise<void> {
    const dateStr = new Date(trip.tripDate).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const stagingStr = trip.stagingTime
      ? new Date(trip.stagingTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "TBD";

    const message = `Eagle Bus - Trip Assignment\nDriver: ${driver.firstName}\nTrip: ${trip.organizationName}\nDate: ${dateStr}\nStaging: ${stagingStr}\nPickup: ${trip.pickupAddress}\nDestination: ${trip.destinationAddress}`;

    const promises: Promise<MessageResult>[] = [];
    if (driver.phone) promises.push(this.sendSMS(driver.phone, message));
    promises.push(this.sendEmail(
      driver.email,
      `Trip Assignment: ${trip.organizationName} - ${dateStr}`,
      message,
      `<p><strong>Eagle Bus - Trip Assignment</strong></p>
       <p><strong>Driver:</strong> ${driver.firstName}</p>
       <p><strong>Organization:</strong> ${trip.organizationName}</p>
       <p><strong>Date:</strong> ${dateStr}</p>
       <p><strong>Staging Time:</strong> ${stagingStr}</p>
       <p><strong>Pickup:</strong> ${trip.pickupAddress}</p>
       <p><strong>Destination:</strong> ${trip.destinationAddress}</p>`
    ));
    await Promise.all(promises);
  },

  async sendBookingConfirmation(
    contact: { email: string; name: string },
    trip: { 
      id: string;
      organizationName: string; 
      tripDate: Date; 
      stagingTime?: Date | string | null;
      returnTime?: Date | string | null;
      pickupAddress?: string | null;
      destinationAddress?: string | null;
      numberOfStudents?: number | null;
      numberOfBuses?: number | null;
      billingName?: string | null;
      billingEmail?: string | null;
      billingPhone?: string | null;
      specialInstructions?: string | null;
    }
  ): Promise<void> {
    const dateStr = new Date(trip.tripDate).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const stagingStr = trip.stagingTime 
      ? (trip.stagingTime instanceof Date ? trip.stagingTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : String(trip.stagingTime))
      : "TBD";
    const returnStr = trip.returnTime 
      ? (trip.returnTime instanceof Date ? trip.returnTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : String(trip.returnTime))
      : "TBD";

    const textBody = `Hello ${contact.name},\n\nYour field trip request for ${trip.organizationName} on ${dateStr} has been received.\n\n` +
      `Trip Details:\n` +
      `• Organization: ${trip.organizationName}\n` +
      `• Date: ${dateStr}\n` +
      `• Staging Time: ${stagingStr}\n` +
      `• Pickup Location: ${trip.pickupAddress || 'TBD'}\n` +
      `• Destination: ${trip.destinationAddress || 'TBD'}\n` +
      `• Passengers: ${trip.numberOfStudents || 'N/A'}\n` +
      `• Buses Requested: ${trip.numberOfBuses || 1}\n` +
      `• Billing Contact: ${trip.billingName || contact.name} (${trip.billingEmail || contact.email})\n` +
      (trip.specialInstructions ? `• Notes: ${trip.specialInstructions}\n` : '') +
      `\nReference ID: ${trip.id}\n\nOur team will review your request and send you a formal quote shortly.\n\nThank you for choosing Eagle Bus!\n\nEagle Bus Transportation Services`;

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 28px 24px; text-align: left;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; font-weight: 700; margin-bottom: 4px;">Eagle Bus Transportation</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Trip Request Confirmation</h1>
        </div>
        
        <div style="padding: 24px; color: #1e293b;">
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${contact.name}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Thank you for submitting your transportation request. Your trip details have been recorded and are currently under review by our dispatch team.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-b: 1px solid #e2e8f0; padding-bottom: 6px;">Submitted Trip Summary</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr><td style="padding: 6px 0; color: #64748b; width: 40%;">Organization:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${trip.organizationName}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Reference ID:</td><td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #2563eb;">${trip.id}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Trip Date:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${dateStr}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Staging / Pickup Time:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${stagingStr}</td></tr>
              ${trip.returnTime ? `<tr><td style="padding: 6px 0; color: #64748b;">Return / Dropoff Time:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${returnStr}</td></tr>` : ''}
              <tr><td style="padding: 6px 0; color: #64748b;">Pickup Address:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${trip.pickupAddress || 'TBD'}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Destination Address:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${trip.destinationAddress || 'TBD'}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Passengers / Buses:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${trip.numberOfStudents || 'N/A'} passengers (${trip.numberOfBuses || 1} bus/es)</td></tr>
              <tr><td style="padding: 6px 0; color: #64748b;">Billing Contact:</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${trip.billingName || contact.name} (${trip.billingEmail || contact.email})</td></tr>
              ${trip.specialInstructions ? `<tr><td style="padding: 6px 0; color: #64748b;">Special Instructions:</td><td style="padding: 6px 0; color: #475569;">${trip.specialInstructions}</td></tr>` : ''}
            </table>
          </div>

          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Our team will evaluate bus & driver availability and send you an official quote within 1-2 business days.</p>

          <p style="margin-top: 24px; color: #64748b; font-size: 12px; border-t: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
            Eagle Bus Transportation Services • <a href="https://eaglebusconnect.com" style="color: #2563eb; text-decoration: none;">theeaglebus.com</a> • (704) 606-5661
          </p>
        </div>
      </div>`;

    await this.sendEmail(
      contact.email,
      `Trip Request Confirmed - ${trip.organizationName}`,
      textBody,
      htmlBody
    );
  },
};

export const messagingService = messaging;
