import React, { useState } from 'react';
import { AlertTriangle, Info, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { useArpMonitoring } from '../hooks/useArpMonitoring';
import { Alert } from '../types';
import { formatDistanceToNow, format } from 'date-fns';

export function AlertHistory() {
  const { alerts, acknowledgeAlert, clearAlerts } = useArpMonitoring();
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [filterAcknowledged, setFilterAcknowledged] = useState<'all' | 'acknowledged' | 'unacknowledged'>('all');

  const getAlertIcon = (level: Alert['level']) => {
    switch (level) {
      case 'info': return Info;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertCircle;
      default: return Info;
    }
  };

  const getAlertColor = (level: Alert['level']) => {
    switch (level) {
      case 'info': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesLevel = filterLevel === 'all' || alert.level === filterLevel;
    const matchesAcknowledged = filterAcknowledged === 'all' ||
      (filterAcknowledged === 'acknowledged' && alert.acknowledged) ||
      (filterAcknowledged === 'unacknowledged' && !alert.acknowledged);
    
    return matchesLevel && matchesAcknowledged;
  });

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.level === 'critical' && !a.acknowledged).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Alert History</h1>
          <p className="text-gray-400">Monitor and manage security alerts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={clearAlerts}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Alerts</p>
              <p className="text-2xl font-bold text-white mt-1">{alerts.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Unacknowledged</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{unacknowledgedCount}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Critical</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{criticalCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Acknowledged</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{alerts.length - unacknowledgedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filterAcknowledged}
            onChange={(e) => setFilterAcknowledged(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Alerts</option>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const AlertIcon = getAlertIcon(alert.level);
          const alertColors = getAlertColor(alert.level);
          
          return (
            <div
              key={alert.id}
              className={`p-6 rounded-xl border transition-all ${alertColors} ${
                alert.acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-2 rounded-lg ${alert.acknowledged ? 'opacity-60' : ''}`}>
                    <AlertIcon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-white font-semibold">{alert.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.level === 'info' ? 'text-blue-300 bg-blue-500/20' :
                        alert.level === 'warning' ? 'text-amber-300 bg-amber-500/20' :
                        'text-red-300 bg-red-500/20'
                      }`}>
                        {alert.level.toUpperCase()}
                      </span>
                      {alert.acknowledged && (
                        <span className="px-2 py-1 rounded text-xs font-medium text-green-300 bg-green-500/20">
                          ACKNOWLEDGED
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 mb-3">{alert.message}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Job: {alert.jobName}</span>
                      <span>•</span>
                      <span>{format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm:ss')}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                    </div>
                    
                    {alert.device && (
                      <div className="mt-3 p-3 bg-gray-700/30 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          {alert.device.mac && (
                            <div>
                              <span className="text-gray-400">MAC: </span>
                              <span className="text-white font-mono">{alert.device.mac}</span>
                            </div>
                          )}
                          {alert.device.ip && (
                            <div>
                              <span className="text-gray-400">IP: </span>
                              <span className="text-white font-mono">{alert.device.ip}</span>
                            </div>
                          )}
                          {alert.device.vendor && (
                            <div>
                              <span className="text-gray-400">Vendor: </span>
                              <span className="text-white">{alert.device.vendor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3 py-1 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/10 transition-colors text-sm"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No alerts found</h3>
          <p className="text-gray-500">
            {alerts.length === 0 ? 'No alerts have been generated yet' : 'Try adjusting your filter criteria'}
          </p>
        </div>
      )}
    </div>
  );
}