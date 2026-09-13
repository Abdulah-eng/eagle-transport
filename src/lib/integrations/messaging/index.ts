/**
 * Messaging Provider Abstraction Layer
 * Allows swapping between Twilio, Resend, SMTP, or any future provider
 * without changing business logic.
 */

export interface MessagePayload {
  to: string;         // phone or email
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

    const defaultFrom = process.env.EMAIL_FROM || "noreply@toolsforyou.site";
    let fromAddress = payload.from || defaultFrom;

    try {
      let res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [payload.to],
          subject: payload.subject || "Eagle Bus Service Notification",
          text: payload.body,
          html: payload.html || `<p>${payload.body}</p>`,
        }),
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

  async sendEmail(to: string, subject: string, body: string, html?: string): Promise<MessageResult> {
    return emailProvider.sendEmail({ to, subject, body, html });
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
    trip: { organizationName: string; tripDate: Date; id: string }
  ): Promise<void> {
    const dateStr = new Date(trip.tripDate).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    await this.sendEmail(
      contact.email,
      `Trip Request Confirmed - ${trip.organizationName}`,
      `Hello ${contact.name},\n\nYour field trip request for ${trip.organizationName} on ${dateStr} has been received.\n\nOur team will review your request and send you a quote shortly.\n\nReference ID: ${trip.id}\n\nThank you for choosing Eagle Bus!\n\nEagle Bus Transportation`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Eagle Bus Transportation</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Trip Request Confirmation</p>
        </div>
        <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <p>Hello <strong>${contact.name}</strong>,</p>
          <p>Your field trip request has been received and is under review.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Organization</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${trip.organizationName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Trip Date</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${dateStr}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Reference ID</td><td style="padding: 8px; font-family: monospace;">${trip.id}</td></tr>
          </table>
          <p>Our team will review your request and send you a quote shortly. You can expect to hear from us within 1-2 business days.</p>
          <p style="margin-top: 24px; color: #64748b; font-size: 14px;">Eagle Bus Transportation Service | theeaglebus.com</p>
        </div>
      </div>`
    );
  },
};

export const messagingService = messaging;
