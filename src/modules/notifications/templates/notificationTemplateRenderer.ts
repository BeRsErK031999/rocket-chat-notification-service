import {
  renderFallbackNotificationTemplate,
  renderFinanceBudgetExceededTemplate,
  renderMonitoringEmployeeAfkTemplate,
  renderProjectDeadlineOverdueTemplate,
  renderProjectMemberOverallocatedTemplate
} from "./notificationTemplates.js";
import type {
  FinanceBudgetExceededTemplateData,
  MonitoringEmployeeAfkTemplateData,
  NotificationTemplateInput,
  ProjectDeadlineOverdueTemplateData,
  ProjectMemberOverallocatedTemplateData
} from "./notificationTemplateTypes.js";

export const renderNotificationTemplate = (input: NotificationTemplateInput): string => {
  switch (input.event) {
    case "project.deadline.overdue":
      return renderProjectDeadlineOverdueTemplate(
        input.data as ProjectDeadlineOverdueTemplateData,
        input.severity
      );

    case "project.member.overallocated":
      return renderProjectMemberOverallocatedTemplate(
        input.data as ProjectMemberOverallocatedTemplateData,
        input.severity
      );

    case "finance.budget.exceeded":
      return renderFinanceBudgetExceededTemplate(
        input.data as FinanceBudgetExceededTemplateData,
        input.severity
      );

    case "monitoring.employee.afk":
      return renderMonitoringEmployeeAfkTemplate(
        input.data as MonitoringEmployeeAfkTemplateData,
        input.severity
      );

    default:
      return renderFallbackNotificationTemplate(input.event, input.severity);
  }
};
