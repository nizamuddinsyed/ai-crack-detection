import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, 
  LogOut, 
  Shield, 
  Activity, 
  Image as ImageIcon,
  BarChart3,
  Settings,
  Crown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import UploadZone from './UploadZone';
import DetectionHistory from './DetectionHistory';
import StatsCards from './StatsCards';
import ActivityChart from './ActivityChart';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');

  const tabs = [
    { id: 'upload', label: 'Upload & Detect', icon: Upload },
    { id: 'history', label: 'Detection History', icon: ImageIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadZone />;
      case 'history':
        return <DetectionHistory />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <StatsCards />
            <ActivityChart />
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Account Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Subscription Plan</p>
                  <p className="text-gray-300 text-sm">
                    {user?.subscription_tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {user?.subscription_tier === 'pro' ? (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Shield className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">API Usage</p>
                  <p className="text-gray-300 text-sm">
                    {user?.api_calls_used || 0} / {user?.api_calls_limit || 0} calls used
                  </p>
                </div>
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(((user?.api_calls_used || 0) / (user?.api_calls_limit || 1)) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">CrackDetect Pro</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm text-white">{user?.email}</p>
                  <p className="text-xs text-gray-300">
                    {user?.subscription_tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </p>
                </div>
                {user?.subscription_tier === 'pro' ? (
                  <Crown className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Shield className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Usage Warning */}
      {user && user.api_calls_used >= user.api_calls_limit * 0.8 && (
        <div className="bg-yellow-500/20 border-l-4 border-yellow-500 p-4 mx-4 mt-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            <p className="text-yellow-200">
              {user.api_calls_used >= user.api_calls_limit 
                ? "You've reached your API limit. Upgrade to Pro for unlimited detections!"
                : `You've used ${user.api_calls_used} of ${user.api_calls_limit} API calls. Consider upgrading to Pro!`
              }
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;