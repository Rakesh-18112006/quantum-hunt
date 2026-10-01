'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [publicId, setPublicId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      if (token) return `/treasure?token=${token}`;
    }
    return '/treasure';
  };

  const handleSubmit = async () => {
    if (!publicId) return;
    setLoading(true);
    
    // First try to login
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId })
    });
    const data = await res.json();
    
    if (data.success) {
      alert(`Welcome back! Resuming your session...`);
      router.push(getRedirectUrl());
    } else if (res.status === 404) {
      // If it doesn't exist, we register them
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId })
      });
      const regData = await regRes.json();
      
      if (regData.success) {
        alert(`Welcome! Your Qiskit-Id has been registered successfully.`);
        router.push(getRedirectUrl());
      } else {
        alert(regData.error || 'Failed to register ID.');
        setLoading(false);
      }
    } else {
      alert(data.error || 'Invalid ID.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#22d3ee', marginBottom: '2rem' }}>QUANTUM HUNT</h1>
      
      <div style={{ border: '1px solid #333', padding: '2rem', width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <p style={{ fontSize: '0.8rem', color: '#aaa', textAlign: 'center', lineHeight: '1.4' }}>
          Enter your Qiskit-Id to begin or resume your observation.
        </p>
        
        <input 
          type="text" 
          value={publicId} 
          onChange={e => setPublicId(e.target.value.toUpperCase())} 
          style={{ padding: '0.5rem', background: '#111', border: '1px solid #444', color: 'white', textAlign: 'center', marginTop: '0.5rem' }}
          placeholder="QSK2026..."
        />
        
        <button 
          onClick={handleSubmit}
          disabled={loading}
          style={{ 
            background: loading ? '#555' : '#22d3ee', 
            color: loading ? '#ccc' : 'black', 
            padding: '0.5rem', 
            border: 'none', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            marginTop: '0.5rem' 
          }}
        >
          {loading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
        </button>
      </div>
    </div>
  );
}
