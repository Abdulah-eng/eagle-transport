-- ─────────────────────────────────────────────────────────────
-- SUPABASE DEMO SEED DATA SCRIPT
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kklmxdbjhnxgmmlvmqoq/sql/new
-- ─────────────────────────────────────────────────────────────

-- 1. Insert Initial Admin & Demo Users (Password: password123 hashed with bcrypt)
INSERT INTO "users" ("id", "email", "name", "password", "role", "isActive", "createdAt", "updatedAt")
VALUES 
  ('usr_admin_001', 'admin@eaglebus.com', 'Eagle Admin', '$2a$10$wT5H8lU0uK7BwZq6L6E2o.E4nFvQW6k7M8L9N0P1Q2R3S4T5U6V7W', 'EAGLE_ADMIN', true, NOW(), NOW()),
  ('usr_staff_001', 'dispatch@eaglebus.com', 'Dispatch Office', '$2a$10$wT5H8lU0uK7BwZq6L6E2o.E4nFvQW6k7M8L9N0P1Q2R3S4T5U6V7W', 'OFFICE_STAFF', true, NOW(), NOW()),
  ('usr_school_001', 'admin@lincolnhigh.org', 'Lincoln Admin', '$2a$10$wT5H8lU0uK7BwZq6L6E2o.E4nFvQW6k7M8L9N0P1Q2R3S4T5U6V7W', 'SCHOOL_ADMIN', true, NOW(), NOW()),
  ('usr_driver_001', 'john.driver@eaglebus.com', 'John Smith', '$2a$10$wT5H8lU0uK7BwZq6L6E2o.E4nFvQW6k7M8L9N0P1Q2R3S4T5U6V7W', 'DRIVER', true, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- 2. Insert Driver Profile
INSERT INTO "drivers" ("id", "userId", "firstName", "lastName", "email", "phone", "licenseNo", "isActive", "createdAt", "updatedAt")
VALUES 
  ('drv_001', 'usr_driver_001', 'John', 'Smith', 'john.driver@eaglebus.com', '(704) 555-0199', 'DL-NC-99882', true, NOW(), NOW())
ON CONFLICT ("userId") DO NOTHING;

-- 3. Insert Active Fleet Buses
INSERT INTO "buses" ("id", "busNumber", "make", "model", "year", "capacity", "licensePlate", "isActive", "createdAt", "updatedAt")
VALUES 
  ('bus_101', '101', 'Blue Bird', 'Vision', 2024, 60, 'EAGLE-101', true, NOW(), NOW()),
  ('bus_102', '102', 'Thomas Built', 'Saf-T-Liner', 2023, 66, 'EAGLE-102', true, NOW(), NOW()),
  ('bus_103', '103', 'IC Bus', 'CE Series', 2024, 60, 'EAGLE-103', true, NOW(), NOW()),
  ('bus_104', '104', 'Blue Bird', 'All American', 2022, 72, 'EAGLE-104', true, NOW(), NOW()),
  ('bus_105', '105', 'Thomas Built', 'Minotour', 2023, 30, 'EAGLE-105', true, NOW(), NOW()),
  ('bus_106', '106', 'Trans Tech', 'ST Series', 2024, 24, 'EAGLE-106', true, NOW(), NOW())
ON CONFLICT ("busNumber") DO NOTHING;

-- 4. Insert Demo Schools
INSERT INTO "schools" ("id", "name", "code", "address", "city", "state", "zipCode", "phone", "email", "isActive", "createdAt", "updatedAt")
VALUES 
  ('sch_lincoln', 'Lincoln High School', 'LHS-2026', '123 Education Way', 'Charlotte', 'NC', '28202', '(704) 555-0100', 'info@lincolnhigh.org', true, NOW(), NOW()),
  ('sch_hell33', 'School - HELL-33', 'HELL-33', '7-A/8 School Campus', 'Charlotte', 'NC', '28205', '(704) 555-0333', 'admin@hell33.edu', true, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- 5. Insert School Settings
INSERT INTO "school_settings" ("id", "schoolId", "amRate", "pmRate", "amPmRate", "siblingDiscount", "maxCapacityPerBus", "requiresSchoolCode", "allowWaitlist", "registrationOpen")
VALUES 
  ('set_lincoln', 'sch_lincoln', 150.00, 150.00, 275.00, 10.00, 60, true, true, true),
  ('set_hell33', 'sch_hell33', 140.00, 140.00, 260.00, 15.00, 60, true, true, true)
ON CONFLICT ("schoolId") DO NOTHING;

-- 6. Insert Demo Charter / Field Trip
INSERT INTO "charter_trips" (
  "id", "schoolId", "organizationName", "contactName", "contactEmail", "contactPhone", 
  "billingName", "billingEmail", "tripDate", "pickupAddress", "stagingTime", 
  "destinationName", "destinationAddress", "tripType", "numberOfBuses", "numberOfStudents", 
  "specialInstructions", "status", "quickbooksInvoiceId", "createdAt", "updatedAt"
)
VALUES (
  'trip_demo_001', 'sch_hell33', 'School - HELL-33 Field Trip', 'Muhammad Abdullah', 'mabdulllaharshad@gmail.com', '03000839301',
  'School - HELL-33', 'mabdulllaharshad@gmail.com', NOW() + INTERVAL '4 days', 'School Main Entrance', NOW() + INTERVAL '4 days' + INTERVAL '8 hours',
  'Science Museum', 'Discovery Place Science, Charlotte', 'FIELD_TRIP', 1, 33,
  'No special instructions', 'INVOICED', '152', NOW(), NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- 7. Insert Invoice
INSERT INTO "invoices" (
  "id", "invoiceNumber", "type", "schoolId", "charterTripId", "billingName", "billingEmail", 
  "amount", "taxAmount", "totalAmount", "status", "dueDate", "quickbooksInvoiceId", "createdAt", "updatedAt"
)
VALUES (
  'inv_demo_001', 'INV-CHARTER-53909', 'CHARTER', 'sch_hell33', 'trip_demo_001', 'School - HELL-33', 'mabdulllaharshad@gmail.com',
  500.00, 0.00, 500.00, 'SENT', NOW() + INTERVAL '7 days', '152', NOW(), NOW()
)
ON CONFLICT ("invoiceNumber") DO NOTHING;
