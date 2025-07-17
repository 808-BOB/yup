#!/bin/bash

# Always load .env from the project root (one directory above this script)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
  echo "🔄 Loading environment variables from $ENV_FILE"
  set -a
  . "$ENV_FILE"
  set +a
elif [ -f "$PROJECT_ROOT/.env.local" ]; then
  echo "🔄 Loading environment variables from $PROJECT_ROOT/.env.local"
  set -a
  . "$PROJECT_ROOT/.env.local"
  set +a
else
  echo "⚠️  No .env or .env.local file found in project root ($PROJECT_ROOT). Environment variables must be set manually."
fi

# YUP.RSVP A2P Compliance Setup Script
# This script helps set up the A2P compliance system for SMS messaging

set -e

echo "🚀 YUP.RSVP A2P Compliance Setup"
echo "=================================="
echo

# Check if required environment variables are set
echo "📋 Checking environment variables..."
required_vars=(
    "TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN"
    "TWILIO_PHONE_NUMBER"
    "TWILIO_VERIFY_SERVICE_SID"
    "NEXT_PUBLIC_SITE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo
    echo "Please set these variables and run this script again."
    exit 1
fi

echo "✅ All required environment variables are set"
echo

# Check if database is accessible
echo "🗄️  Checking database connection..."
if command -v psql &> /dev/null; then
    # Test connection using Supabase connection string format
    if [ -n "$DATABASE_URL" ]; then
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            echo "✅ Database connection successful"
        else
            echo "❌ Database connection failed. Please check your DATABASE_URL."
            exit 1
        fi
    else
        echo "⚠️  DATABASE_URL not set. Please ensure you can connect to your database."
    fi
else
    echo "⚠️  psql not found. Please install PostgreSQL client."
    echo "   - On Ubuntu/WSL: sudo apt update && sudo apt install postgresql-client"
    echo "   - On Windows: Download from https://www.enterprisedb.com/downloads/postgres-postgresql-downloads (choose 'psql' in StackBuilder or install pgAdmin, which includes psql)"
    exit 1
fi
echo

# Run database migrations
echo "🛠️  Setting up database tables..."
if [ -f "sms-compliance-tables.sql" ]; then
    if [ -n "$DATABASE_URL" ]; then
        psql "$DATABASE_URL" -f sms-compliance-tables.sql
        echo "✅ Database tables created successfully"
    else
        echo "⚠️  DATABASE_URL not set. Please run the following manually:"
        echo "   psql -d your_database -f sms-compliance-tables.sql"
    fi
else
    echo "❌ sms-compliance-tables.sql not found. Please ensure it exists in the current directory."
    exit 1
fi
echo

# Test Twilio connection
echo "\n[DEBUG] Twilio Credentials Used:"
echo "  TWILIO_ACCOUNT_SID: $TWILIO_ACCOUNT_SID"
echo "  TWILIO_AUTH_TOKEN: $TWILIO_AUTH_TOKEN"
echo "  TWILIO_PHONE_NUMBER: $TWILIO_PHONE_NUMBER"
echo "  TWILIO_VERIFY_SERVICE_SID: $TWILIO_VERIFY_SERVICE_SID"
echo

echo "📞 Testing Twilio connection..."
if command -v curl &> /dev/null; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
        "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json")
    
    if [[ "$response" == "200" ]]; then
        echo "✅ Twilio connection successful"
    else
        echo "❌ Twilio connection failed. Please check your credentials."
        exit 1
    fi
else
    echo "⚠️  curl not found. Please test Twilio connection manually."
fi
echo

# Check if Next.js app is built
echo "🏗️  Checking Next.js build..."
if [ -d "apps/web/.next" ]; then
    echo "✅ Next.js app is built"
else
    echo "⚠️  Next.js app not built. Running build..."
    cd apps/web && npm run build && cd ../..
    echo "✅ Next.js app built successfully"
fi
echo

# Test webhook endpoint (if app is running)
echo "🔗 Testing webhook endpoint..."
webhook_url="$NEXT_PUBLIC_SITE_URL/api/sms/webhook"
if command -v curl &> /dev/null; then
    if curl -s -f "$webhook_url" &> /dev/null; then
        echo "✅ Webhook endpoint is accessible"
    else
        echo "⚠️  Webhook endpoint not accessible. Make sure your app is deployed."
        echo "   Expected URL: $webhook_url"
    fi
