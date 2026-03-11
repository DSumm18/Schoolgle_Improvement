/**
 * Reminder Service Tests
 *
 * Tests the compliance task reminder system.
 * Run with: npx vitest run apps/platform/src/lib/estates-compliance/notifications/reminder-service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateReminderEmail,
  generateDailySummaryEmail,
} from "./reminder-service";

describe("Reminder Service", () => {
  describe("generateReminderEmail", () => {
    const baseConfig = {
      taskId: "task-123",
      taskTitle: "Fire alarm weekly test",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: "user-1",
      reminderDays: [7, 3, 1],
      reminderTime: "09:00",
      complianceDomain: "fire_safety",
      priority: "high",
    };

    it("should generate upcoming reminder notification", () => {
      const notification = generateReminderEmail(
        baseConfig,
        "sitemanager@school.uk",
        "John Site Manager",
        "https://schoolgle.co.uk",
      );

      expect(notification.taskId).toBe("task-123");
      expect(notification.recipientEmail).toBe("sitemanager@school.uk");
      expect(notification.recipientName).toBe("John Site Manager");
      expect(notification.reminderType).toBe("upcoming");
      expect(notification.subject).toContain("Reminder");
      expect(notification.subject).toContain("Fire alarm weekly test");
      expect(notification.body).toContain("Fire alarm weekly test");
      expect(notification.body).toContain("fire_safety");
      expect(notification.actionUrl).toContain(
        "/estates-compliance/tasks/task-123",
      );
    });

    it("should generate due_today reminder", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to midnight to match generateReminderEmail's logic
      const todayConfig = {
        ...baseConfig,
        dueDate: today.toISOString(),
      };

      const notification = generateReminderEmail(
        todayConfig,
        "user@school.uk",
        "User",
        "https://schoolgle.co.uk",
      );

      expect(notification.reminderType).toBe("due_today");
      expect(notification.subject).toContain("URGENT");
      expect(notification.body).toContain("due today");
    });

    it("should generate overdue reminder", () => {
      const overdueConfig = {
        ...baseConfig,
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const notification = generateReminderEmail(
        overdueConfig,
        "user@school.uk",
        "User",
        "https://schoolgle.co.uk",
      );

      expect(notification.reminderType).toBe("overdue");
      expect(notification.subject).toContain("OVERDUE");
      expect(notification.daysUntilDue).toBeLessThan(0);
    });

    it("should generate escalation for significantly overdue", () => {
      const escalationConfig = {
        ...baseConfig,
        dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const notification = generateReminderEmail(
        escalationConfig,
        "headteacher@school.uk",
        "Head Teacher",
        "https://schoolgle.co.uk",
      );

      expect(notification.reminderType).toBe("escalation");
      expect(notification.subject).toContain("ESCALATION");
      expect(notification.body).toContain("significantly overdue");
    });

    it("should include action URL in body", () => {
      const notification = generateReminderEmail(
        baseConfig,
        "user@school.uk",
        "User",
        "https://schoolgle.co.uk",
      );

      expect(notification.body).toContain(
        "https://schoolgle.co.uk/estates-compliance/tasks/task-123",
      );
    });
  });

  describe("generateDailySummaryEmail", () => {
    const summaryData = {
      organizationId: "org-1",
      date: new Date().toISOString(),
      totalDueToday: 5,
      totalDueThisWeek: 12,
      totalOverdue: 3,
      tasksByDomain: {
        fire_safety: 4,
        legionella: 3,
        electrical: 5,
      },
      criticalTasks: [
        {
          id: "1",
          title: "Fire risk assessment",
          dueDate: "2026-03-10",
          priority: "critical",
        },
        {
          id: "2",
          title: "PAT testing overdue",
          dueDate: "2026-03-08",
          priority: "high",
        },
      ],
    };

    it("should include all summary metrics", () => {
      const result = generateDailySummaryEmail(
        summaryData,
        "admin@school.uk",
        "School Admin",
        "https://schoolgle.co.uk",
      );

      expect(result.subject).toContain("Daily Compliance Summary");
      expect(result.body).toContain("Tasks due today: 5");
      expect(result.body).toContain("Tasks due this week: 12");
      expect(result.body).toContain("Overdue tasks: 3");
    });

    it("should include critical tasks", () => {
      const result = generateDailySummaryEmail(
        summaryData,
        "admin@school.uk",
        "School Admin",
        "https://schoolgle.co.uk",
      );

      expect(result.body).toContain("Fire risk assessment");
      expect(result.body).toContain("PAT testing overdue");
    });

    it("should include domain breakdown", () => {
      const result = generateDailySummaryEmail(
        summaryData,
        "admin@school.uk",
        "School Admin",
        "https://schoolgle.co.uk",
      );

      expect(result.body).toContain("fire_safety: 4");
      expect(result.body).toContain("legionella: 3");
      expect(result.body).toContain("electrical: 5");
    });

    it("should address recipient by name", () => {
      const result = generateDailySummaryEmail(
        summaryData,
        "admin@school.uk",
        "Mrs Jones",
        "https://schoolgle.co.uk",
      );

      expect(result.body).toContain("Mrs Jones");
    });

    it("should include dashboard link", () => {
      const result = generateDailySummaryEmail(
        summaryData,
        "admin@school.uk",
        "Admin",
        "https://schoolgle.co.uk",
      );

      expect(result.body).toContain(
        "https://schoolgle.co.uk/estates-compliance/tasks",
      );
    });
  });
});
