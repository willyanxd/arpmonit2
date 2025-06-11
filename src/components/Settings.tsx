import React, { useState } from 'react';
import { Settings as SettingsIcon, Webhook, Bell, Database, Network } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState({
    grafanaUrl: 'https://your-grafana.com',
    grafanaApiKey: '',
    defaultScanInterval: 5,
    maxAlertHistory: 1000,
    enableEmailNotifications: true,
    emailRecipients: 'admin@company.com',
    retentionDays: 30,
    networkInterface: 'eth0',
    defaultSubnet: '192.168.1.0/24'
  });

  const handleSave = () => {
    // In a real implementation, this would save to backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure system preferences and integrations</p>
      </div>

      <div className="space-y-8">
        {/* Grafana Integration */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Webhook className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Grafana Integration</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Grafana URL
              </label>
              <input
                type="url"
                value={settings.grafanaUrl}
                onChange={(e) => setSettings({ ...settings, grafanaUrl: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://your-grafana.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={settings.grafanaApiKey}
                onChange={(e) => setSettings({ ...settings, grafanaApiKey: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your Grafana API key"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.enableEmailNotifications}
                onChange={(e) => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
              <label htmlFor="emailNotifications" className="text-gray-300">
                Enable email notifications
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Recipients (comma-separated)
              </label>
              <input
                type="text"
                value={settings.emailRecipients}
                onChange={(e) => setSettings({ ...settings, emailRecipients: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@company.com, security@company.com"
              />
            </div>
          </div>
        </div>

        {/* Network Configuration */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Network className="h-6 w-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Network Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Default Network Interface
              </label>
              <input
                type="text"
                value={settings.networkInterface}
                onChange={(e) => setSettings({ ...settings, networkInterface: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="eth0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Default Subnet
              </label>
              <input
                type="text"
                value={settings.defaultSubnet}
                onChange={(e) => setSettings({ ...settings, defaultSubnet: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="192.168.1.0/24"
              />
            </div>
          </div>
        </div>

        {/* System Configuration */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="h-6 w-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">System Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Default Scan Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={settings.defaultScanInterval}
                onChange={(e) => setSettings({ ...settings, defaultScanInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Alert History
              </label>
              <input
                type="number"
                min="100"
                value={settings.maxAlertHistory}
                onChange={(e) => setSettings({ ...settings, maxAlertHistory: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Retention (days)
              </label>
              <input
                type="number"
                min="1"
                value={settings.retentionDays}
                onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}