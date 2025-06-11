import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Job, Device, Alert, ScanResult } from '../types';

// Mock data generator
const mockVendors = ['Apple', 'Samsung', 'Intel', 'Broadcom', 'Cisco', 'TP-Link', 'Netgear', 'Linksys'];
const mockHostnames = ['iPhone-12', 'MacBook-Pro', 'Samsung-TV', 'Windows-PC', 'Raspberry-Pi', 'Router', 'Printer'];

const generateMockDevice = (): Device => {
  const mac = Array.from({ length: 6 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':');
  
  const ip = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
  
  return {
    id: crypto.randomUUID(),
    mac,
    ip,
    vendor: mockVendors[Math.floor(Math.random() * mockVendors.length)],
    hostname: mockHostnames[Math.floor(Math.random() * mockHostnames.length)],
    firstSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    lastSeen: new Date(),
    isAuthorized: Math.random() > 0.3,
    previousIps: []
  };
};

export function useArpMonitoring() {
  const [jobs, setJobs] = useLocalStorage<Job[]>('arp-jobs', []);
  const [devices, setDevices] = useLocalStorage<Device[]>('arp-devices', []);
  const [alerts, setAlerts] = useLocalStorage<Alert[]>('arp-alerts', []);
  const [scanResults, setScanResults] = useLocalStorage<ScanResult[]>('arp-scan-results', []);
  const [isScanning, setIsScanning] = useState(false);

  // Initialize with mock data if empty
  useEffect(() => {
    if (devices.length === 0) {
      const mockDevices = Array.from({ length: 15 }, generateMockDevice);
      setDevices(mockDevices);
    }
  }, [devices.length, setDevices]);

  // Mock scan execution
  const executeScan = useCallback(async (job: Job): Promise<ScanResult> => {
    setIsScanning(true);
    
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const timestamp = new Date();
    const newDevices: Device[] = [];
    const scanAlerts: Alert[] = [];
    
    // Randomly generate new devices
    if (Math.random() > 0.7) {
      const newDevice = generateMockDevice();
      newDevices.push(newDevice);
      
      if (job.alertConfig.newDeviceAlert) {
        scanAlerts.push({
          id: crypto.randomUUID(),
          jobId: job.id,
          jobName: job.name,
          type: 'new_device',
          level: newDevice.isAuthorized ? 'info' : 'warning',
          title: 'New Device Detected',
          message: `New device ${newDevice.vendor} (${newDevice.mac}) found at ${newDevice.ip}`,
          device: newDevice,
          timestamp,
          acknowledged: false
        });
      }
      
      if (!newDevice.isAuthorized && job.alertConfig.unauthorizedDeviceAlert) {
        scanAlerts.push({
          id: crypto.randomUUID(),
          jobId: job.id,
          jobName: job.name,
          type: 'unauthorized_device',
          level: 'critical',
          title: 'Unauthorized Device',
          message: `Unauthorized device ${newDevice.vendor} (${newDevice.mac}) detected at ${newDevice.ip}`,
          device: newDevice,
          timestamp,
          acknowledged: false
        });
      }
    }
    
    const result: ScanResult = {
      id: crypto.randomUUID(),
      jobId: job.id,
      timestamp,
      devicesFound: devices.length + newDevices.length,
      newDevices: newDevices.length,
      alerts: scanAlerts,
      executionTime: Math.floor(Math.random() * 5000) + 1000,
      status: 'success'
    };
    
    setDevices(prev => [...prev, ...newDevices]);
    setAlerts(prev => [...scanAlerts, ...prev]);
    setScanResults(prev => [result, ...prev.slice(0, 99)]); // Keep last 100 results
    setIsScanning(false);
    
    return result;
  }, [devices.length, setDevices, setAlerts, setScanResults]);

  const createJob = useCallback((job: Omit<Job, 'id' | 'createdAt'>) => {
    const newJob: Job = {
      ...job,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    setJobs(prev => [...prev, newJob]);
    return newJob;
  }, [setJobs]);

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setJobs(prev => prev.map(job => job.id === id ? { ...job, ...updates } : job));
  }, [setJobs]);

  const deleteJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id));
  }, [setJobs]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  }, [setAlerts]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, [setAlerts]);

  return {
    jobs,
    devices,
    alerts,
    scanResults,
    isScanning,
    executeScan,
    createJob,
    updateJob,
    deleteJob,
    acknowledgeAlert,
    clearAlerts
  };
}