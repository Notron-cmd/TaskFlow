# Testing Resend Email Reminders di Localhost (Development)

Panduan lengkap untuk test email reminders tanpa perlu domain/production setup.

---

## 🎯 Solusi Development (Pilih 1 dari 3)

### Option 1: Manual API Testing (RECOMMENDED) ⭐
**Paling mudah, langsung test tanpa setup rumit**

### Option 2: Ngrok + Scheduler Testing
**Expose localhost ke internet untuk simulate live flow**

### Option 3: Supabase Local + Resend
**Full local with real email sending**

---

## ✅ OPTION 1: Manual API Testing (RECOMMENDED)

### Step 1: Setup Resend (Free)

1. Buka https://resend.com
2. Sign up (gratis)
3. Get API Key:
   - Go to API Keys
   - Generate key
   - Copy ke `.env.local`:
   ```env
   RESEND_API_KEY=re_xxx...
   RESEND_FROM_EMAIL=onboarding@resend.dev
   CRON_SECRET_KEY=any_token_here
   ```

   > 📝 **Note**: Di account gratis Resend, hanya bisa send dari `onboarding@resend.dev`

### Step 2: Create Test Task

Buka browser:
```
http://localhost:3000/board
```

1. Click "New Task"
2. Fill form:
   ```
   Title: Test Reminder Email
   Description: Testing email reminder functionality
   Due: TODAY (same day)
   Time: +15 minutes dari sekarang
   Priority: Medium
   ```
3. **Add Reminder:**
   - Minutes before: 5
   - Channel: Email
4. Click "Create Task"

**Ingat due time!** Jika sekarang 14:00, set ke 14:15, reminder akan kirim 14:10.

### Step 3: Create Test Reminder Langsung di Database

Cara ini lebih cepat untuk testing. Buka Supabase:

1. Go to https://app.supabase.com
2. Select project
3. Go to SQL Editor
4. Run query ini:

```sql
-- Retrieve event ID for testing
SELECT id, title, start_at FROM calendar_events 
WHERE linked_task_id IS NOT NULL 
ORDER BY created_at DESC LIMIT 5;

-- Copy salah satu event ID dari hasil di atas
-- Kemudian gunakan untuk create reminder
```

Setelah copy event ID, run query buat reminder yang scheduled sekarang:

```sql
-- Replace 'event_id_here' dengan ID dari step sebelumnya
-- Replace 'user_id_here' dengan user ID mu
INSERT INTO reminders (
  event_id, 
  user_id, 
  minutes_before, 
  channel, 
  scheduled_at
) VALUES (
  'event_id_here',
  'user_id_here', 
  5, 
  'email', 
  NOW() - interval '1 minute'  -- Reminder yang sudah terlewat jadi langsung terkirim
);
```

Cara dapat user_id:
```sql
SELECT id, email FROM profiles LIMIT 1;
```

### Step 4: Manual Trigger API Endpoint

Buka terminal baru:

```bash
# Trigger email sending endpoint
curl -X POST \
  http://localhost:3000/api/reminders/send \
  -H "Authorization: Bearer any_token_here" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Processed 1 reminders",
  "count": 1,
  "sent": 1,
  "failed": 0,
  "details": [
    {
      "reminderId": "...",
      "email": "your_email@example.com",
      "status": "sent",
      "resendId": "..."
    }
  ]
}
```

### Step 5: Check Email ✉️

**Inbox:**
- Check email inbox mu
- Email harus terima dari `onboarding@resend.dev`
- Subject: `Reminder: [Task Title]`

**Logs:**
- Terminal bisa lihat: `✅ Email sent to your_email@example.com`

### Step 6: Verify di Database

```sql
-- Check reminder status after sending
SELECT id, sent, sent_at FROM reminders 
ORDER BY created_at DESC LIMIT 1;

-- Harus show: sent = true, sent_at = [timestamp]
```

---

## 🚀 OPTION 2: Ngrok + Cron Job Testing

Untuk simulate live scheduler di localhost.

### Step 2.1: Install Ngrok

```bash
# Download dari https://ngrok.com/download
# atau jika pakai Homebrew:
brew install ngrok

# atau Windows dengan Chocolatey:
choco install ngrok
```

### Step 2.2: Setup Ngrok

1. Buat account di https://ngrok.com
2. Get auth token: https://dashboard.ngrok.com/auth/your-authtoken
3. Set token locally:
   ```bash
   ngrok config add-authtoken your_token_here
   ```

### Step 2.3: Expose Localhost

**Terminal 1**: Start dev server
```bash
npm run dev
# Server running on localhost:3000
```

**Terminal 2**: Start ngrok
```bash
ngrok http 3000

# Output akan show:
# Forwarding https://xxxx-yyyy.ngrok.io -> http://localhost:3000
```

Copy URL: `https://xxxx-yyyy.ngrok.io`

### Step 2.4: Setup Cron Job

Go to https://cron-job.org

1. Create new Cronjob
2. URL: `https://xxxx-yyyy.ngrok.io/api/reminders/send` (dari ngrok)
3. Method: POST
4. Headers:
   - Key: `Authorization`
   - Value: `Bearer your_cron_secret_key`
5. Schedule: Every 5 minutes
6. Click Save

### Step 2.5: Test

