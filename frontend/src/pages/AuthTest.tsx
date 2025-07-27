import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG, apiCall } from '@/config/api';

const AuthTest: React.FC = () => {
  const [authResult, setAuthResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      console.log('Testing authentication...');
      console.log('Token from sessionStorage:', sessionStorage.getItem('token'));
      console.log('API endpoint:', API_CONFIG.PRESCRIPTIONS.CREATE.replace('/api/prescriptions', '/api/prescriptions/test-auth'));
      
      const response = await apiCall(API_CONFIG.PRESCRIPTIONS.CREATE.replace('/api/prescriptions', '/api/prescriptions/test-auth'));
      
      console.log('Auth test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth test response:', data);
        setAuthResult({ success: true, data });
      } else {
        const errorText = await response.text();
        console.error('Auth test error:', errorText);
        setAuthResult({ success: false, error: errorText, status: response.status });
      }
    } catch (error) {
      console.error('Auth test network error:', error);
      setAuthResult({ success: false, error: error.message, type: 'network' });
    } finally {
      setLoading(false);
    }
  };

  const testAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    console.log('=== AUTH HEADERS TEST ===');
    console.log('Token exists:', !!token);
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token starts with:', token.substring(0, 20) + '...');
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Token expires:', new Date(payload.exp * 1000));
        console.log('Token expired:', Date.now() > payload.exp * 1000);
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Testing</CardTitle>
            <CardDescription>
              Test authentication for prescription creation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testAuth} disabled={loading}>
                {loading ? 'Testing...' : 'Test Auth Endpoint'}
              </Button>
              <Button onClick={testAuthHeaders} variant="outline">
                Check Token Info
              </Button>
            </div>
            
            {authResult && (
              <Card className={`${authResult.success ? 'border-green-500' : 'border-red-500'}`}>
                <CardHeader>
                  <CardTitle className={authResult.success ? 'text-green-700' : 'text-red-700'}>
                    {authResult.success ? 'Success' : 'Error'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                    {JSON.stringify(authResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Current Session Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Token exists:</strong> {!!sessionStorage.getItem('token') ? 'Yes' : 'No'}</div>
                  <div><strong>User ID:</strong> {sessionStorage.getItem('userId') || 'Not set'}</div>
                  <div><strong>Role:</strong> {sessionStorage.getItem('role') || 'Not set'}</div>
                  <div><strong>Name:</strong> {sessionStorage.getItem('name') || 'Not set'}</div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthTest;
