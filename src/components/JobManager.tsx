import React, { useState } from 'react';
import { Plus, Play, Pause, Edit, Trash2, Settings, Wifi, Clock } from 'lucide-react';
import { useArpMonitoring } from '../hooks/useArpMonitoring';
import { Job } from '../types';
import { formatDistanceToNow } from 'date-fns';

export function JobManager() {
  const { jobs, executeScan, createJob, updateJob, deleteJob, isScanning } = useArpMonitoring();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const handleCreateJob = (jobData: Omit<Job, 'id' | 'createdAt'>) => {
    createJob(jobData);
    setShowCreateForm(false);
  };

  const handleUpdateJob = (id: string, updates: Partial<Job>) => {
    updateJob(id, updates);
    setEditingJob(null);
  };

  const handleExecuteScan = async (job: Job) => {
    if (!isScanning) {
      await executeScan(job);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Job Management</h1>
          <p className="text-gray-400">Configure and manage ARP scanning jobs</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Job</span>
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{job.name}</h3>
                <p className="text-gray-400 text-sm">{job.description}</p>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleExecuteScan(job)}
                  disabled={isScanning || !job.isActive}
                  className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Run scan"
                >
                  <Play className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingJob(job)}
                  className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="Edit job"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete job"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Status</span>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${job.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span className={`text-sm ${job.isActive ? 'text-green-400' : 'text-gray-500'}`}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  {job.interfaces.join(', ')} • {job.subnets.length} subnets
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  Every {job.frequency} minutes
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">
                  {job.authorizedMacs.length} authorized MACs
                </span>
              </div>

              {job.lastRun && (
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-gray-400 text-xs">
                    Last run: {formatDistanceToNow(new Date(job.lastRun), { addSuffix: true })}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No jobs configured</h3>
          <p className="text-gray-500 mb-4">Create your first ARP scanning job to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Job</span>
          </button>
        </div>
      )}

      {/* Create/Edit Job Modal */}
      {(showCreateForm || editingJob) && (
        <JobForm
          job={editingJob}
          onSave={editingJob ? 
            (updates) => handleUpdateJob(editingJob.id, updates) : 
            handleCreateJob
          }
          onCancel={() => {
            setShowCreateForm(false);
            setEditingJob(null);
          }}
        />
      )}
    </div>
  );
}

interface JobFormProps {
  job?: Job | null;
  onSave: (job: Omit<Job, 'id' | 'createdAt'> | Partial<Job>) => void;
  onCancel: () => void;
}

function JobForm({ job, onSave, onCancel }: JobFormProps) {
  const [formData, setFormData] = useState({
    name: job?.name || '',
    description: job?.description || '',
    interfaces: job?.interfaces.join(', ') || 'eth0',
    subnets: job?.subnets.join(', ') || '192.168.1.0/24',
    authorizedMacs: job?.authorizedMacs.join('\n') || '',
    frequency: job?.frequency || 5,
    isActive: job?.isActive ?? true,
    alertConfig: {
      newDeviceAlert: job?.alertConfig.newDeviceAlert ?? true,
      unauthorizedDeviceAlert: job?.alertConfig.unauthorizedDeviceAlert ?? true,
      ipChangeAlert: job?.alertConfig.ipChangeAlert ?? true,
      deviceDisappearedAlert: job?.alertConfig.deviceDisappearedAlert ?? false,
      alertLevel: job?.alertConfig.alertLevel || 'warning' as const,
    },
    grafanaWebhook: job?.grafanaWebhook || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const jobData = {
      name: formData.name,
      description: formData.description,
      interfaces: formData.interfaces.split(',').map(s => s.trim()).filter(Boolean),
      subnets: formData.subnets.split(',').map(s => s.trim()).filter(Boolean),
      authorizedMacs: formData.authorizedMacs.split('\n').map(s => s.trim()).filter(Boolean),
      frequency: formData.frequency,
      isActive: formData.isActive,
      schedule: {
        type: 'interval' as const,
        value: `${formData.frequency}m`,
        timezone: 'UTC'
      },
      alertConfig: formData.alertConfig,
      grafanaWebhook: formData.grafanaWebhook || undefined,
      lastRun: job?.lastRun,
      nextRun: job?.nextRun
    };

    onSave(jobData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            {job ? 'Edit Job' : 'Create New Job'}
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frequency (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Network Interfaces (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.interfaces}
                  onChange={(e) => setFormData({ ...formData, interfaces: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="eth0, wlan0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subnets (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.subnets}
                  onChange={(e) => setFormData({ ...formData, subnets: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="192.168.1.0/24, 10.0.0.0/24"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Authorized MAC Addresses (one per line)
              </label>
              <textarea
                value={formData.authorizedMacs}
                onChange={(e) => setFormData({ ...formData, authorizedMacs: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="00:11:22:33:44:55&#10;aa:bb:cc:dd:ee:ff"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Grafana Webhook URL (optional)
              </label>
              <input
                type="url"
                value={formData.grafanaWebhook}
                onChange={(e) => setFormData({ ...formData, grafanaWebhook: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://your-grafana.com/api/webhooks/..."
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Alert Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.alertConfig.newDeviceAlert}
                      onChange={(e) => setFormData({
                        ...formData,
                        alertConfig: { ...formData.alertConfig, newDeviceAlert: e.target.checked }
                      })}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-gray-300">New Device Alert</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.alertConfig.unauthorizedDeviceAlert}
                      onChange={(e) => setFormData({
                        ...formData,
                        alertConfig: { ...formData.alertConfig, unauthorizedDeviceAlert: e.target.checked }
                      })}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-gray-300">Unauthorized Device Alert</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.alertConfig.ipChangeAlert}
                      onChange={(e) => setFormData({
                        ...formData,
                        alertConfig: { ...formData.alertConfig, ipChangeAlert: e.target.checked }
                      })}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-gray-300">IP Change Alert</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.alertConfig.deviceDisappearedAlert}
                      onChange={(e) => setFormData({
                        ...formData,
                        alertConfig: { ...formData.alertConfig, deviceDisappearedAlert: e.target.checked }
                      })}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <span className="text-gray-300">Device Disappeared Alert</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Alert Level
                </label>
                <select
                  value={formData.alertConfig.alertLevel}
                  onChange={(e) => setFormData({
                    ...formData,
                    alertConfig: { ...formData.alertConfig, alertLevel: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
              <label htmlFor="isActive" className="text-gray-300">
                Job is active
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {job ? 'Update Job' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}