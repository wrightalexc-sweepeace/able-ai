"use client";

import React, { useState } from 'react';
import { createSampleGigs } from '@/actions/gigs/create-sample-gigs';

export default function TestCreateSampleGigsPage() {
  const [userId, setUserId] = useState('');
  const [count, setCount] = useState(5);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await createSampleGigs({ userId, count });
      setResult(response);
      console.log('Create result:', response);
    } catch (error) {
      console.error('Create error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Create Sample Gigs</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          User ID (Firebase UID - Buyer):
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            placeholder="Enter Firebase UID of buyer"
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Number of gigs:
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 5)}
            style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
            min="1"
            max="20"
          />
        </label>
      </div>

      <button 
        onClick={handleCreate}
        disabled={!userId || loading}
        style={{ padding: '10px 20px', marginBottom: '20px' }}
      >
        {loading ? 'Creating...' : 'Create Sample Gigs'}
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
