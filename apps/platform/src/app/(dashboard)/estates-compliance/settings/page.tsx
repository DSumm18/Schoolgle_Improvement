'use client';

/**
 * Estates Compliance Settings
 *
 * Configure compliance tracking preferences, notification settings,
 * and system options.
 */

import { useState } from 'react';
import { Save, Bell, Mail, Clock, Calendar, Shield, Users, FileText, Check, AlertTriangle, Info, Settings2 } from 'lucide-react';
import { RoutineManager } from '@/components/estates-compliance/RoutineManager';

interface NotificationSettings {
  emailReminders: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
  overdueAlerts: boolean;
  dueSoonAlerts: boolean;
  completedNotifications: boolean;
}

interface SystemSettings {
  defaultCheckFrequency: string;
  autoScheduleReminders: boolean;
  requireEvidenceForCompletion: boolean;
  allowDelegation: boolean;
}

export default function EstatesComplianceSettings() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailReminders: true,
    reminderFrequency: 'weekly',
    overdueAlerts: true,
    dueSoonAlerts: true,
    completedNotifications: false,
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    defaultCheckFrequency: 'monthly',
    autoScheduleReminders: true,
    requireEvidenceForCompletion: true,
    allowDelegation: true,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <a href="/estates-compliance" className="hover:text-gray-900 dark:hover:text-gray-200 font-medium">
              Estates Compliance
            </a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Settings</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Compliance Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
            Configure your compliance tracking preferences and notifications
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notification Settings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control how and when you receive compliance alerts
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Email Reminders */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Email Reminders</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Receive email notifications for upcoming compliance checks
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailReminders}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      emailReminders: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Reminder Frequency */}
          {notificationSettings.emailReminders && (
            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Reminder Frequency</h3>
                <div className="flex flex-wrap gap-3">
                  {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                    <label
                      key={freq}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer font-semibold transition-all ${notificationSettings.reminderFrequency === freq
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      <input
                        type="radio"
                        name="frequency"
                        value={freq}
                        checked={notificationSettings.reminderFrequency === freq}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          reminderFrequency: e.target.value as any
                        })}
                        className="sr-only"
                      />
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Alert Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Overdue Alerts</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Immediate notification for overdue checks</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.overdueAlerts}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    overdueAlerts: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Due Soon Alerts</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Alert 7 days before due date</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.dueSoonAlerts}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    dueSoonAlerts: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Completion Notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notify when checks are completed</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.completedNotifications}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    completedNotifications: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">System Settings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure compliance tracking behavior and requirements
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Default Check Frequency */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Default Check Frequency</h3>
            </label>
            <select
              value={systemSettings.defaultCheckFrequency}
              onChange={(e) => setSystemSettings({
                ...systemSettings,
                defaultCheckFrequency: e.target.value
              })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
              <option value="biennially">Every 2 Years</option>
              <option value="triennially">Every 3 Years</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Default frequency for newly created custom checks
            </p>
          </div>

          {/* Toggle Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Auto-Schedule Reminders</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automatically create reminders based on check frequency</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.autoScheduleReminders}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    autoScheduleReminders: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Require Evidence</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Require evidence upload for check completion</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.requireEvidenceForCompletion}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    requireEvidenceForCompletion: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-teal-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Allow Delegation</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allow tasks to be delegated to other team members</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.allowDelegation}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    allowDelegation: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Settings are organization-wide</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              These settings apply to all users in your organization. Changes take effect immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Routine Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-primary/5 to-indigo-50/30 dark:from-primary/10 dark:to-indigo-950/20 px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Routine Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Define and customize the daily or weekly checklists for your site team</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <RoutineManager />
        </div>
      </div>

      {/* Additional Quick Settings */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <button className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 text-left">
            <FileText className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Export All Settings</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Download configuration backup</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 text-left">
            <Shield className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Reset to Defaults</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Restore default settings</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
