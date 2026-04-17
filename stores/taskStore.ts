import { create } from "zustand";
import type { Database } from "@/types/database.types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type CalendarEvent =
  Database["public"]["Tables"]["calendar_events"]["Row"];

interface TaskStoreState {
  tasks: Task[];
  events: CalendarEvent[];
  activeTaskId: string | null;
  isDrawerOpen: boolean;
  isCreateModalOpen: boolean;
  isLoading: boolean;
}

interface TaskStoreActions {
  setTasks: (tasks: Task[]) => void;
  setEvents: (events: CalendarEvent[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  upsertEvent: (event: CalendarEvent) => void;
  removeEvent: (eventId: string) => void;
  moveTaskOptimistic: (
    taskId: string,
    newStatus: "todo" | "in_progress" | "done",
    newPosition: number
  ) => void;
  openDrawer: (taskId: string) => void;
  closeDrawer: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  setLoading: (loading: boolean) => void;
}

export const useTaskStore = create<TaskStoreState & TaskStoreActions>(
  (set) => ({
    tasks: [],
    events: [],
    activeTaskId: null,
    isDrawerOpen: false,
    isCreateModalOpen: false,
    isLoading: false,

    setTasks: (tasks) => set({ tasks }),

    setEvents: (events) => set({ events }),

    upsertTask: (task) =>
      set((state) => {
        const existingIndex = state.tasks.findIndex((t) => t.id === task.id);
        if (existingIndex !== -1) {
          const newTasks = [...state.tasks];
          newTasks[existingIndex] = task;
          return { tasks: newTasks };
        }
        return { tasks: [...state.tasks, task] };
      }),

    removeTask: (taskId) =>
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      })),

    upsertEvent: (event) =>
      set((state) => {
        const existingIndex = state.events.findIndex((e) => e.id === event.id);
        if (existingIndex !== -1) {
          const newEvents = [...state.events];
          newEvents[existingIndex] = event;
          return { events: newEvents };
        }
        return { events: [...state.events, event] };
      }),

    removeEvent: (eventId) =>
      set((state) => ({
        events: state.events.filter((e) => e.id !== eventId),
      })),

    moveTaskOptimistic: (taskId, newStatus, newPosition) =>
      set((state) => {
        const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) return state;

        const newTasks = [...state.tasks];
        newTasks[taskIndex] = {
          ...newTasks[taskIndex],
          status: newStatus,
          position: newPosition,
        };
        return { tasks: newTasks };
      }),

    openDrawer: (taskId) =>
      set({
        activeTaskId: taskId,
        isDrawerOpen: true,
      }),

    closeDrawer: () =>
      set({
        activeTaskId: null,
        isDrawerOpen: false,
      }),

    openCreateModal: () => set({ isCreateModalOpen: true }),

    closeCreateModal: () => set({ isCreateModalOpen: false }),

    setLoading: (loading) => set({ isLoading: loading }),
  })
);
