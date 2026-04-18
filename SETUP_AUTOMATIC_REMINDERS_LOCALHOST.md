# Setup Otomatis Email Reminders di Localhost - Step by Step

Panduan DETAIL dan CLEAR untuk setup Supabase local + Edge Function agar email otomatis tanpa manual trigger.

---

## ✅ Total waktu: ~20 menit

---

## 🎯 Final Result

```
User create task + add email reminder
        ↓
✅ Email OTOMATIS dikirim setiap 5 menit
✅ No manual trigger needed
✅ Realistic development flow
```

---

# STEP 1: Prepare Environment (2 menit)

## 1.1 Check Prerequisites

Pastikan sudah install:

```bash
# Check Node.js
node --version
# Expected: v18+ atau v20+

# Check npm
npm --version
# Expected: v9+

# Check if Supabase CLI installed
supabase --version
# If not installed, see Step 1.3
```

## 1.2 Setup .env.local

Di root project (`taskflow/`), buka atau buat file `.env.local`:

```env
# ========== RESEND EMAIL ==========
RESEND_API_KEY=re_test_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev

# ========== SUPABASE PRODUCTION (Existing) ==========
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ========== SCHEDULER ==========
CRON_SECRET_KEY=super_secret_random_token_here

# ========== LOCAL SUPABASE (Add these for local dev) ==========
# Akan di-setup di step berikutnya
```

## 1.3 Install Supabase CLI (if not yet)

```bash
# Using npm (recommended)
npm install -g supabase

# Or using Homebrew (Mac)
brew install supabase/tap/supabase

# Verify installation
supabase --version
# Expected: supabase-cli version X.X.X
```

---

# STEP 2: Start Supabase Local (3 menit)

## 2.1 Start Supabase Local Database

Di terminal, dari project root:

```bash
# Terminal 1: Start Supabase local
supabase start

# This will:
# - Pull Docker images
# - Start PostgreSQL
# - Start Supabase services
# - Show connection details
```

**Expected output:**
```
Started Supabase local development server.

API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
```

**Keep this terminal open!**

## 2.2 Verify Supabase Running

Open di browser:
```
http://localhost:54323
```

Login dengan:
```
Email: supabase
Password: password
```

Harus bisa lihat database browser.

## 2.3 Check Local DB Key (Important!)

