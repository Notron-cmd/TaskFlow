'use client'

import { useSettingsStore, type Theme, type TaskSort, type CalendarView } from '@/stores/settingsStore'
import { Sun, Moon, Bell, Clock, Eye, Zap, RotateCcw } from 'lucide-react'

interface SettingSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

function SettingSection({ title, description, children }: SettingSectionProps) {
  return (
    <div className="border-b border-gray-300 dark:border-slate-700 pb-6 last:border-b-0">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">{title}</h3>
        {description && <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

interface SettingItemProps {
  label: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

function SettingItem({ label, description, icon, children }: SettingItemProps) {
  return (
    <div className="flex items-start justify-between py-3 px-3 rounded-lg bg-gray-200 dark:bg-slate-900/50 hover:bg-gray-300 dark:hover:bg-slate-900 transition-colors">
      <div className="flex items-start gap-3 flex-1">
        {icon && <div className="text-gray-600 dark:text-slate-400 mt-1">{icon}</div>}
        <div>
          <p className="font-medium text-black dark:text-white">{label}</p>
          {description && <p className="text-xs text-gray-600 dark:text-slate-500 mt-1">{description}</p>}
        </div>
      </div>
      <div className="ml-4">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        checked ? 'bg-purple-600' : 'bg-gray-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (val: any) => void
  options: { label: string; value: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-slate-800 text-black dark:text-white border border-gray-400 dark:border-slate-700 hover:border-gray-500 dark:hover:border-slate-600 transition-colors cursor-pointer text-sm"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    emailNotifications,
    setEmailNotifications,
    inAppNotifications,
    setInAppNotifications,
    taskSort,
    setTaskSort,
    showCompletedTasks,
    setShowCompletedTasks,
    calendarView,
    setCalendarView,
    compactMode,
    setCompactMode,
    use24HourFormat,
    setUse24HourFormat,
    resetSettings,
  } = useSettingsStore()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-slate-400">Manage your preferences and account settings</p>
      </div>

      {/* Settings Card */}
      <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-xl p-6 space-y-8">
        {/* Theme Section */}
        <SettingSection title="Appearance" description="Customize how TaskFlow looks">
          <SettingItem label="Theme" description="Choose your preferred color scheme" icon={<Sun size={16} />}>
            <Select
              value={theme}
              onChange={setTheme}
              options={[
                { label: '☀️ Light', value: 'light' },
                { label: '🌙 Dark', value: 'dark' },
                { label: '⚙️ System', value: 'system' },
              ]}
            />
          </SettingItem>

          <SettingItem label="Compact Mode" description="Use compact display for a denser layout" icon={<Eye size={16} />}>
            <Toggle checked={compactMode} onChange={setCompactMode} />
          </SettingItem>
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="Notifications" description="Choose how you want to be notified">
          <SettingItem label="Email Notifications" description="Receive reminders via email" icon={<Bell size={16} />}>
            <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
          </SettingItem>

          <SettingItem label="In-App Notifications" description="Show notifications inside the app" icon={<Bell size={16} />}>
            <Toggle checked={inAppNotifications} onChange={setInAppNotifications} />
          </SettingItem>
        </SettingSection>

        {/* Task Preferences Section */}
        <SettingSection title="Task Preferences" description="Customize how tasks are displayed and sorted">
          <SettingItem label="Sort Tasks By" description="Choose default sorting method" icon={<Zap size={16} />}>
            <Select
              value={taskSort}
              onChange={setTaskSort}
              options={[
                { label: 'Due Date', value: 'due-date' },
                { label: 'Created Date', value: 'created-date' },
                { label: 'Priority', value: 'priority' },
                { label: 'Title A-Z', value: 'title' },
              ]}
            />
          </SettingItem>

          <SettingItem label="Show Completed Tasks" description="Display finished tasks in your list" icon={<Eye size={16} />}>
            <Toggle checked={showCompletedTasks} onChange={setShowCompletedTasks} />
          </SettingItem>
        </SettingSection>

        {/* Calendar Preferences Section */}
        <SettingSection title="Calendar" description="Customize calendar view">
          <SettingItem label="Default View" description="Choose how the calendar displays" icon={<Clock size={16} />}>
            <Select
              value={calendarView}
              onChange={setCalendarView}
              options={[
                { label: 'Month', value: 'month' },
                { label: 'Week', value: 'week' },
                { label: 'Day', value: 'day' },
              ]}
            />
          </SettingItem>
        </SettingSection>

        {/* Time Format Section */}
        <SettingSection title="Time & Date" description="Customize time and date display">
          <SettingItem label="24-Hour Format" description="Use 24-hour time format instead of 12-hour" icon={<Clock size={16} />}>
            <Toggle checked={use24HourFormat} onChange={setUse24HourFormat} />
          </SettingItem>
        </SettingSection>

        {/* Reset Section */}
        <SettingSection title="Advanced">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all settings to default?')) {
                resetSettings()
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-900 hover:bg-gray-300 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
          >
            <RotateCcw size={16} />
            <span>Reset All Settings</span>
          </button>
        </SettingSection>
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 rounded-lg bg-gray-200 dark:bg-slate-900/30 border border-gray-300 dark:border-slate-700">
        <p className="text-xs text-gray-600 dark:text-slate-500">
          Settings are automatically saved to your browser. Clear browser data to reset.
        </p>
      </div>
    </div>
  )
}
