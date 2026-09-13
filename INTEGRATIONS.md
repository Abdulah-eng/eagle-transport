# Eagle Bus Integrations Architecture Guide

This document details the external service integrations, fallback strategies, and webhook endpoints utilized by Eagle Bus.

---

## 1. Stripe Payment Gateway

- **Purpose**: Monthly recurring parent billing, sibling discount handling, and charter trip online payments.
- **Abstraction Layer**: `src/lib/integrations/stripe/index.ts`
- **Fallback**: Automatically defaults to mock mode (`cus_mock_*`, `pi_mock_*`) if `STRIPE_SECRET_KEY` is omitted in development.
- **Webhook Route**: `/api/stripe/webhook`
  - Handles `payment_intent.succeeded` & `invoice.payment_succeeded`.
  - Automatically updates database registration status to `PAID_ACTIVE`.

---

## 2. QuickBooks Online Integration

- **Purpose**: Generates official ERP invoices for school district contracts and charter customers.
- **Abstraction Layer**: `src/lib/integrations/quickbooks/index.ts`
- **OAuth Flow**: Standard OAuth2 token exchange with automatic token refresh handler.

---

## 3. Google Calendar API v3

- **Purpose**: Synchronizes charter field trips and bus run schedules into Google Calendar.
- **Abstraction Layer**: `src/lib/integrations/google-calendar/index.ts`
- **Event Creation**: Automated upon driver and bus assignment in `/admin/charter-trips`.

---

## 4. Unified Messaging Service (Twilio & Resend)

- **Purpose**: Urgent SMS alerts to drivers and parents, plus transactional email confirmation & receipts.
- **Abstraction Layer**: `src/lib/integrations/messaging/index.ts`
- **SMS Provider**: Twilio (`twilio` npm package).
- **Email Provider**: Resend / SMTP (`nodemailer` transport).

---

## 5. Traversa CSV Routing Integration

- **Purpose**: Interoperability with Tyler Technologies Traversa routing software.
- **Endpoints**:
  - Export: `/api/admin/traversa/export` (Generates `StudentUploads.csv`).
  - Import: `/api/admin/traversa/import` (Parses routing assignments & stops).
