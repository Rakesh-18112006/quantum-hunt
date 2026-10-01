'use client';

import { useState, useEffect } from 'react';
import { Scan, Upload, X, Zap } from 'lucide-react';
import QuantumScanner from '@/components/treasure/QuantumScanner';
import css from './TreasureHunt.module.css';

const CODE_COLORS = ['var(--qh-accent)', 'var(--qh-accent2)', 'var(--qh-accent3)'];

type HuntState = {
  progress: any[];
  stats: {
    solvedChallenges: number;
    discoveredFragments: number;
    totalFragments: number;
    isHuntComplete: boolean;
  };
};

export default function TreasureHunt() {
  const [huntState, setHuntState] = useState<HuntState | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [showFinal, setShowFinal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/hunt/progress');
      if (res.ok) {
        const data = await res.json();
        setHuntState(data);
        if (data.stats.isHuntComplete) {
          setShowFinal(true);
        }
      } else {
        if (res.status === 401) {
          // Need to login, handle redirect or show login
          const url = new URL(window.location.href);
          const token = url.searchParams.get('token');
          if (token) {
            window.location.href = `/login?token=${token}`;
          } else {
            window.location.href = '/login';
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();

    // Auto-resolve QR token if present in URL (e.g. from native camera scan)
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (token) {
      handleScanSuccess(token);
      // Clean up URL so it doesn't re-trigger on refresh
      window.history.replaceState({}, '', '/treasure');
    }
  }, []);

  const handleScanSuccess = async (token: string) => {
    setShowScanner(false);
    setLoading(true);
    try {
      const res = await fetch('/api/hunt/qr/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alreadySolved) {
          alert(data.message);
        } else if (data.type === 'DUMMY') {
          alert(data.message);
        } else {
          setActiveChallenge(data);
        }
      } else {
        alert(data.error || 'Failed to resolve QR');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const ChallengeModal = () => {
    const [ans, setAns] = useState('');
    const [err, setErr] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const submit = async () => {
      setSubmitting(true);
      try {
        const res = await fetch(`/api/hunt/challenge/${activeChallenge.id}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: ans })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.isDummy) {
            alert(data.message); // Show the dummy message
          } else {
            alert('Correct! Fragment acquired.');
          }
          setActiveChallenge(null);
          fetchProgress();
        } else {
          setErr(true);
          setTimeout(() => setErr(false), 500);
        }
      } catch (err) {
        setErr(true);
      } finally {
        setSubmitting(false);
      }
    };

    if (!activeChallenge) return null;
    return (
      <div className={css.modalOverlay}>
        <div className={css.modalContent} style={{ position: 'relative' }}>
          <button className={css.closeBtn} onClick={() => setActiveChallenge(null)}><X size={20}/></button>
          <div>
            <h3 className={css.challengeTitle}>{activeChallenge.observationPoint}</h3>
            <p className={css.statLabel} style={{ marginTop: '0.2rem' }}>MEASUREMENT REQUIRED</p>
          </div>
          <p className={css.challengePrompt}>{activeChallenge.prompt}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
            {activeChallenge.options?.map((opt: string, i: number) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', border: ans === opt ? '1px solid var(--qh-accent)' : '1px solid transparent' }}>
                <input 
                  type="radio" 
                  name="mcq" 
                  value={opt} 
                  checked={ans === opt} 
                  onChange={(e) => setAns(e.target.value)} 
                  disabled={submitting}
                  style={{ accentColor: 'var(--qh-accent)' }}
                />
                <span style={{ fontSize: '0.9rem' }}>{opt}</span>
              </label>
            ))}
          </div>

          {err && <p style={{ color: 'red', fontSize: '0.8rem', textAlign: 'center' }}>Incorrect state. Try again.</p>}

          <button className={css.challengeSubmit} onClick={submit} disabled={!ans || submitting}>
            {submitting ? 'STABILIZING...' : 'STABILIZE STATE'}
          </button>
        </div>
      </div>
    );
  };

  if (loading && !huntState) return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;

  const total = huntState?.stats?.discoveredFragments || 0;
  const pct = huntState?.stats?.totalFragments ? Math.round((total / huntState.stats.totalFragments) * 100) : 0;

  return (
    <div className={css.mapPage}>
      {/* Header */}
      <div className={css.topBar}>
        <div className={css.topHeader}>
          <div>
            <h1 className={css.topTitle}>
              <Zap size={20} color="var(--qh-accent)" />
              QUANTUM TREASURE HUNT
            </h1>
          </div>
        </div>
        
        <div className={css.statsBar}>
          <div className={css.statBlock}>
            <span className={css.statLabel}>OBSERVATION</span>
            <span className={css.statValue}>{String(Math.min(total + 1, 18)).padStart(2,'0')} / 18</span>
          </div>
          <div className={css.statBlock}>
            <span className={css.statLabel}>INFORMATION</span>
            <span className={css.statValue} style={{ color: 'var(--qh-accent)' }}>{total} FRAGMENTS STABILIZED</span>
          </div>
          <div className={css.statBlock}>
            <span className={css.statLabel}>QUANTUM COHERENCE</span>
            <span className={css.statValue} style={{ color: 'var(--qh-accent2)' }}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* Dashboard Body */}
      <div className={css.dashboard}>
        {/* Right Column */}
        <div className={css.rightCol} style={{ width: '100%' }}>
          <div className={css.panel} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className={css.scanBtn} onClick={() => setShowScanner(true)}>
              <Scan size={20} /> SCAN QUANTUM SIGNAL
            </button>
          </div>

          <div className={css.panel}>
            <h2 className={css.panelTitle}>THREE HIDDEN CODE WORDS</h2>
            
            {huntState?.progress.map((word: any, i: number) => {
              const discoveredCount = word.fragments.filter((f: any) => f.discovered).length;
              return (
                <div key={i} className={css.codeState}>
                  <div className={css.codeStateHeader}>
                    <span className={css.codeStateLabel}>CODE STATE 0{i + 1}</span>
                    <span className={css.codeStateProgress}>{discoveredCount} / {word.fragments.length} STABILIZED</span>
                  </div>
                  <div className={css.codeDots}>
                    {word.fragments.map((frag: any, j: number) => (
                      <div key={j} className={`${css.codeDot} ${frag.discovered ? css.codeDotFilled : css.codeDotEmpty}`} style={{ color: CODE_COLORS[i] }}>
                        {frag.discovered ? frag.displayValue : ''}
                      </div>
                    ))}
                  </div>
                  {word.isCompleted && (
                    <div style={{ marginTop: '0.5rem', color: CODE_COLORS[i], fontWeight: 'bold' }}>
                      WORD: {word.revealedWord}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showScanner && (
        <div className={css.modalOverlay}>
          <div className={css.modalContent}>
            <button className={css.closeBtn} onClick={() => setShowScanner(false)}><X size={20}/></button>
            <QuantumScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />
          </div>
        </div>
      )}

      {activeChallenge && <ChallengeModal />}
    </div>
  );
}
