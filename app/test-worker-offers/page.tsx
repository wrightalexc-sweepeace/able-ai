"use client";

import React, { useState } from 'react';
import { getWorkerOffers } from '@/actions/gigs/get-worker-offers';

export default function TestWorkerOffersPage() {
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await getWorkerOffers(userId);
      setResult(response);
      console.log('Test result:', response);
    } catch (error) {
      console.error('Test error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Worker Offers</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          User ID (Firebase UID):
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            placeholder="Enter Firebase UID"
          />
        </label>
      </div>

      <button 
        onClick={handleTest}
        disabled={!userId || loading}
        style={{ padding: '10px 20px', marginBottom: '20px' }}
      >
        {loading ? 'Testing...' : 'Test getWorkerOffers'}
      </button>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Result:</h3>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
