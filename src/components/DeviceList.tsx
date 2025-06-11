import React, { useState } from 'react';
import { Monitor, Smartphone, Router, Printer, Shield, ShieldAlert, Search, Filter } from 'lucide-react';
import { useArpMonitoring } from '../hooks/useArpMonitoring';
import { Device } from '../types';
import { formatDistanceToNow } from 'date-fns';

export function DeviceList() {
  const { devices } = useArpMonitoring();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAuthorized, setFilterAuthorized] = useState<'all' | 'authorized' | 'unauthorized'>('all');

  const getDeviceIcon = (vendor: string) => {
    const vendorLower = vendor.toLowerCase();
    if (vendorLower.includes('apple') || vendorLower.includes('iphone')) return Smartphone;
    if (vendorLower.includes('cisco') || vendorLower.includes('router')) return Router;
    if (vendorLower.includes('printer') || vendorLower.includes('hp')) return Printer;
    return Monitor;
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = searchTerm === '' || 
      device.mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.ip.includes(searchTerm) ||
      device.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.hostname && device.hostname.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterAuthorized === 'all' ||
      (filterAuthorized === 'authorized' && device.isAuthorized) ||
      (filterAuthorized === 'unauthorized' && !device.isAuthorized);

    return matchesSearch && matchesFilter;
  });

  const authorizedCount = devices.filter(d => d.isAuthorized).length;
  const unauthorizedCount = devices.filter(d => !d.isAuthorized).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Device Discovery</h1>
        <p className="text-gray-400">Monitor and manage discovered network devices</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Devices</p>
              <p className="text-2xl font-bold text-white mt-1">{devices.length}</p>
            </div>
            <Monitor className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Authorized</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{authorizedCount}</p>
            </div>
            <Shield className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Unauthorized</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{unauthorizedCount}</p>
            </div>
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by MAC, IP, vendor, or hostname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterAuthorized}
            onChange={(e) => setFilterAuthorized(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Devices</option>
            <option value="authorized">Authorized Only</option>
            <option value="unauthorized">Unauthorized Only</option>
          </select>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDevices.map((device) => {
          const DeviceIcon = getDeviceIcon(device.vendor);
          return (
            <div key={device.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${device.isAuthorized ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <DeviceIcon className={`h-6 w-6 ${device.isAuthorized ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {device.hostname || device.vendor}
                    </h3>
                    <p className="text-gray-400 text-sm">{device.vendor}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {device.isAuthorized ? (
                    <Shield className="h-5 w-5 text-green-400" title="Authorized" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-red-400" title="Unauthorized" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">MAC Address</span>
                  <span className="text-white font-mono text-sm">{device.mac}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">IP Address</span>
                  <span className="text-white font-mono text-sm">{device.ip}</span>
                </div>

                {device.previousIps.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-400 text-sm">Previous IPs</span>
                    <div className="text-right">
                      {device.previousIps.slice(0, 2).map((ip, index) => (
                        <div key={index} className="text-gray-500 font-mono text-xs">{ip}</div>
                      ))}
                      {device.previousIps.length > 2 && (
                        <div className="text-gray-500 text-xs">+{device.previousIps.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="text-gray-400 text-sm">First Seen</span>
                  <span className="text-gray-300 text-sm">
                    {formatDistanceToNow(new Date(device.firstSeen), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Last Seen</span>
                  <span className="text-gray-300 text-sm">
                    {formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  device.isAuthorized 
                    ? 'text-green-400 bg-green-500/10' 
                    : 'text-red-400 bg-red-500/10'
                }`}>
                  {device.isAuthorized ? 'Authorized' : 'Unauthorized'}
                </span>
                
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs">Online</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No devices found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria' : 'No devices have been discovered yet'}
          </p>
        </div>
      )}
    </div>
  );
}