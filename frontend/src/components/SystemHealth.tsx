
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastChecked: string;
  details: string;
}

const SystemHealth = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      name: 'Database Connection',
      status: 'healthy',
      lastChecked: new Date().toISOString(),
      details: 'All database connections are responsive'
    },
    {
      name: 'API Services',
      status: 'healthy',
      lastChecked: new Date().toISOString(),
      details: 'All API endpoints responding normally'
    },
    {
      name: 'Authentication Service',
      status: 'warning',
      lastChecked: new Date().toISOString(),
      details: 'Slightly elevated response times detected'
    },
    {
      name: 'File Storage',
      status: 'healthy',
      lastChecked: new Date().toISOString(),
      details: 'Storage systems operating within normal parameters'
    },
    {
      name: 'Email Service',
      status: 'error',
      lastChecked: new Date().toISOString(),
      details: 'SMTP server connection timeout - investigating'
    },
    {
      name: 'Backup Systems',
      status: 'healthy',
      lastChecked: new Date().toISOString(),
      details: 'Last backup completed successfully'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate API call to refresh health checks
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setHealthChecks(prev => prev.map(check => ({
      ...check,
      lastChecked: new Date().toISOString()
    })));
    
    setIsRefreshing(false);
  };

  const overallHealth = healthChecks.every(check => check.status === 'healthy') 
    ? 'healthy' 
    : healthChecks.some(check => check.status === 'error') 
    ? 'error' 
    : 'warning';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">System Health Monitor</h1>
                <p className="text-sm text-gray-500">Real-time system status and diagnostics</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(overallHealth)}
                  <span>Overall System Status</span>
                </CardTitle>
                <CardDescription>
                  Last updated: {new Date().toLocaleString()}
                </CardDescription>
              </div>
              {getStatusBadge(overallHealth)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {healthChecks.filter(check => check.status === 'healthy').length}
                </p>
                <p className="text-sm text-gray-600">Healthy Services</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {healthChecks.filter(check => check.status === 'warning').length}
                </p>
                <p className="text-sm text-gray-600">Warning Services</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {healthChecks.filter(check => check.status === 'error').length}
                </p>
                <p className="text-sm text-gray-600">Error Services</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Checks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {healthChecks.map((check, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(check.status)}
                    <span>{check.name}</span>
                  </CardTitle>
                  {getStatusBadge(check.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{check.details}</p>
                <p className="text-xs text-gray-400">
                  Last checked: {new Date(check.lastChecked).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SystemHealth;
