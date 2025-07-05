import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TechnicianTestResultsSimple = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Results - Simple Version</h1>
      <p>Welcome, {user?.name}!</p>
      <p>This is a simplified test results component.</p>
    </div>
  );
};

export default TechnicianTestResultsSimple;
