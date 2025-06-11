import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { JobManager } from './components/JobManager';
import { DeviceList } from './components/DeviceList';
import { AlertHistory } from './components/AlertHistory';
import { Settings } from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'jobs':
        return <JobManager />;
      case 'devices':
        return <DeviceList />;
      case 'history':
        return <AlertHistory />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}
    </Layout>
  );
}

export default App;