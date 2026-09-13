# Eagle Bus Environment Variables Reference

Below is the complete reference of environment variables required or supported by Eagle Bus.

```env
# -----------------------------------------------------------------------------
# DATABASE & AUTHENTICATION
# -----------------------------------------------------------------------------
DATABASE_URL="postgresql://postgres:password@localhost:5432/eagle_transport?schema=public"
NEXTAUTH_SECRET="your-nextauth-secret-key-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# -----------------------------------------------------------------------------
# STRIPE PAYMENTS
# -----------------------------------------------------------------------------
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# -----------------------------------------------------------------------------
# QUICKBOOKS ONLINE
# -----------------------------------------------------------------------------
QUICKBOOKS_CLIENT_ID="your-qb-client-id"
QUICKBOOKS_CLIENT_SECRET="your-qb-client-secret"
QUICKBOOKS_REDIRECT_URI="http://localhost:3000/api/quickbooks/callback"
QUICKBOOKS_ENVIRONMENT="sandbox" # or 'production'

# -----------------------------------------------------------------------------
# GOOGLE CALENDAR
# -----------------------------------------------------------------------------
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALENDAR_ID="primary"

# -----------------------------------------------------------------------------
# TWILIO SMS
# -----------------------------------------------------------------------------
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM_NUMBER="+15550192834"

# -----------------------------------------------------------------------------
# RESEND EMAIL
# -----------------------------------------------------------------------------
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@theeaglebus.com"
```
