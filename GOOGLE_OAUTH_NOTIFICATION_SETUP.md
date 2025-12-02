# =============================================================================
# GOOGLE OAUTH & NOTIFICATION CONFIGURATION
# =============================================================================
# Add these settings to your backend/.env file

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Email Notifications (choose one provider)
# Option 1: SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@luxefurniture.com
SENDGRID_FROM_NAME=Luxe Furniture

# Option 2: SMTP (fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@luxefurniture.com

# SMS Notifications (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Web Push Notifications (VAPID)
# Generate keys with: python -c "from pywebpush import Vapid; vapid = Vapid(); vapid.generate_keys(); print(vapid.private_key.decode()); print(vapid.public_key.decode())"
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_ADMIN_EMAIL=admin@luxefurniture.com

# =============================================================================
# SETUP INSTRUCTIONS
# =============================================================================

# 1. Google OAuth Setup:
#    - Go to https://console.cloud.google.com/
#    - Create a new project or select existing
#    - Enable Google+ API
#    - Go to Credentials → Create OAuth 2.0 Client ID
#    - Application type: Web application
#    - Authorized redirect URIs: http://localhost:8000/api/v1/auth/google/callback
#    - Copy Client ID and Client Secret

# 2. SendGrid Setup (Email):
#    - Sign up at https://sendgrid.com/
#    - Create an API key with "Mail Send" permissions
#    - Verify sender identity (email address)

# 3. Twilio Setup (SMS):
#    - Sign up at https://www.twilio.com/
#    - Get Account SID and Auth Token from console
#    - Purchase a phone number

# 4. Web Push Setup (VAPID):
#    - Generate VAPID keys using the command above
#    - Or use online generator: https://vapidkeys.com/

# =============================================================================
# FEATURES
# =============================================================================

# ✅ Google Login
#    - Users can sign in with their Google account
#    - Automatic account linking by verified email
#    - JWT tokens issued for consistent auth

# ✅ Email Notifications
#    - Order status updates (confirmed, shipped, completed)
#    - Promotional campaigns
#    - Templated HTML emails

# ✅ SMS Notifications
#    - Critical order updates
#    - Opt-in required
#    - Rate limited

# ✅ Push Notifications
#    - Real-time browser notifications
#    - Works offline with service worker
#    - Multi-device support

# ✅ User Preferences
#    - Toggle each notification channel
#    - Category-based filtering (orders vs promotions)
#    - GDPR-compliant unsubscribe

# ✅ Automatic Triggers
#    - Order status changes automatically send notifications
#    - Respects user preferences
#    - Retry logic with exponential backoff
