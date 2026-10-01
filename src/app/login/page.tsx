'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Atom, Phone, ScanLine, ArrowRight, Loader2 } from 'lucide-react';
import css from './Login.module.css';

const STORAGE_KEY = 'qh_participant';

export default function Login() {
  const [publicId, setPublicId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      if (token) return `/treasure?token=${token}`;
    }
    return '/treasure';
  };

  // ── Skip the form entirely for a visitor who is already logged in ────────
  // A physical QR sticker's URL doesn't change between scans, and this page
  // is where that URL points every time, so without this check a returning
  // participant - someone who logged in from the very first node they found
  // - would be asked to log in again at every single node after it.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok && alive) {
          router.replace(getRedirectUrl());
          return;
        }
      } catch {
        /* fall through to showing the form */
      }
      // A device whose cookie didn't survive (some QR-scanner apps open the
      // link in a sandboxed view with its own cookie jar) still has this in
      // localStorage, which is usually shared with the device's real
      // browser. Try a silent re-login with it before asking the person to
      // type their ID again.
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved && alive) {
        try {
          const parsed = JSON.parse(saved);
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: parsed.publicId, phoneNumber: parsed.phoneNumber }),
          });
          const data = await res.json();
          if (data.success && alive) {
            router.replace(getRedirectUrl());
            return;
          }
        } catch {
          /* fall through */
        }
      }
      if (alive) setCheckingSession(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    const trimmedId = publicId.trim().toUpperCase();
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedId || !trimmedPhone) {
      setError('Enter both your Qiskit-Id and phone number.');
      return;
    }
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId: trimmedId, phoneNumber: trimmedPhone })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ publicId: trimmedId, phoneNumber: trimmedPhone }));
      router.push(getRedirectUrl());
    } else if (res.status === 404) {
      // If it doesn't exist, we register them
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: trimmedId, phoneNumber: trimmedPhone })
      });
      const regData = await regRes.json();

      if (regData.success) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ publicId: trimmedId, phoneNumber: trimmedPhone }));
        router.push(getRedirectUrl());
      } else {
        setError(regData.error || 'Failed to register ID.');
        setLoading(false);
      }
    } else {
      setError(data.error || 'Invalid ID.');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className={css.page}>
        <div className={css.checkingWrap}>
          <Loader2 size={22} className={css.spin} />
        </div>
      </div>
    );
  }

  return (
    <div className={css.page}>
      {/* Floating ambient qubits, purely decorative, CSS-driven so they never touch the main thread */}
      <div className={css.orbField} aria-hidden="true">
        <span className={css.orb} style={{ ['--d' as string]: '0s', ['--x' as string]: '12%', ['--y' as string]: '18%' }} />
        <span className={css.orb} style={{ ['--d' as string]: '1.4s', ['--x' as string]: '82%', ['--y' as string]: '12%' }} />
        <span className={css.orb} style={{ ['--d' as string]: '2.6s', ['--x' as string]: '78%', ['--y' as string]: '72%' }} />
        <span className={css.orb} style={{ ['--d' as string]: '0.8s', ['--x' as string]: '18%', ['--y' as string]: '78%' }} />
      </div>

      <motion.div
        className={css.card}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] }}
      >
        <div className={css.badge}>
          <Atom size={26} className={css.badgeIcon} />
        </div>

        <h1 className={css.title}>QUANTUM HUNT</h1>
        <p className={css.subtitle}>Enter your Qiskit-Id and phone number to begin or resume your observation.</p>

        <div className={css.field}>
          <ScanLine size={16} className={css.fieldIcon} />
          <input
            type="text"
            value={publicId}
            onChange={(e) => setPublicId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="QSK2026000001"
            className={css.input}
            autoComplete="off"
            inputMode="text"
          />
        </div>

        <div className={css.field}>
          <Phone size={16} className={css.fieldIcon} />
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Phone number"
            className={css.input}
            autoComplete="tel"
            inputMode="tel"
            maxLength={13}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              className={css.error}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button onClick={handleSubmit} disabled={loading} className={css.submit}>
          {loading ? (
            <Loader2 size={16} className={css.spin} />
          ) : (
            <>
              INITIALIZE SESSION <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className={css.footnote}>Your phone number is only used to reach winners after the hunt.</p>
      </motion.div>
    </div>
  );
}
