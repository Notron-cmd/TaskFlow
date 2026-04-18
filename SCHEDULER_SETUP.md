# Reminder Scheduler Setup Guide

The email reminder endpoint is ready at `/api/reminders/send`. Now you need a scheduler to call it regularly.

## Prerequisites
You need these in `.env.local`:
```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@taskflow.app
CRON_SECRET_KEY=your_random_secure_token_here
```

Generate secure token:
```bash
openssl rand -hex 32
# or use online generator: https://generate.plus/en/hash
```

## Option 1: Cron-Job.org (FREE & EASIEST) ⭐

### Step 1: Create Account
1. Go to https://cron-job.org/
2. Sign up (free account)

### Step 2: Create New Cronjob
1. Click "Create Cronjob"
2. Fill in:
   - **URL**: `https://yourdomain.com/api/reminders/send`
   - **Schedule**: Every 5 minutes (or 10)
   - **HTTP Method**: POST

### Step 3: Add Headers
1. Click "Advanced" or show more options
2. Add custom header:
   - **Key**: `Authorization`
   - **Value**: `Bearer your_cron_secret_key_here`

### Step 4: Test
1. Click "Save"
2. You should see logs when cronjob runs
3. Check your TaskFlow reminders page - should have email reminders

✅ That's it! Emails will send automatically.

---

## Option 2: Supabase Edge Functions (SERVERLESS)

### Step 1: Create Function
```bash
supabase functions new send-reminders
```

### Step 2: Update Function Code
File: `supabase/functions/send-reminders/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  // Get your production domain URL
  const PRODUCTION_URL = Deno.env.get("PRODUCTION_URL")
  const CRON_SECRET = Deno.env.get("CRON_SECRET_KEY")

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/reminders/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    })

    return response
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### Step 3: Deploy with Schedule
```bash
supabase functions deploy send-reminders \
  --project-ref your_project_id \
  --schedule "*/5 * * * *"
```

### Step 4: Add Secrets
```bash
supabase secrets set \
  PRODUCTION_URL="https://yourdomain.com" \
  CRON_SECRET_KEY="your_token_here"
```

---

## Option 3: AWS Lambda + EventBridge

### Step 1: Create Lambda Function
1. Go to AWS Console → Lambda
2. Create new function (Node.js 18)
3. Copy this code:

```javascript
const https = require('https');

exports.handler = async (event) => {
  const url = new URL(process.env.PRODUCTION_URL + '/api/reminders/send');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
};
```

### Step 2: Add Environment Variables
1. Configuration → Environment variables
2. Add:
   - `PRODUCTION_URL`: `https://yourdomain.com`
   - `CRON_SECRET_KEY`: `your_token_here`

### Step 3: Create EventBridge Rule
1. Go to EventBridge
2. Create rule:
   - **Schedule**: Rate(5 minutes)
   - **Target**: Your Lambda function

---

## Option 4: GitHub Actions (FREE)

Create `.github/workflows/send-reminders.yml`:

```yaml
name: Send Reminders

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send reminders
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_KEY }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.PRODUCTION_URL }}/api/reminders/send"
```

Then add secrets in GitHub:
1. Settings → Secrets and variables → Actions
2. Add:
   - `PRODUCTION_URL`: `https://yourdomain.com`
   - `CRON_SECRET_KEY`: `your_token_here`

---

## Testing the Setup

### Test 1: Manual API Call
```bash
curl -X POST \
  -H "Authorization: Bearer your_cron_secret_key_here" \
  https://yourdomain.com/api/reminders/send
```

Expected response:
```json
{
  "success": true,
  "message": "Processed 0 reminders",
  "count": 0,
  "sent": 0,
  "failed": 0
}
```

### Test 2: Create Test Reminder
1. Go to board
2. Create task with:
   - Due date: within next 5 minutes
   - Add reminder: 5 min before
   - Channel: Email
3. Wait for cronjob to run
4. Check email inbox
5. Check reminders page - should show as "Sent"

### Test 3: Check Logs

**Supabase**: Function logs in Supabase dashboard
**Lambda**: CloudWatch logs
**GitHub Actions**: Workflow logs in Actions tab
**Cron-Job.org**: Execution history on dashboard

---

## Troubleshooting

### Email not sending
- [ ] Check RESEND_API_KEY is valid
- [ ] Check RESEND_FROM_EMAIL is verified in Resend
- [ ] Check CRON_SECRET_KEY matches Authorization header
- [ ] Check task has email channel reminder
- [ ] Check due date is correct (UTC timezone)

### Cronjob not running
- [ ] Check scheduler is active (cron-job.org)
- [ ] Check response status is 200
- [ ] Check server is accessible from internet (not localhost)
- [ ] Check Authorization header is correct

### Reminders marked as sent but no email
- [ ] Check Resend API quota
- [ ] Check email spam folder
- [ ] Verify email address in user profile
- [ ] Check email provider error logs

---

## Production Checklist

- [ ] RESEND_API_KEY added to production `.env`
- [ ] RESEND_FROM_EMAIL is verified in Resend
- [ ] CRON_SECRET_KEY is strong and random
- [ ] Scheduler is active and running
- [ ] Test reminder sent successfully
- [ ] Users can see sent reminders in history
- [ ] Monitor logs for errors

---

## Monitoring

Add this to your dashboard or monitoring:
- Track `/api/reminders/send` endpoint response time
- Alert if error rate > 5%
- Daily email count for health check
- Failed reminder count

Example: `sent < reminders_count` = investigate failures

