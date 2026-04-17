import { createClient } from "@/lib/supabase/server";

export async function getEventsForMonth(
  workspaceId: string,
  year: number,
  month: number
) {
  const supabase = await createClient();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from("calendar_events")
    .select(
      `*,
      tasks (
        id,
        title,
        status,
        priority
      ),
      reminders (
        id,
        minutes_before,
        channel,
        sent
      )`
    )
    .eq("workspace_id", workspaceId)
    .gte("start_at", start.toISOString())
    .lte("start_at", end.toISOString())
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUpcomingEvents(workspaceId: string) {
  const supabase = await createClient();

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("calendar_events")
    .select(`*, tasks(id, status, priority)`)
    .eq("workspace_id", workspaceId)
    .gte("start_at", now.toISOString())
    .lte("start_at", nextWeek.toISOString())
    .order("start_at", { ascending: true })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEventById(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("calendar_events")
    .select(
      `*,
      tasks (
        id,
        title,
        status,
        priority
      ),
      reminders (
        id,
        minutes_before,
        channel,
        sent,
        scheduled_at
      )`
    )
    .eq("id", eventId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
