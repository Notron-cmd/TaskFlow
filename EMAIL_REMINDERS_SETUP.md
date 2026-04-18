# Email Reminders Setup Guide

## Current Status
Email reminders are saved in the database but not yet automatically sent. This requires setting up an email service and a scheduled job.

## Prerequisites
Choose ONE email service provider:

### Option 1: Resend (Recommended for Next.js)
1. Install Resend: `npm install resend`
2. Get API key from https://resend.com
3. Add to `.env.local`: `RESEND_API_KEY=your_key`

### Option 2: SendGrid
1. Create account at https://sendgrid.com
2. Get API key
3. Add to `.env.local`: `SENDGRID_API_KEY=your_key`

### Option 3: Mailgun
1. Create account at https://mailgun.com
2. Get API credentials
3. Add to `.env.local`: `MAILGUN_DOMAIN=` and `MAILGUN_API_KEY=`

## Setup Options

### Option A: Supabase Edge Functions (Serverless)
1. Create function: `supabase functions new send-reminders`
2. Deploy with cron job: `--schedule '*/5 * * * *'` (every 5 minutes)
3. Function fetches reminders where `scheduled_at <= now()` and `sent = false`
4. Send emails via chosen provider
5. Mark as sent in database

### Option B: External Cron Service
1. Use Cron-job.org or AWS Lambda
2. Call Next.js API endpoint every 5 minutes
3. Endpoint: `/api/reminders/send`
4. API handles fetching and sending

### Option C: Node-Cron (Development Only)
1. Run background job in development
2. Production: Use one of the above

## Implementation Steps

1. **Add email service configuration:**
   ```typescript
   // lib/email/provider.ts
   import { Resend } from 'resend';
   
   export const resend = new Resend(process.env.RESEND_API_KEY);
   ```

2. **Create reminder email template:**
   ```typescript
   // lib/email/templates/reminder.tsx
   // Use React Email for email templates
   ```

3. **Create scheduled task to send reminders:**
   ```typescript
   // app/api/reminders/send/route.ts
   // Fetch pending reminders
   // Send emails
   // Update sent status
   ```

4. **Test with in-app reminders first:**
   - In-app reminders are already implemented ✅
   - Email/Push reminders follow same pattern
   - Test flow on /reminders page

## Current Workaround
For now, reminders work with:
- ✅ In-App notifications (immediate, UI updates)
- ⏳ Email notifications (saved in DB, needs scheduler)
- ⏳ Push notifications (needs service worker setup)

## Next Steps
1. Choose email provider
2. Set up credentials in `.env.local`
3. Implement email service
4. Deploy scheduled job
5. Test end-to-end

## Testing
```bash
# Test creating reminder with email channel
# Should see reminder in /reminders page
# Email should arrive if scheduler is running
```
