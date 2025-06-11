import React from 'react';
import { Activity, AlertTriangle, Shield, Users, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { useArpMonitoring } from '../hooks/useArpMonitoring';
import { Alert } from '../types';
import { formatDistanceToNow } from 'date-fns';

export function Dashboard() {
  const { jobs, devices, alerts, scanResults, loading, error, refreshData } = useArpMonitoring();

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">Error loading dashboard: {error}</span>
            <button
              onClick={refreshData}
              className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter(job => job.isActive);
  const unauthorizedDevices = devices.filter(device => !device.isAuthorized);
  const recentAlerts = alerts.filter(alert => !alert.acknowledged).slice(0, 5);
  const criticalAlerts = alerts.filter(alert => alert.level === 'critical' && !alert.acknowledged);

  const stats = [
    {
      label: 'Active Jobs',
      value: activeJobs.length,
      icon: Shield,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Total Devices',
      value: devices.length,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Unauthorized',
      value: unauthorizedDevices.length,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      label: 'Critical Alerts',
      value: criticalAlerts.length,
      icon: Activity,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    }
  ];

  const getAlertColor = (level: Alert['level']) => {
    switch (level) {
      case 'info': return 'text-blue-400 bg-blue-500/10';
      case 'warning': return 'text-amber-400 bg-amber-500/10';
      case 'critical': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Network Monitoring Dashboard</h1>
          <p className="text-gray-400">Real-time ARP network monitoring and device detection</p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Alerts</h2>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="p-3 rounded-lg bg-gray-700/50 border border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getAlertColor(alert.level)}`}>
                          {alert.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="text-white font-medium">{alert.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent alerts</p>
            )}
          </div>
        </div>

        {/* Active Jobs Status */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Active Jobs</h2>
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div className="space-y-3">
            {activeJobs.length > 0 ? (
              activeJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="p-3 rounded-lg bg-gray-700/50 border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{job.name}</h3>
                      <p className="text-gray-400 text-sm">
                        Interfaces: {job.interfaces.join(', ')}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Frequency: {job.frequency} minutes
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No active jobs</p>
            )}
          </div>
        </div>

        {/* Network Activity */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Network Activity</h2>
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Devices Online</span>
              <span className="text-white font-semibold">{devices.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Authorized Devices</span>
              <span className="text-green-400 font-semibold">
                {devices.filter(d => d.isAuthorized).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Unauthorized Devices</span>
              <span className="text-red-400 font-semibold">{unauthorizedDevices.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Last Scan</span>
              <span className="text-gray-300 text-sm">
                {scanResults.length > 0 
                  ? formatDistanceToNow(new Date(scanResults[0].timestamp), { addSuffix: true })
                  : 'Never'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Recent Scan Results */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Scans</h2>
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="space-y-3">
            {scanResults.slice(0, 5).map((result) => (
              <div key={result.id} className="p-3 rounded-lg bg-gray-700/50 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      {jobs.find(j => j.id === result.jobId)?.name || 'Unknown Job'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {result.devicesFound} devices • {result.newDevices} new
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-300 text-sm">
                      {formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}
                    </p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.status === 'success' ? 'text-green-400 bg-green-500/10' :
                      result.status === 'error' ? 'text-red-400 bg-red-500/10' :
                      'text-amber-400 bg-amber-500/10'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}