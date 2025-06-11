import React from 'react';
import { Shield, Activity, Settings, History, Users } from 'lucide-react';

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Navigation({ activeTab = 'dashboard', onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'jobs', label: 'Jobs', icon: Shield },
    { id: 'devices', label: 'Devices', icon: Users },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-blue-400" />
            <h1 className="text-xl font-bold text-white">ARP Monitor</h1>
          </div>
          
          <div className="flex space-x-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange?.(id)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  activeTab === id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}