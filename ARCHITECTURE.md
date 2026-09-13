# Eagle Bus Transportation Management System — Architecture Overview

## Overview

Eagle Bus is a high-availability Next.js 15 enterprise web application designed for school transportation, private parent billing, driver dispatching, and charter field trip automation.

## Technology Stack

- **Framework**: Next.js 15 (App Router, React Server Components, Server Actions)
- **Database & ORM**: PostgreSQL database with Prisma ORM
- **Authentication**: NextAuth.js v5 with Credentials Provider & Role-Based Access Control (RBAC)
- **Styling**: Tailwind CSS v4 & custom HSL dark-mode palette
- **Icons**: Lucide React
- **Integration Abstractions**:
  - **Payment Gateway**: Stripe (PaymentIntents, Webhooks, Customer Subscriptions)
  - **ERP & Accounting**: QuickBooks Online (OAuth2 API, Invoicing)
  - **Calendar Sync**: Google Calendar API v3
  - **Messaging**: Twilio (SMS Broadcast) & Resend (Transactional Email)
  - **Routing Integration**: Traversa CSV Ingestion & Export Engine

---

## User Roles & Access Control Matrix

| Role | Access Scope | Primary Interface |
|---|---|---|
| `EAGLE_ADMIN` | Full System Access | `/admin/*` Dashboard, Schools, Routes, Audit Logs |
| `OFFICE_STAFF` | Operations & Dispatch | `/admin/*` Dispatch Calendar, Registrations, Messaging |
| `SCHOOL_ADMIN` | School Portal | `/school-portal/[schoolId]/*` Active Runs & Invoices |
| `DRIVER` | Driver Mobile Portal | `/driver/manifest` Real-time Student Attendance |
| `PARENT` | Family Portal | `/parent/*` Bus Schedules, Payments, Profile |

---

## Folder Structure

```
eagle-transport/
├── prisma/
│   ├── schema.prisma       # Database models & relationships
│   └── seed/               # Demo data seeding script
├── src/
│   ├── app/                # App Router Routes
│   │   ├── admin/          # Eagle Admin Operations Control Center
│   │   │   ├── audit-logs/
│   │   │   ├── calendar/
│   │   │   ├── charter-trips/
│   │   │   ├── dashboard/
│   │   │   ├── parent-pay/
│   │   │   ├── reports/
│   │   │   ├── registrations/
│   │   │   ├── routes/
│   │   │   ├── schools/
│   │   │   └── settings/
│   │   ├── api/            # REST API & Webhook Handlers
│   │   ├── driver/         # Mobile Attendance Portal
│   │   ├── intake/         # Public Booking Form
│   │   ├── parent/         # Family & Payments Portal
│   │   ├── review/         # Post-Trip Review Automation
│   │   └── school-portal/  # School Partner Portal
│   ├── components/         # Shared UI components
│   └── lib/                # Database client & Integration Abstraction Layers
```