1. Create task dengan reminder email
2. Wait untuk cron run (max 5 menit)
3. Check email inbox
4. Terminal logs harus show success

**Kelebihan:**
- Test live scheduler behavior
- Test timing accuracy
- Real cron-job.org flow

**Kekurangan:**
- Need public URL exposure (security consideration)
- Add latency dari internet

---

## 🎮 OPTION 3: Supabase Local + Resend

Full local Supabase dengan real email via Resend.

### Step 3.1: Start Supabase Local

```bash
supabase start
```

### Step 3.2: Setup Local Database

1. Connect ke local DB: `postgresql://postgres:postgres@localhost:54322/postgres`
2. Run migrations (manual copy dari production)
3. Create test user

### Step 3.3: Update .env.local

```env
# Supabase Local Connection
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Resend (Real)
RESEND_API_KEY=re_xxx...
RESEND_FROM_EMAIL=onboarding@resend.dev

# Local
CRON_SECRET_KEY=test_token
```

### Step 3.4: Run Function Locally

```bash
supabase functions serve
```

### Step 3.5: Test

```bash
curl -X POST \
  http://localhost:54321/functions/v1/send-reminders \
  -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json"
```

**Kelebihan:**
- Full isolated environment
- Real email sending
- No public URL exposure

**Kekurangan:**
- Setup lebih kompleks
- Need port management

---

## 📊 Perbandingan 3 Options

| Aspek | Option 1 | Option 2 | Option 3 |
|-------|----------|----------|----------|
| **Setup Time** | 5 min | 15 min | 30 min |
| **Ease** | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| **Real Email** | ✅ | ✅ | ✅ |
| **Test Scheduler** | ❌ | ✅ | ✅ |
| **Security Risk** | Min | Medium | None |
| **For Dev** | ⭐ Best | Good | Overkill |

---

## 🧪 RECOMMENDED WORKFLOW (Option 1)

Untuk development testing:

```
1. Create task → Add email reminder
2. (Immediately) Call: POST /api/reminders/send
3. Check email → Verify working
4. Iterate & debug

Atau untuk faster iteration:
1. Insert test reminder di database
2. Call: POST /api/reminders/send
3. Check response & logs
```

---

## 🐛 Troubleshooting Development

### Problem: "Email not sending"

**Check:**
```bash
# 1. API endpoint response
curl -X POST \
  http://localhost:3000/api/reminders/send \
  -H "Authorization: Bearer test_token"

# 2. Check logs di terminal
# Lihat output: ✅ atau ❌

# 3. Verify Resend API key valid
curl https://api.resend.com/emails \
  -H "Authorization: Bearer your_resend_key" \
  -H "Content-Type: application/json"

# Harus return list emails atau 200 OK
```

### Problem: "401 Unauthorized"

```
Check CRON_SECRET_KEY di:
- .env.local
- Authorization header match
- No extra spaces
```

### Problem: "No pending reminders found"

```
Verify reminder ada:
1. Go to Supabase → reminders table
2. Filter: sent = false, scheduled_at <= now()
3. Pastikan ada minimal 1 record
```

### Problem: "RESEND_FROM_EMAIL invalid"

```
❌ Error: invalid_from_address

Solution:
- Pakai: onboarding@resend.dev (default free)
- Atau verify custom domain di Resend dashboard
```

---

## 💡 Pro Tips

**1. Log everything untuk debug:**
```typescript
// Di /api/reminders/send
console.log("Fetched reminders:", reminders.length)
console.log("Sending to:", userEmail)
console.log("Response:", emailResponse.status)
```

**2. Test with direct email:**
```typescript
// Test email module standalone
import { Resend } from 'resend'

const resend = new Resend('re_xxx...')
await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'your_email@example.com',
  subject: 'Test',
  html: '<p>Test email</p>'
})
```

**3. Create helper script untuk quick test:**
```typescript
// lib/test-reminder.ts
export async function sendTestReminder(email: string) {
  const response = await fetch('/api/reminders/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test_token'
    }
  })
  console.log(await response.json())
}

// Usage: Di browser console
// await sendTestReminder('test@example.com')
```

---

## ✅ Checklist Development

- [ ] Resend account created & API key added
- [ ] RESEND_FROM_EMAIL = `onboarding@resend.dev`
- [ ] CRON_SECRET_KEY set di .env.local
- [ ] Dev server running
- [ ] Created test task with email reminder
- [ ] Manual API trigger works
- [ ] Email received successfully
- [ ] Reminder marked as sent in DB
- [ ] Logs show ✅ success

---

## 🎯 Next: Production Deployment

Ketika ready untuk production:

1. Get real domain
2. Update RESEND_FROM_EMAIL ke custom domain
3. Verify domain di Resend
4. Deploy Supabase Edge Function
5. Setup actual scheduler (cron-job.org, AWS Lambda, etc)

Tapi untuk now, **development testing pake Option 1 sudah cukup!** 🚀

---

## 📞 Quick Start

```bash
# 1. Add ke .env.local
RESEND_API_KEY=your_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# 2. Create test reminder via UI atau database

# 3. Trigger manually
curl -X POST http://localhost:3000/api/reminders/send

# 4. Check email inbox
# ✅ Done!
```

Siap test? Ada yang perlu klarifikasi? 🚀
