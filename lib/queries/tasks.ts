import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export async function getTasksWithAssignees(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `*,
      task_assignees (
        profiles (
          id,
          full_name,
          avatar_url
        )
      )`
    )
    .eq("workspace_id", workspaceId)
    .eq("is_archived", false)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getTasksDueBetween(
  workspaceId: string,
  from: Date,
  to: Date
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, status, priority, calendar_event_id")
    .eq("workspace_id", workspaceId)
    .gte("due_date", from.toISOString())
    .lte("due_date", to.toISOString())
    .not("due_date", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getTaskById(taskId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `*,
      task_assignees (
        profiles (
          id,
          full_name,
          avatar_url,
          email
        )
      ),
      task_comments (
        id,
        content,
        created_at,
        profiles (
          id,
          full_name,
          avatar_url
        )
      ),
      task_attachments (
        id,
        file_name,
        file_size,
        mime_type,
        storage_path,
        created_at
      )`
    )
    .eq("id", taskId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getArchivedTasks(workspaceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `*,
      task_assignees (
        profiles (
          id,
          full_name,
          avatar_url
        )
      )`
    )
    .eq("workspace_id", workspaceId)
    .eq("is_archived", true)
    .order("archived_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
