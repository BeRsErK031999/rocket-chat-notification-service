import type { NotificationEventName } from "../../../events/contracts/index.js";
import type { NotificationLinks } from "../links/linkTypes.js";

export type NotificationTemplateValue = string | number | boolean | null;

export type ProjectDeadlineOverdueTemplateData = {
  projectId: string;
  projectName: string;
  deadline: string;
  daysOverdue: number;
};

export type ProjectMemberOverallocatedTemplateData = {
  projectId: string;
  projectName: string;
  memberName: string;
  allocationPercent: number;
};

export type FinanceBudgetExceededTemplateData = {
  projectId?: string;
  budgetName: string;
  actualAmount: number;
  limitAmount: number;
  currency: string;
};

export type MonitoringEmployeeAfkTemplateData = {
  employeeId: string;
  employeeName: string;
  minutesAfk: number;
};

export type NotificationTemplateDataByEvent = {
  "project.deadline.overdue": ProjectDeadlineOverdueTemplateData;
  "project.member.overallocated": ProjectMemberOverallocatedTemplateData;
  "finance.budget.exceeded": FinanceBudgetExceededTemplateData;
  "monitoring.employee.afk": MonitoringEmployeeAfkTemplateData;
};

export type SupportedNotificationTemplateInput = {
  [EventName in NotificationEventName]: {
    event: EventName;
    severity: string;
    data: NotificationTemplateDataByEvent[EventName];
    links: NotificationLinks;
  };
}[NotificationEventName];

export type FallbackNotificationTemplateInput = {
  event: string;
  severity: string;
  data: Record<string, NotificationTemplateValue>;
  links: NotificationLinks;
};

export type NotificationTemplateInput =
  | SupportedNotificationTemplateInput
  | FallbackNotificationTemplateInput;

export type NotificationTemplateRenderer = (input: NotificationTemplateInput) => string;
