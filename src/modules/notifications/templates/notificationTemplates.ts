import type {
  FinanceBudgetExceededTemplateData,
  MonitoringEmployeeAfkTemplateData,
  ProjectDeadlineOverdueTemplateData,
  ProjectMemberOverallocatedTemplateData
} from "./notificationTemplateTypes.js";
import type { NotificationLinks } from "../links/linkTypes.js";

const appendMarkdownLink = (text: string, label: string, url: string | undefined): string => {
  if (url === undefined) {
    return text;
  }

  return `${text} [${label}](${url})`;
};

export const renderProjectDeadlineOverdueTemplate = (
  data: ProjectDeadlineOverdueTemplateData,
  severity: string,
  links: NotificationLinks
): string =>
  appendMarkdownLink(
    `*[${severity}]* Project "${data.projectName}" is overdue by ${data.daysOverdue} day(s). Deadline: ${data.deadline}.`,
    "Open project",
    links.projectUrl
  );

export const renderProjectMemberOverallocatedTemplate = (
  data: ProjectMemberOverallocatedTemplateData,
  severity: string,
  links: NotificationLinks
): string =>
  appendMarkdownLink(
    `*[${severity}]* ${data.memberName} is allocated at ${data.allocationPercent}% on project "${data.projectName}".`,
    "Open project",
    links.projectUrl
  );

export const renderFinanceBudgetExceededTemplate = (
  data: FinanceBudgetExceededTemplateData,
  severity: string,
  links: NotificationLinks
): string =>
  appendMarkdownLink(
    `*[${severity}]* Budget "${data.budgetName}" exceeded: ${data.actualAmount} ${data.currency} / ${data.limitAmount} ${data.currency}.`,
    "Open finance",
    links.financeUrl
  );

export const renderMonitoringEmployeeAfkTemplate = (
  data: MonitoringEmployeeAfkTemplateData,
  severity: string,
  links: NotificationLinks
): string =>
  appendMarkdownLink(
    `*[${severity}]* ${data.employeeName} has been AFK for ${data.minutesAfk} minute(s).`,
    "Open monitoring",
    links.employeeMonitoringUrl
  );

export const renderFallbackNotificationTemplate = (event: string, severity: string): string =>
  `*[${severity}]* Unsupported notification event: ${event}.`;