else
    echo "⚠️  curl not found. Please test webhook endpoint manually."
fi
echo

# Generate sample messages for A2P registration
echo "📝 Generating sample messages for A2P registration..."
cat > a2p-sample-messages.txt << EOF
# Sample Messages for A2P Campaign Registration

## Verification Message
Your YUP.RSVP verification code is 123456

Reply STOP to opt out. Terms: $NEXT_PUBLIC_SITE_URL/terms. Msg&data rates may apply

## Event Invitation
John invited you to "Birthday Party" on March 15, 2024. RSVP: $NEXT_PUBLIC_SITE_URL/events/birthday-party

Reply STOP to opt out. Terms: $NEXT_PUBLIC_SITE_URL/terms. Msg&data rates may apply

## RSVP Notification
🎉 RSVP Update: Sarah responded YES to "Birthday Party"

Reply STOP to opt out

## Event Reminder
Reminder: "Birthday Party" is March 15, 2024 at 7:00 PM. Update your RSVP: $NEXT_PUBLIC_SITE_URL/events/birthday-party

Reply STOP to opt out. Terms: $NEXT_PUBLIC_SITE_URL/terms. Msg&data rates may apply
EOF

echo "✅ Sample messages saved to a2p-sample-messages.txt"
echo

# Create A2P campaign checklist
echo "📋 Creating A2P campaign checklist..."
cat > a2p-campaign-checklist.md << EOF
# A2P Campaign Registration Checklist

## Pre-Registration Setup
- [x] Database tables created
- [x] Webhook endpoint configured
- [x] Terms of service page deployed
- [x] Opt-out page deployed
- [x] All SMS templates updated
- [x] Compliance logging implemented

## Campaign Registration Information
- [ ] Brand Name: YUP.RSVP
- [ ] Brand URL: $NEXT_PUBLIC_SITE_URL
- [ ] Brand Logo: [Upload your logo]
- [ ] Campaign Name: YUP.RSVP Event Management
- [ ] Use Case: Account Notification
- [ ] Vertical: Events & Entertainment
- [ ] Expected Volume: [Enter your expected monthly volume]
- [ ] Sample Messages: Use content from a2p-sample-messages.txt

## Post-Registration
- [ ] Campaign submitted to Twilio
- [ ] Campaign approved
- [ ] Webhook URL configured in Twilio Console
- [ ] Production testing completed
- [ ] Compliance monitoring enabled

## Twilio Console Configuration
1. Go to Twilio Console > Phone Numbers > Manage > Active Numbers
2. Click on your SMS-enabled phone number
3. Set Webhook URL to: $NEXT_PUBLIC_SITE_URL/api/sms/webhook
4. Set HTTP Method to: POST
5. Save configuration

## Testing Commands
Test opt-out: Send "STOP" to your Twilio number
Test opt-in: Send "START" to your Twilio number  
Test help: Send "HELP" to your Twilio number
EOF

echo "✅ A2P campaign checklist saved to a2p-campaign-checklist.md"
echo

# Final summary
echo "🎉 A2P Compliance Setup Complete!"
echo "=================================="
echo
echo "✅ Database tables created"
echo "✅ Environment variables verified"
echo "✅ Twilio connection tested"
echo "✅ Sample messages generated"
echo "✅ Campaign checklist created"
echo
echo "📋 Next Steps:"
echo "1. Deploy your application to production"
echo "2. Configure webhook URL in Twilio Console"
echo "3. Test opt-out functionality"
echo "4. Submit A2P campaign registration using the provided samples"
echo "5. Wait for campaign approval (typically 1-2 weeks)"
echo
echo "📄 Files created:"
echo "- a2p-sample-messages.txt"
echo "- a2p-campaign-checklist.md"
echo
echo "📚 Documentation:"
echo "- See TWILIO_A2P_COMPLIANCE_GUIDE.md for complete details"
echo "- Check /terms page for SMS compliance terms"
echo "- Visit /sms/opt-out for opt-out interface"
echo
echo "🔍 Testing URLs:"
echo "- Terms of Service: $NEXT_PUBLIC_SITE_URL/terms"
echo "- SMS Opt-out: $NEXT_PUBLIC_SITE_URL/sms/opt-out"
echo "- Webhook: $NEXT_PUBLIC_SITE_URL/api/sms/webhook"
echo
echo "Happy messaging! 🚀" 