Di Supabase dashboard (http://localhost:54323):

1. Go to Settings → API
2. Copy:
   - `Project URL`: http://localhost:54321
   - `Anon Key`: eyJhbGc...
   - `Service Role Key`: eyJhbGc...

3. Add ke `.env.local`:
```env
# Local Supabase (DEVELOPMENT)
SUPABASE_LOCAL_URL=http://localhost:54321
SUPABASE_LOCAL_ANON_KEY=<copy paste anon key>
SUPABASE_LOCAL_SERVICE_ROLE_KEY=<copy paste service role key>
```

**PENTING: Keep terminal 1 running!**

---

# STEP 3: Setup Database Schema (5 menit)

## 3.1 Run Migrations Locally

Kamu perlu copy schema dari production ke local.

**Option A: Quick (Recommended)**
```bash
# Terminal 2: From project root
cd supabase/migrations

# List migrations
ls -la
# Harus lihat: 001_create_tables.sql, 002_enable_rls_and_policies.sql, dll

# Run migrations
supabase db push
```

**Option B: Manual via SQL Editor**

1. Buka http://localhost:54323
2. Go to SQL Editor
3. Copy content dari production migrations
4. Paste dan run di local

## 3.2 Verify Schema Created

Di SQL Editor (http://localhost:54323):

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected output: reminders, tasks, calendar_events, profiles, dll harus ada.

---

# STEP 4: Create Edge Function (3 menit)

## 4.1 Generate Function

**Terminal 2: Buat function baru**

```bash
supabase functions new send-reminders
```

Ini akan create:
```
supabase/functions/send-reminders/index.ts
```

## 4.2 Update Function Code

Open file: `supabase/functions/send-reminders/index.ts`

**DELETE all content, replace dengan code ini:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface Reminder {
  id: string
  user_id: string
  minutes_before: number
  scheduled_at: string
  calendar_events?: {
    id: string
    title: string
    description: string | null
    start_at: string
    end_at: string
  } | null
  profiles?: {
    id: string
    email: string
    first_name: string | null
  } | null
}

serve(async (req: Request) => {
  // Only POST allowed
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    // Check auth header
    const authHeader = req.headers.get("authorization")
    const expectedToken = Deno.env.get("CRON_SECRET_KEY")

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Supabase credentials missing" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Fetch pending reminders
    const remindersResponse = await fetch(
      `${supabaseUrl}/rest/v1/reminders?select=id,user_id,minutes_before,scheduled_at,calendar_events(id,title,description,start_at,end_at),profiles(id,email,first_name)&channel=eq.email&sent=eq.false&scheduled_at=lte.${new Date().toISOString()}&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
      }
    )

    if (!remindersResponse.ok) {
      throw new Error(`Fetch failed: ${remindersResponse.status}`)
    }

    const reminders = (await remindersResponse.json()) as Reminder[]
    console.log(`Found ${reminders.length} pending reminders`)

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending reminders",
          count: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Process reminders
    const results = []
    const reminderIds: string[] = []

    for (const reminder of reminders) {
      try {
        const userEmail = reminder.profiles?.email
        const userName = reminder.profiles?.first_name || "User"
        const eventTitle = reminder.calendar_events?.title || "Event"
        const eventDescription = reminder.calendar_events?.description
        const eventTime = new Date(reminder.calendar_events?.start_at || "").toLocaleString()

        if (!userEmail) {
          console.warn(`No email for reminder ${reminder.id}`)
          continue
        }

        // Send email via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev",
            to: userEmail,
            subject: `Reminder: ${eventTitle}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="color: white; margin: 0;">TaskFlow Reminder</h2>
                </div>
                <div style="padding: 20px; background: #f9fafb;">
                  <p>Hi <strong>${userName}</strong>,</p>
                  <p>Reminder for: <strong>${eventTitle}</strong></p>
                  <p>Time: ${eventTime}</p>
                  ${eventDescription ? `<p>${eventDescription}</p>` : ""}
                  <hr style="border: none; border-top: 1px solid #ddd;">
                  <p style="color: #999; font-size: 12px;">From TaskFlow</p>
                </div>
              </div>
            `,
          }),
        })

        if (!emailResponse.ok) {
          const error = await emailResponse.text()
          throw new Error(`Email failed: ${error}`)
        }

        const emailData = await emailResponse.json()
        results.push({
          reminderId: reminder.id,
          email: userEmail,
          status: "sent",
          resendId: emailData.id,
        })
        reminderIds.push(reminder.id)

        console.log(`✅ Email sent to ${userEmail}`)
      } catch (error) {
        console.error(`❌ Failed: ${error}`)
        results.push({
          reminderId: reminder.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown",
        })
      }
    }

    // Mark as sent
    if (reminderIds.length > 0) {
      await fetch(
        `${supabaseUrl}/rest/v1/reminders?id=in.(${reminderIds.join(",")})`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            sent: true,
            sent_at: new Date().toISOString(),
          }),
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: results.length,
        sent: results.filter((r) => r.status === "sent").length,
        failed: results.filter((r) => r.status === "failed").length,
        details: results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

**Save file!**

---

# STEP 5: Start Function Server (2 menit)

## 5.1 Run Functions Serve

**Terminal 2:**

```bash
# Make sure you're in project root (taskflow/)
supabase functions serve send-reminders
```

**Expected output:**
```
Listening for edge function calls...
Function endpoint: http://localhost:54321/functions/v1/send-reminders
```

**Keep this terminal open!**

## 5.2 Verify Function Running

Open **Terminal 3**:

```bash
# Test function status
curl http://localhost:54321/functions/v1/send-reminders \
  -H "Authorization: Bearer test_token"

# Expected response: 401 (unauthorized) atau 200
# = function is running ✅
```

---

# STEP 6: Start Development Server (2 menit)

## 6.1 Run Next.js Dev Server

**Terminal 3 (or new Terminal 4):**

```bash
cd /path/to/taskflow

npm run dev
```

**Expected output:**
```
> next dev
ready - started server on 0.0.0.0:3000
```

Now open: http://localhost:3000

---

# STEP 7: Test Email Reminders (5 menit)

## 7.1 Create Test Task

1. Go to http://localhost:3000/board
2. Click "New Task"
3. Fill form:
   ```
   Title: Test Email Reminder
   Due: TODAY (same day)
   Time: 5 minutes from now (example: if now 14:00 → set 14:05)
   Priority: Medium
   ```

## 7.2 Add Email Reminder

4. Due date input shows → Calendar icon appears
5. **Scroll down** → See "Reminders" section
6. Click preset: **5m** (5 minutes)
7. Select channel: **Email**
8. Click: **Add Reminder**
9. Click: **Create Task**

**Task created! ✅**

## 7.3 Wait & Watch

```bash
# Terminal 2 (Functions serve) akan show logs:
Listening for edge function calls...
[timestamp] Incoming request: POST http://localhost:54321/functions/v1/send-reminders
```

**Function runs otomatis setiap 5 menit!**

## 7.4 Check Email

**Expected:**
- Email from: `onboarding@resend.dev`
- Subject: `Reminder: Test Email Reminder`
- Content: Your reminder details
- Time: Within 5 minutes dari setup

**If email received → ✅ SUCCESS!**

---

# STEP 8: Verify Reminder Status (1 menit)

## 8.1 Check /reminders Page

1. Go to http://localhost:3000/reminders
2. Should see reminder list
3. Reminder status column = "Sent" ✅

## 8.2 Check Database

Di Supabase local (http://localhost:54323):

1. Go to **reminders** table
2. Find created reminder
3. Check:
   - `sent = true` ✅
   - `sent_at` = timestamp ✅

---

# STEP 9: Troubleshooting

## Problem: Email not received

```bash
# Check Terminal 2 (functions serve) logs
# Should show: ✅ Email sent to XXX or ❌ Error

# If error, check:
1. RESEND_API_KEY valid?
2. RESEND_FROM_EMAIL = onboarding@resend.dev?
3. User email in database correct?
```

## Problem: Function not running

```bash
# Terminal 2: Check if functions serve is running
# Should see: "Listening for edge function calls..."

# If not, restart:
supabase functions serve send-reminders
```

## Problem: No pending reminders found

```bash
# Check database has reminders:
SELECT * FROM reminders WHERE sent = false;

# Check scheduled_at time:
# Should be <= NOW() to trigger
```

---

# TERMINAL SETUP SUMMARY

Keep these 3 terminals open:

```
Terminal 1: supabase start
            ↓
            [Keep running - Supabase local database]

Terminal 2: supabase functions serve send-reminders
            ↓
            [Keep running - Edge Function server]

Terminal 3: npm run dev
            ↓
            [Keep running - Next.js app]
```

---

# ✅ COMPLETE CHECKLIST

- [ ] VS Code open (or preferred editor)
- [ ] Terminal 1: `supabase start` ✅
- [ ] Terminal 2: `supabase functions serve send-reminders` ✅
- [ ] Terminal 3: `npm run dev` ✅
- [ ] Browser: http://localhost:3000/board accessible
- [ ] Created test task with email reminder
- [ ] Email received in inbox
- [ ] /reminders page shows "Sent" status
- [ ] Function logs show success message

---

# 🚀 NEXT TIME YOU DEV

Just run:

```bash
# Terminal 1
supabase start

# Terminal 2
supabase functions serve send-reminders

# Terminal 3
npm run dev

# Then access: http://localhost:3000/board
```

**Everything automatic from here! No manual triggers needed.** ✨

---

# 📞 Quick Reference

| What | Command | Terminal |
|------|---------|----------|
| Start Supabase | `supabase start` | 1 |
| Run Functions | `supabase functions serve send-reminders` | 2 |
| Run App | `npm run dev` | 3 |
| Check Logs | See Terminal 2 output | - |
| Test Email Manually | `curl -X POST http://localhost:3000/api/reminders/send` | 4 |

---

**Questions? Get stuck at any step? Let me know! 🆘**
