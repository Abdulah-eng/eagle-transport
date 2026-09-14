-- ─────────────────────────────────────────────────────────────
-- SUPABASE AUTH & USERS SYNC SCRIPT
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kklmxdbjhnxgmmlvmqoq/sql/new
-- Password for ALL accounts: password123
-- ─────────────────────────────────────────────────────────────

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Upsert Accounts into Application Database (public.users)
-- (Used by NextAuth & Prisma for role-based access control)
INSERT INTO "users" ("id", "email", "name", "password", "role", "isActive", "createdAt", "updatedAt")
VALUES 
  ('usr_admin_001', 'admin@eaglebus.com', 'Eagle Admin', '$2a$10$7Z8q.mZg/0kK22g3eR41UOPW.YnFm8Z3xX2r1wE0v9y8u7t6s5r4q', 'EAGLE_ADMIN', true, NOW(), NOW()),
  ('usr_staff_001', 'dispatch@eaglebus.com', 'Dispatch Staff', '$2a$10$7Z8q.mZg/0kK22g3eR41UOPW.YnFm8Z3xX2r1wE0v9y8u7t6s5r4q', 'OFFICE_STAFF', true, NOW(), NOW()),
  ('usr_school_001', 'admin@lincolnhigh.org', 'Lincoln Admin', '$2a$10$7Z8q.mZg/0kK22g3eR41UOPW.YnFm8Z3xX2r1wE0v9y8u7t6s5r4q', 'SCHOOL_ADMIN', true, NOW(), NOW()),
  ('usr_school_002', 'principal@lincoln.edu', 'Lincoln Principal', '$2a$10$7Z8q.mZg/0kK22g3eR41UOPW.YnFm8Z3xX2r1wE0v9y8u7t6s5r4q', 'SCHOOL_ADMIN', true, NOW(), NOW()),
  ('usr_driver_001', 'john.driver@eaglebus.com', 'John Smith', '$2a$10$7Z8q.mZg/0kK22g3eR41UOPW.YnFm8Z3xX2r1wE0v9y8u7t6s5r4q', 'DRIVER', true, NOW(), NOW()),
  ('usr_driver_002', 'driver@eaglebus.com', 'John Driver', '$2a$10$7Z8q.mZg/0kK22g3eR41UOPW.YnFm8Z3xX2r1wE0v9y8u7t6s5r4q', 'DRIVER', true, NOW(), NOW()),
  ('usr_parent_001', 'parent@eaglebus.com', 'Sample Parent', '$2a$10$7Z8q.mZg/0kK22g3eR41UOPW.YnFm8Z3xX2r1wE0v9y8u7t6s5r4q', 'PARENT', true, NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "password" = crypt('password123', gen_salt('bf', 10)),
  "role" = EXCLUDED."role",
  "isActive" = true,
  "updatedAt" = NOW();

-- Update password hashes with guaranteed pgcrypto bcrypt for password123
UPDATE "users" 
SET "password" = crypt('password123', gen_salt('bf', 10))
WHERE "email" IN (
  'admin@eaglebus.com',
  'dispatch@eaglebus.com',
  'admin@lincolnhigh.org',
  'principal@lincoln.edu',
  'john.driver@eaglebus.com',
  'driver@eaglebus.com',
  'parent@eaglebus.com'
);

-- 3. Also Sync into Supabase Dashboard Auth (auth.users)
-- (This makes all accounts appear under Supabase -> Authentication -> Users)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@eaglebus.com', crypt('password123', gen_salt('bf', 10)), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"EAGLE_ADMIN","name":"Eagle Admin"}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'dispatch@eaglebus.com', crypt('password123', gen_salt('bf', 10)), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"OFFICE_STAFF","name":"Dispatch Staff"}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@lincolnhigh.org', crypt('password123', gen_salt('bf', 10)), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"SCHOOL_ADMIN","name":"Lincoln Admin"}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'principal@lincoln.edu', crypt('password123', gen_salt('bf', 10)), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"SCHOOL_ADMIN","name":"Lincoln Principal"}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'john.driver@eaglebus.com', crypt('password123', gen_salt('bf', 10)), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"DRIVER","name":"John Smith"}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'driver@eaglebus.com', crypt('password123', gen_salt('bf', 10)), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"DRIVER","name":"John Driver"}', NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'parent@eaglebus.com', crypt('password123', gen_salt('bf', 10)), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"role":"PARENT","name":"Sample Parent"}', NOW(), NOW(), '', '', '', '')
ON CONFLICT ("email") DO UPDATE SET
  encrypted_password = crypt('password123', gen_salt('bf', 10)),
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = NOW(),
  updated_at = NOW();

-- 4. Create Driver profile if missing
INSERT INTO "drivers" ("id", "userId", "firstName", "lastName", "email", "phone", "licenseNo", "isActive", "createdAt", "updatedAt")
SELECT 'drv_001', id, 'John', 'Smith', email, '(704) 555-0199', 'DL-NC-99882', true, NOW(), NOW()
FROM "users" WHERE "email" = 'john.driver@eaglebus.com'
ON CONFLICT ("userId") DO NOTHING;

-- 5. Create Parent profile if missing
INSERT INTO "parents" ("id", "userId", "firstName", "lastName", "email", "phone1", "createdAt", "updatedAt")
SELECT 'par_001', id, 'Sample', 'Parent', email, '(704) 555-0188', NOW(), NOW()
FROM "users" WHERE "email" = 'parent@eaglebus.com'
ON CONFLICT ("userId") DO NOTHING;
