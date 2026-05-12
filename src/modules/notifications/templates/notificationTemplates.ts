import type {
  FinanceBudgetExceededTemplateData,
  MonitoringEmployeeAfkTemplateData,
  ProjectDeadlineOverdueTemplateData,
  ProjectMemberOverallocatedTemplateData
} from "./notificationTemplateTypes.js";

export const renderProjectDeadlineOverdueTemplate = (
  data: ProjectDeadlineOverdueTemplateData,
  severity: string
): string =>
  `*[${severity}]* Project "${data.projectName}" is overdue by ${data.daysOverdue} day(s). Deadline: ${data.deadline}.`;

export const renderProjectMemberOverallocatedTemplate = (
  data: ProjectMemberOverallocatedTemplateData,
  severity: string
): string =>
  `*[${severity}]* ${data.memberName} is allocated at ${data.allocationPercent}% on project "${data.projectName}".`;

export const renderFinanceBudgetExceededTemplate = (
  data: FinanceBudgetExceededTemplateData,
  severity: string
): string =>
  `*[${severity}]* Budget "${data.budgetName}" exceeded: ${data.actualAmount} ${data.currency} / ${data.limitAmount} ${data.currency}.`;

export const renderMonitoringEmployeeAfkTemplate = (
  data: MonitoringEmployeeAfkTemplateData,
  severity: string
): string =>
  `*[${severity}]* ${data.employeeName} has been AFK for ${data.minutesAfk} minute(s).`;

export const renderFallbackNotificationTemplate = (event: string, severity: string): string =>
  `*[${severity}]* Unsupported notification event: ${event}.`;
