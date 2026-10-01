'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [name, setName] = useState('');
  const [publicId, setPublicId] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Welcome! Your unique ID is: ${data.publicId}\n\nSAVE THIS ID! You will need it to resume if you accidentally close the game.`);
      router.push('/treasure');
    }
  };

  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Welcome back, ${data.name}! Resuming your session...`);
      router.push('/treasure');
    } else {
      alert(data.error || 'Invalid ID.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#22d3ee', marginBottom: '2rem' }}>QUANTUM HUNT</h1>
      
      <div style={{ border: '1px solid #333', padding: '2rem', width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
          <button onClick={() => setIsLogin(false)} style={{ flex: 1, padding: '0.5rem', background: !isLogin ? '#333' : 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}>NEW</button>
          <button onClick={() => setIsLogin(true)} style={{ flex: 1, padding: '0.5rem', background: isLogin ? '#333' : 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}>RESUME</button>
        </div>

        {!isLogin ? (
          <>
            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Enter your designation (Name/Roll No) to begin a new observation:</p>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={{ padding: '0.5rem', background: '#111', border: '1px solid #444', color: 'white' }}
              placeholder="e.g. Alice / N210001"
            />
            <button 
              onClick={handleRegister}
              style={{ background: '#22d3ee', color: 'black', padding: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}
            >
              INITIALIZE NEW SESSION
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Enter your unique ID (e.g., QH-123456) to resume your previous state:</p>
            <input 
              type="text" 
              value={publicId} 
              onChange={e => setPublicId(e.target.value)} 
              style={{ padding: '0.5rem', background: '#111', border: '1px solid #444', color: 'white' }}
              placeholder="QH-XXXXXX"
            />
            <button 
              onClick={handleLogin}
              style={{ background: '#22d3ee', color: 'black', padding: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}
            >
              RESUME SESSION
            </button>
          </>
        )}
      </div>
    </div>
  );
}
