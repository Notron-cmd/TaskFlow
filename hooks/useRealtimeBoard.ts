"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  useTaskStore,
  type Task,
  type CalendarEvent,
} from "@/stores/taskStore";

export function useRealtimeBoard(workspaceId: string): void {
  const { upsertTask, removeTask, upsertEvent, removeEvent } = useTaskStore();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`workspace:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeTask(payload.old.id as string);
          } else {
            upsertTask(payload.new as Task);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calendar_events",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            removeEvent(payload.old.id as string);
          } else {
            upsertEvent(payload.new as CalendarEvent);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, upsertTask, removeTask, upsertEvent, removeEvent]);
}
