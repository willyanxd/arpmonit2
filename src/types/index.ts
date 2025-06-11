export interface Device {
  id: string;
  mac: string;
  ip: string;
  vendor: string;
  hostname?: string;
  firstSeen: Date;
  lastSeen: Date;
  isAuthorized: boolean;
  previousIps: string[];
}

export interface Job {
  id: string;
  name: string;
  description: string;
  interfaces: string[];
  subnets: string[];
  authorizedMacs: string[];
  frequency: number; // minutes
  schedule: Schedule;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  alertConfig: AlertConfig;
  grafanaWebhook?: string;
  createdAt: Date;
}

export interface Schedule {
  type: 'interval' | 'cron';
  value: string;
  timezone: string;
}

export interface AlertConfig {
  newDeviceAlert: boolean;
  unauthorizedDeviceAlert: boolean;
  ipChangeAlert: boolean;
  deviceDisappearedAlert: boolean;
  alertLevel: 'info' | 'warning' | 'critical';
}

export interface Alert {
  id: string;
  jobId: string;
  jobName: string;
  type: 'new_device' | 'unauthorized_device' | 'ip_change' | 'device_disappeared';
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  device: Partial<Device>;
  timestamp: Date;
  acknowledged: boolean;
}

export interface ScanResult {
  id: string;
  jobId: string;
  timestamp: Date;
  devicesFound: number;
  newDevices: number;
  alerts: Alert[];
  executionTime: number;
  status: 'success' | 'error' | 'partial';
}