'use client';

/**
 * TaskScheduler Component
 *
 * Schedule recurring compliance checks with:
 * - Set recurrence patterns (daily, weekly, monthly, quarterly, annually)
 * - Configure reminders
 * - Assign to staff/contractors
 * - Auto-generate tasks from statutory requirements
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecurrencePattern, TaskPriority, ComplianceDomain } from '@/types/estates-compliance';
import { Calendar, Clock, User, Users, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { STATUTORY_CHECKS, ComplianceDomain as StatutoryDomain } from '@/lib/estates-compliance/statutory-checks';

interface TaskSchedulerProps {
  organizationId: string;
  onSuccess?: (task: any) => void;
  onCancel?: () => void;
  initialDomain?: ComplianceDomain;
}

interface RecurrenceConfig {
  enabled: boolean;
  pattern: RecurrencePattern;
  interval: number;
  endDate?: string;
  endAfterOccurrences?: number;
}

interface ReminderConfig {
  enabled: boolean;
  reminderDays: number[];
  reminderTime: string; // HH:MM format
}

interface Assignment {
  type: 'staff' | 'contractor';
  id: string;
  name: string;
}

export function TaskScheduler({
  organizationId,
  onSuccess,
  onCancel,
  initialDomain = 'legionella',
}: TaskSchedulerProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'statutory'>('statutory');

  // Manual task form state
  const [manualTask, setManualTask] = useState({
    title: '',
    description: '',
    task_type: 'inspection' as const,
    domain: initialDomain,
    priority: 'medium' as TaskPriority,
    due_date: '',
  });

  // Recurrence state
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    enabled: false,
    pattern: 'weekly',
    interval: 1,
  });

  // Reminder state
  const [reminders, setReminders] = useState<ReminderConfig>({
    enabled: true,
    reminderDays: [1, 3, 7],
    reminderTime: '09:00',
  });

  // Assignment state
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [contractorId, setContractorId] = useState('');

  // Statutory checks state
  const [selectedDomain, setSelectedDomain] = useState<StatutoryDomain>(initialDomain);
  const [selectedChecks, setSelectedChecks] = useState<Set<string>>(new Set());

  // UI state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const statutoryChecks = STATUTORY_CHECKS[selectedDomain] || [];

  useEffect(() => {
    setSelectedDomain(initialDomain as StatutoryDomain);
    setManualTask(prev => ({ ...prev, domain: initialDomain }));
  }, [initialDomain]);

  const handleScheduleManualTask = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        title: manualTask.title,
        description: manualTask.description,
        task_type: manualTask.task_type,
        compliance_domain: manualTask.domain,
        priority: manualTask.priority,
        due_date: manualTask.due_date,
        recurring: recurrence.enabled,
        recurrence_pattern: recurrence.enabled ? recurrence.pattern : undefined,
        recurrence_interval: recurrence.enabled ? recurrence.interval : undefined,
        recurrence_end_date: recurrence.endDate,
        reminders_enabled: reminders.enabled,
        reminder_days: reminders.enabled ? reminders.reminderDays : undefined,
        reminder_time: reminders.enabled ? reminders.reminderTime : undefined,
        assigned_to: assignment?.type === 'staff' ? assignment.id : undefined,
        contractor_id: assignment?.type === 'contractor' ? assignment.id : undefined,
      };

      const response = await fetch('/api/estates/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to schedule task');

      const data = await response.json();
      setMessage({ type: 'success', text: 'Task scheduled successfully!' });
      onSuccess?.(data.task);
    } catch (error) {
      console.error('Error scheduling task:', error);
      setMessage({ type: 'error', text: 'Failed to schedule task. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleStatutoryChecks = async () => {
    try {
      setSaving(true);
      setMessage(null);

      if (selectedChecks.size === 0) {
        setMessage({ type: 'error', text: 'Please select at least one check.' });
        return;
      }

      const checksToSchedule = statutoryChecks.filter(check => selectedChecks.has(check.id));

      for (const check of checksToSchedule) {
        const payload = {
          title: check.name,
          description: check.description,
          task_type: 'inspection' as const,
          compliance_domain: check.domain,
          priority: 'medium' as TaskPriority,
          due_date: manualTask.due_date || new Date().toISOString(),
          recurring: true,
          recurrence_pattern: check.frequency === 'daily' ? 'daily' :
                           check.frequency === 'weekly' ? 'weekly' :
                           check.frequency === 'monthly' ? 'monthly' :
                           check.frequency === 'quarterly' ? 'quarterly' :
                           check.frequency === 'annually' ? 'annually' :
                           'monthly',
          recurrence_interval: 1,
          reminders_enabled: true,
          reminder_days: [7, 3, 1],
          reminder_time: '09:00',
          checklist_items: check.evidenceRequired,
          metadata: {
            statutory_check_id: check.id,
            reference: check.reference,
            reference_url: check.referenceUrl,
            category: check.category,
            estimated_duration: check.estimatedDuration,
            requires_qualification: check.requiresQualification,
          },
        };

        await fetch('/api/estates/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setMessage({
        type: 'success',
        text: `Successfully scheduled ${selectedChecks.size} compliance check(s)!`
      });
      setSelectedChecks(new Set());
    } catch (error) {
      console.error('Error scheduling statutory checks:', error);
      setMessage({ type: 'error', text: 'Failed to schedule checks. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCheckSelection = (checkId: string) => {
    const newSelection = new Set(selectedChecks);
    if (newSelection.has(checkId)) {
      newSelection.delete(checkId);
    } else {
      newSelection.add(checkId);
    }
    setSelectedChecks(newSelection);
  };

  const selectAllInDomain = () => {
    const allIds = new Set(statutoryChecks.map(c => c.id));
    setSelectedChecks(allIds);
  };

  const clearSelection = () => {
    setSelectedChecks(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Message Alert */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manual' | 'statutory')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="statutory">
            <Settings className="mr-2 h-4 w-4" />
            Statutory Requirements
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Calendar className="mr-2 h-4 w-4" />
            Custom Task
          </TabsTrigger>
        </TabsList>

        {/* Statutory Checks Tab */}
        <TabsContent value="statutory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Statutory Compliance Checks</CardTitle>
              <CardDescription>
                Automatically generate tasks from statutory requirements. These checks are based on UK
                legislation and best practice guidance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Domain Selection */}
              <div>
                <Label>Compliance Domain</Label>
                <Select value={selectedDomain} onValueChange={(v) => setSelectedDomain(v as StatutoryDomain)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legionella">Legionella Control</SelectItem>
                    <SelectItem value="fire">Fire Safety</SelectItem>
                    <SelectItem value="asbestos">Asbestos Management</SelectItem>
                    <SelectItem value="electrical">Electrical Safety</SelectItem>
                    <SelectItem value="gas">Gas Safety</SelectItem>
                    <SelectItem value="water">Water Quality</SelectItem>
                    <SelectItem value="mechanical">Mechanical & Heating</SelectItem>
                    <SelectItem value="lifts">Lifts & LOLER</SelectItem>
                    <SelectItem value="playground">Playground Safety</SelectItem>
                    <SelectItem value="accessibility">Accessibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={manualTask.due_date ? new Date(manualTask.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setManualTask({ ...manualTask, due_date: e.target.value })}
                />
              </div>

              <Separator />

              {/* Check List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Required Checks</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllInDomain}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {statutoryChecks.map((check) => (
                    <Card
                      key={check.id}
                      className={`cursor-pointer transition-colors ${
                        selectedChecks.has(check.id) ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => toggleCheckSelection(check.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedChecks.has(check.id)}
                            onCheckedChange={() => toggleCheckSelection(check.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{check.name}</h4>
                              <Badge variant={check.category === 'statutory' ? 'default' : 'secondary'}>
                                {check.category === 'statutory' ? 'Statutory' : 'Good Practice'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {check.frequency}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{check.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {check.reference && (
                                <span>Ref: {check.reference}</span>
                              )}
                              {check.estimatedDuration && (
                                <span>~{check.estimatedDuration} min</span>
                              )}
                              {check.requiresQualification && (
                                <span className="text-amber-600">Requires: {check.requiresQualification}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {statutoryChecks.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No statutory checks found for this domain.</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Assignment */}
              <div>
                <Label>Assign To (Optional)</Label>
                <Select value={contractorId} onValueChange={setContractorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff or contractor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    <SelectItem value="staff-1">Site Manager</SelectItem>
                    <SelectItem value="staff-2">Care-taking Staff</SelectItem>
                    {/* Would be populated from actual users/contractors */}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedChecks.size > 0 && (
                    <span>{selectedChecks.size} check(s) selected</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleScheduleStatutoryChecks}
                    disabled={selectedChecks.size === 0 || saving}
                  >
                    {saving ? 'Scheduling...' : `Schedule ${selectedChecks.size} Check(s)`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Task Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Custom Task</CardTitle>
              <CardDescription>
                Create a custom compliance task with specific recurrence and reminder settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Monthly Legionella Temperature Check"
                    value={manualTask.title}
                    onChange={(e) => setManualTask({ ...manualTask, title: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what needs to be checked..."
                    rows={3}
                    value={manualTask.description}
                    onChange={(e) => setManualTask({ ...manualTask, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="task_type">Task Type</Label>
                  <Select
                    value={manualTask.task_type}
                    onValueChange={(v: any) => setManualTask({ ...manualTask, task_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="domain">Compliance Domain</Label>
                  <Select
                    value={manualTask.domain}
                    onValueChange={(v) => setManualTask({ ...manualTask, domain: v as ComplianceDomain })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="legionella">Legionella</SelectItem>
                      <SelectItem value="fire">Fire Safety</SelectItem>
                      <SelectItem value="asbestos">Asbestos</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="mechanical">Mechanical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={manualTask.priority}
                    onValueChange={(v: any) => setManualTask({ ...manualTask, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="due_date">First Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={manualTask.due_date ? new Date(manualTask.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setManualTask({ ...manualTask, due_date: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              {/* Recurrence Settings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recurrence
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Set how often this task should repeat
                    </p>
                  </div>
                  <Checkbox
                    checked={recurrence.enabled}
                    onCheckedChange={(checked) =>
                      setRecurrence({ ...recurrence, enabled: checked as boolean })
                    }
                  />
                </div>

                {recurrence.enabled && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label>Pattern</Label>
                        <Select
                          value={recurrence.pattern}
                          onValueChange={(v) => setRecurrence({ ...recurrence, pattern: v as RecurrencePattern })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Repeat Every</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={recurrence.interval}
                            onChange={(e) =>
                              setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })
                            }
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            {recurrence.pattern === 'daily' ? 'day(s)' :
                             recurrence.pattern === 'weekly' ? 'week(s)' :
                             recurrence.pattern === 'monthly' ? 'month(s)' :
                             recurrence.pattern === 'quarterly' ? 'quarter(s)' :
                             'year(s)'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label>End Date (Optional)</Label>
                        <Input
                          type="date"
                          value={recurrence.endDate || ''}
                          onChange={(e) => setRecurrence({ ...recurrence, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Reminder Settings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Reminders
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure automatic reminders before the due date
                    </p>
                  </div>
                  <Checkbox
                    checked={reminders.enabled}
                    onCheckedChange={(checked) =>
                      setReminders({ ...reminders, enabled: checked as boolean })
                    }
                  />
                </div>

                {reminders.enabled && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div>
                      <Label>Reminder Days Before Due Date</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[1, 2, 3, 5, 7, 14, 30].map((day) => (
                          <Button
                            key={day}
                            type="button"
                            variant={reminders.reminderDays.includes(day) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              if (reminders.reminderDays.includes(day)) {
                                setReminders({
                                  ...reminders,
                                  reminderDays: reminders.reminderDays.filter((d) => d !== day),
                                });
                              } else {
                                setReminders({
                                  ...reminders,
                                  reminderDays: [...reminders.reminderDays, day].sort((a, b) => b - a),
                                });
                              }
                            }}
                          >
                            {day} day{day !== 1 ? 's' : ''}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="reminder_time">Reminder Time</Label>
                      <Input
                        id="reminder_time"
                        type="time"
                        value={reminders.reminderTime}
                        onChange={(e) => setReminders({ ...reminders, reminderTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Assignment */}
              <div>
                <Label>Assign To (Optional)</Label>
                <Select
                  value={assignment?.id || ''}
                  onValueChange={(value) => {
                    if (value === '') {
                      setAssignment(null);
                    } else {
                      // In a real app, you'd look up the actual user/contractor
                      const type = value.startsWith('contractor-') ? 'contractor' : 'staff';
                      setAssignment({
                        type,
                        id: value,
                        name: type === 'contractor' ? 'Contractor Name' : 'Staff Name',
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff or contractor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    <SelectItem value="staff-site-manager">Site Manager</SelectItem>
                    <SelectItem value="staff-caretaker">Care-taker</SelectItem>
                    <SelectItem value="contractor-1">ABC Facilities Ltd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button onClick={handleScheduleManualTask} disabled={!manualTask.title || saving}>
                  {saving ? 'Scheduling...' : 'Schedule Task'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
