import type {
  NotificationLinkConfig,
  NotificationLinkData,
  NotificationLinks
} from "./linkTypes.js";

export const defaultNotificationLinkConfig: NotificationLinkConfig = {
  appBaseUrl: "",
  projectPagePathTemplate: "/projects/:projectId",
  financePagePathTemplate: "/projects/:projectId/finance",
  monitoringPagePathTemplate: "/monitoring/employees/:employeeId"
};

export const notificationLinkConfigFromEnv = (): NotificationLinkConfig => ({
  appBaseUrl: process.env.APP_BASE_URL ?? defaultNotificationLinkConfig.appBaseUrl,
  projectPagePathTemplate:
    process.env.PROJECT_PAGE_PATH_TEMPLATE ??
    defaultNotificationLinkConfig.projectPagePathTemplate,
  financePagePathTemplate:
    process.env.FINANCE_PAGE_PATH_TEMPLATE ??
    defaultNotificationLinkConfig.financePagePathTemplate,
  monitoringPagePathTemplate:
    process.env.MONITORING_PAGE_PATH_TEMPLATE ??
    defaultNotificationLinkConfig.monitoringPagePathTemplate
});

const replacePathParams = (template: string, params: Record<string, string>): string => {
  let path = template;

  for (const [key, value] of Object.entries(params)) {
    path = path.replaceAll(`:${key}`, encodeURIComponent(value));
  }

  return path;
};

const buildUrl = (
  appBaseUrl: string,
  pathTemplate: string,
  params: Record<string, string>
): string | undefined => {
  const trimmedBaseUrl = appBaseUrl.trim();

  if (trimmedBaseUrl.length === 0) {
    return undefined;
  }

  const path = replacePathParams(pathTemplate, params);

  try {
    return new URL(path, `${trimmedBaseUrl.replace(/\/+$/, "")}/`).toString();
  } catch {
    return undefined;
  }
};

export const buildNotificationLinks = (
  data: NotificationLinkData,
  config: NotificationLinkConfig
): NotificationLinks => {
  const links: NotificationLinks = {};

  if (data.projectId !== undefined && data.projectId.length > 0) {
    const projectUrl = buildUrl(config.appBaseUrl, config.projectPagePathTemplate, {
      projectId: data.projectId
    });
    const financeUrl = buildUrl(config.appBaseUrl, config.financePagePathTemplate, {
      projectId: data.projectId
    });

    if (projectUrl !== undefined) {
      links.projectUrl = projectUrl;
    }

    if (financeUrl !== undefined) {
      links.financeUrl = financeUrl;
    }
  }

  if (data.employeeId !== undefined && data.employeeId.length > 0) {
    const employeeMonitoringUrl = buildUrl(
      config.appBaseUrl,
      config.monitoringPagePathTemplate,
      {
        employeeId: data.employeeId
      }
    );

    if (employeeMonitoringUrl !== undefined) {
      links.employeeMonitoringUrl = employeeMonitoringUrl;
    }
  }

  return links;
};
