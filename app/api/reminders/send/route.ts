import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * API endpoint to send pending reminders via email
 * Should be triggered by a cron job every 5-10 minutes
 * 
 * Usage:
 * - Set up cron job (Supabase Edge Functions, AWS Lambda, etc.)
 * - Call: POST /api/reminders/send
 * - Include auth token in Authorization header for security
 * 
 * Example cron setup with cron-job.org:
 * - URL: https://yourdomain.com/api/reminders/send
 * - Method: POST
 * - Headers: Authorization: Bearer {CRON_SECRET_KEY}
 * - Schedule: Every 5 minutes
 */

export async function POST(request: NextRequest) {
  try {
    // Security: Verify request comes from authorized cron service
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_KEY

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured (RESEND_API_KEY missing)' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Fetch all pending email reminders with event and user details
    const { data: reminders, error: fetchError } = await supabase
      .from('reminders')
      .select(`
        id,
        user_id,
        minutes_before,
        scheduled_at,
        calendar_events!reminders_event_id_fkey(
          id,
          title,
          description,
          start_at,
          end_at
        ),
        profiles!reminders_user_id_fkey(
          id,
          email,
          first_name
        )
      `)
      .eq('channel', 'email')
      .eq('sent', false)
      .lte('scheduled_at', new Date().toISOString())
      .limit(50)

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending reminders to send',
        count: 0,
      })
    }

    // Send emails one by one
    const results = []
    const reminderIds: string[] = []

    for (const reminder of reminders) {
      try {
        const userEmail = (reminder as any).profiles?.email
        const userName = (reminder as any).profiles?.first_name || 'User'
        const eventTitle = (reminder as any).calendar_events?.title || 'Upcoming Event'
        const eventDescription = (reminder as any).calendar_events?.description
        const eventTime = new Date((reminder as any).calendar_events?.start_at).toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        if (!userEmail) {
          console.warn(`Reminder ${reminder.id}: No email found for user`)
          continue
        }

        // Send email via Resend
        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@taskflow.app',
          to: userEmail,
          subject: `Reminder: ${eventTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">TaskFlow Reminder</h2>
              </div>
              <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px;">
                <p>Hi <strong>${userName}</strong>,</p>
                <p>This is a reminder about your upcoming task:</p>
                <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin-top: 0; color: #667eea;">${eventTitle}</h3>
                  ${eventDescription ? `<p style="color: #666; margin: 10px 0;">${eventDescription}</p>` : ''}
                  <p style="color: #999; margin: 10px 0; font-size: 14px;">⏰ ${eventTime}</p>
                </div>
                <p style="color: #666; font-size: 14px;">Start working on it now to stay on track!</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                  This is an automated reminder from TaskFlow. You can manage reminders in your account settings.
                </p>
              </div>
            </div>
          `,
        })

        results.push({
          reminderId: reminder.id,
          email: userEmail,
          status: 'sent',
          resendId: emailResult.id,
        })

        reminderIds.push(reminder.id)
        console.log(`✅ Email sent to ${userEmail} for reminder ${reminder.id}`)
      } catch (emailError) {
        console.error(`❌ Failed to send email for reminder ${reminder.id}:`, emailError)
        results.push({
          reminderId: reminder.id,
          status: 'failed',
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        })
      }
    }

    // Mark successfully sent reminders as sent
    if (reminderIds.length > 0) {
      const { error: updateError } = await supabase
        .from('reminders')
        .update({
          sent: true,
          sent_at: new Date().toISOString(),
        })
        .in('id', reminderIds)

      if (updateError) {
        console.error('Failed to update reminder status:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} reminders`,
      count: results.length,
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      details: results,
    })
  } catch (error) {
    console.error('[Reminders API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
