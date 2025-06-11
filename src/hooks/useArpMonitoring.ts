import { useState, useEffect, useCallback } from 'react';
import { Job, Device, Alert, ScanResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useArpMonitoring() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs');
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/devices`);
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();
      setDevices(data);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to fetch devices');
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to fetch alerts');
    }
  }, []);

  const fetchScanResults = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scans`);
      if (!response.ok) throw new Error('Failed to fetch scan results');
      const data = await response.json();
      setScanResults(data);
    } catch (err) {
      console.error('Error fetching scan results:', err);
      setError('Failed to fetch scan results');
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchJobs(),
        fetchDevices(),
        fetchAlerts(),
        fetchScanResults()
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchJobs, fetchDevices, fetchAlerts, fetchScanResults]);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDevices();
      fetchAlerts();
      fetchScanResults();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [fetchDevices, fetchAlerts, fetchScanResults]);

  // Execute scan
  const executeScan = useCallback(async (job: Job): Promise<ScanResult> => {
    setIsScanning(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${job.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to execute scan');
      }

      // Refresh data after scan
      await Promise.all([
        fetchDevices(),
        fetchAlerts(),
        fetchScanResults()
      ]);

      // Return a mock result for now - in real implementation, 
      // the API would return the actual scan result
      const result: ScanResult = {
        id: crypto.randomUUID(),
        jobId: job.id,
        timestamp: new Date(),
        devicesFound: 0,
        newDevices: 0,
        alerts: [],
        executionTime: 0,
        status: 'success'
      };

      return result;
    } catch (err) {
      console.error('Error executing scan:', err);
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, [fetchDevices, fetchAlerts, fetchScanResults]);

  // Create job
  const createJob = useCallback(async (jobData: Omit<Job, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      await fetchJobs();
      return response.json();
    } catch (err) {
      console.error('Error creating job:', err);
      throw err;
    }
  }, [fetchJobs]);

  // Update job
  const updateJob = useCallback(async (id: string, updates: Partial<Job>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      await fetchJobs();
    } catch (err) {
      console.error('Error updating job:', err);
      throw err;
    }
  }, [fetchJobs]);

  // Delete job
  const deleteJob = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      await fetchJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      throw err;
    }
  }, [fetchJobs]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${id}/acknowledge`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      await fetchAlerts();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      throw err;
    }
  }, [fetchAlerts]);

  // Clear alerts
  const clearAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear alerts');
      }

      await fetchAlerts();
    } catch (err) {
      console.error('Error clearing alerts:', err);
      throw err;
    }
  }, [fetchAlerts]);

  return {
    jobs,
    devices,
    alerts,
    scanResults,
    isScanning,
    loading,
    error,
    executeScan,
    createJob,
    updateJob,
    deleteJob,
    acknowledgeAlert,
    clearAlerts,
    refreshData: () => {
      fetchJobs();
      fetchDevices();
      fetchAlerts();
      fetchScanResults();
    }
  };
}