export type NotificationLinkConfig = {
  appBaseUrl: string;
  projectPagePathTemplate: string;
  financePagePathTemplate: string;
  monitoringPagePathTemplate: string;
};

export type NotificationLinks = {
  projectUrl?: string;
  financeUrl?: string;
  employeeMonitoringUrl?: string;
};

export type NotificationLinkData = {
  projectId?: string;
  employeeId?: string;
};
