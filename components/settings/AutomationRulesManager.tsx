'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleRuleActive,
  getRuleExecutionStats,
} from '@/lib/actions/automation-rules'
import { AutomationRule } from '@/types/automation.types'

interface AutomationRulesManagerProps {
  workspaceId: string
}

export function AutomationRulesManager({ workspaceId }: AutomationRulesManagerProps) {
  const { primary, accent } = useThemeColor()
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [stats, setStats] = useState<Record<string, any>>({})

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'priority_change' as const,
    trigger_config: { priority: 'urgent' },
    action_type: 'send_reminder' as const,
    action_config: { channel: 'in_app', minutes: 60 },
  })

  useEffect(() => {
    loadRules()
  }, [workspaceId])

  async function loadRules() {
    try {
      setIsLoading(true)
      const data = await getAutomationRules(workspaceId)
      setRules(data)

      // Load stats for each rule
      const statsMap: Record<string, any> = {}
      for (const rule of data) {
        try {
          const ruleStat = await getRuleExecutionStats(rule.id)
          statsMap[rule.id] = ruleStat
        } catch (error) {
          console.error('Error loading stats:', error)
        }
      }
      setStats(statsMap)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load rules',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveRule() {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'Rule name is required',
          variant: 'destructive',
        })
        return
      }

      if (editingRule) {
        await updateAutomationRule(editingRule.id, formData)
        toast({
          title: 'Success',
          description: 'Rule updated successfully',
        })
      } else {
        await createAutomationRule(workspaceId, {
          ...formData,
          is_active: true,
        })
        toast({
          title: 'Success',
          description: 'Rule created successfully',
        })
      }

      setShowForm(false)
      setEditingRule(null)
      setFormData({
        name: '',
        description: '',
        trigger_type: 'priority_change',
        trigger_config: { priority: 'urgent' },
        action_type: 'send_reminder',
        action_config: { channel: 'in_app', minutes: 60 },
      })
      await loadRules()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save rule',
        variant: 'destructive',
      })
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      await deleteAutomationRule(ruleId)
      toast({
        title: 'Success',
        description: 'Rule deleted successfully',
      })
      await loadRules()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete rule',
        variant: 'destructive',
      })
    }
  }

  async function handleToggleActive(rule: AutomationRule) {
    try {
      await toggleRuleActive(rule.id, !rule.is_active)
      await loadRules()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle rule',
        variant: 'destructive',
      })
    }
  }

  function handleEditRule(rule: AutomationRule) {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description || '',
      trigger_type: rule.trigger_type as any,
      trigger_config: rule.trigger_config,
      action_type: rule.action_type as any,
      action_config: rule.action_config,
    })
    setShowForm(true)
  }

  function getTriggerLabel(trigger: string, config: any): string {
    switch (trigger) {
      case 'priority_change':
        return `When priority is ${config.priority}`
      case 'status_change':
        return `When status is ${config.status}`
      case 'overdue':
        return 'When task becomes overdue'
      case 'due_soon':
        return `When task is due in ${config.hoursUntilDue || 24} hours`
      case 'tag_match':
        return `When tags include ${config.tags?.join(', ')}`
      default:
        return trigger
    }
  }

  function getActionLabel(action: string, config: any): string {
    switch (action) {
      case 'send_reminder':
        return `Send ${config.channel} reminder in ${config.minutes} minutes`
      case 'move_status':
        return `Move to ${config.newStatus}`
      case 'add_tag':
        return `Add tag "${config.tagToAdd}"`
      case 'change_priority':
        return `Change priority to ${config.newPriority}`
      case 'add_comment':
        return `Add comment: "${config.commentText}"`
      default:
        return action
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading automation rules...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black dark:text-white">Automation Rules</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Automate task management with custom rules</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingRule(null)
            setFormData({
              name: '',
              description: '',
              trigger_type: 'priority_change',
              trigger_config: { priority: 'urgent' },
              action_type: 'send_reminder',
              action_config: { channel: 'in_app', minutes: 60 },
            })
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: primary }}
        >
          <Plus size={16} />
          New Rule
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-gray-300 dark:border-white/[0.1] rounded-xl p-6 bg-gray-50 dark:bg-slate-800/30 space-y-4">
          <input
            type="text"
            placeholder="Rule name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg dark:bg-slate-800"
          />

          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg dark:bg-slate-800"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-black dark:text-white mb-2 block">
                Trigger When
              </label>
              <select
                value={formData.trigger_type}
                onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg dark:bg-slate-800"
              >
                <option value="priority_change">Priority changes</option>
                <option value="status_change">Status changes</option>
                <option value="overdue">Task becomes overdue</option>
                <option value="due_soon">Task is due soon</option>
                <option value="tag_match">Tags match</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-black dark:text-white mb-2 block">
                Then
              </label>
              <select
                value={formData.action_type}
                onChange={(e) => setFormData({ ...formData, action_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg dark:bg-slate-800"
              >
                <option value="send_reminder">Send reminder</option>
                <option value="move_status">Move to status</option>
                <option value="add_tag">Add tag</option>
                <option value="change_priority">Change priority</option>
                <option value="add_comment">Add comment</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveRule}
              className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: primary }}
            >
              {editingRule ? 'Update' : 'Create'} Rule
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingRule(null)
              }}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-white/[0.1]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-8 border border-gray-300 dark:border-white/[0.1] rounded-xl">
            <AlertCircle size={32} className="mx-auto mb-2 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400">No automation rules yet</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="border border-gray-300 dark:border-white/[0.1] rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-black dark:text-white">{rule.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      rule.is_active
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400'
                    }`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{rule.description}</p>
                  )}
                  <div className="space-y-1 text-sm">
                    <div className="text-slate-700 dark:text-slate-300">
                      ✓ {getTriggerLabel(rule.trigger_type, rule.trigger_config)}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      → {getActionLabel(rule.action_type, rule.action_config)}
                    </div>
                  </div>
                  {stats[rule.id] && (
                    <div className="text-xs text-slate-500 mt-2">
                      Executions: {stats[rule.id].total} ({stats[rule.id].successRate?.toFixed(0)}% success)
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    {rule.is_active ? <ToggleRight size={20} style={{ color: primary }} /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => handleEditRule(rule)}
                    className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-slate-600 dark:text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
