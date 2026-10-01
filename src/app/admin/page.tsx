'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Atom, Trophy, QrCode, Download, Loader2, RefreshCw } from 'lucide-react';
import css from './Admin.module.css';

interface Winner {
  publicId: string;
  name: string;
  lastCompletedAt: string;
}

interface LeaderRow {
  publicId: string;
  name: string;
  fragments: number;
  lastFragmentAt: string;
}

interface Stats {
  participants: number;
  correctAnswers: number;
  fullCompletions: number;
  winners: Winner[];
  leaderboard: LeaderRow[];
}

interface QrRow {
  id: string;
  token: string;
  type: 'REAL' | 'DUMMY';
  observationPoint: string;
  letterValue: string | null;
}

const EASE: [number, number, number, number] = [0.2, 0.65, 0.3, 0.9];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [qrs, setQrs] = useState<QrRow[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [board, setBoard] = useState<'live' | 'winners'>('live');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats');
    if (res.ok) setStats(await res.json());
  };

  const fetchQRs = async () => {
    const res = await fetch('/api/admin/qrs');
    if (res.ok) {
      const data = await res.json();
      setQrs(data.qrs);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchQRs();
  }, []);

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchQRs()]);
    setRefreshing(false);
  };

  const generateQRs = async () => {
    await fetch('/api/admin/qrs', { method: 'POST' });
    fetchQRs();
  };

  // Printed QR stickers around campus already point at /login?token=... (a
  // Google-Lens-opened scan always lands somewhere sensible that way, logged
  // in or not), so any newly generated code matches the ones already out
  // there instead of introducing a second URL shape.
  const qrUrlFor = (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/login?token=${token}`;
  };

  const downloadQR = async (qr: QrRow) => {
    try {
      const dataUrl = await QRCode.toDataURL(qrUrlFor(qr.token), {
        width: 1024,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      const safeName = qr.observationPoint.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `QR_${qr.type}_${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate QR', err);
      alert('Failed to generate QR code image.');
    }
  };

  const downloadAllAsPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });

      let realCounter = 1;
      let dummyCounter = 1;

      const realQrs = qrs.filter(q => q.type === 'REAL');
      const dummyQrs = qrs.filter(q => q.type === 'DUMMY');
      const allSorted = [...realQrs, ...dummyQrs];

      const x = 30;
      const y = 20;
      const size = 65; // 65x65 mm image
      const xSpacing = 85;
      const ySpacing = 90;

      let col = 0;
      let row = 0;

      for (let i = 0; i < allSorted.length; i++) {
        const qr = allSorted[i];

        let label = '';
        let letterLabel = '';
        if (qr.type === 'REAL') {
          label = `REAL_${String(realCounter++).padStart(2, '0')}`;
          if (qr.letterValue) {
            letterLabel = `(Letter: ${qr.letterValue})`;
          }
        } else {
          label = `DUMMY_${String(dummyCounter++).padStart(2, '0')}`;
        }

        const dataUrl = await QRCode.toDataURL(qrUrlFor(qr.token), {
          width: 512,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        });

        const currentX = x + col * xSpacing;
        const currentY = y + row * ySpacing;

        doc.addImage(dataUrl, 'PNG', currentX, currentY, size, size);
        doc.setFontSize(14);
        doc.text(label, currentX + (size / 2), currentY + size + 7, { align: 'center' });

        doc.setFontSize(10);
        if (letterLabel) {
          doc.text(letterLabel, currentX + (size / 2), currentY + size + 12, { align: 'center' });
        }

        doc.setFontSize(8);
        doc.text(qr.observationPoint, currentX + (size / 2), currentY + size + 17, { align: 'center', maxWidth: size });

        col++;
        if (col >= 2) {
          col = 0;
          row++;
          if (row >= 3 && i < allSorted.length - 1) {
            row = 0;
            doc.addPage();
          }
        }
      }

      doc.save('Quantum_Hunt_All_100_QRs.pdf');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Failed to generate PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const rankClass = (i: number) =>
    i === 0 ? css.rankGold : i === 1 ? css.rankSilver : i === 2 ? css.rankBronze : undefined;

  return (
    <div className={css.page}>
      <motion.div
        className={css.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <Atom size={26} className={css.headerIcon} />
        <h1 className={css.title}>QUANTUM HUNT — ADMIN</h1>
      </motion.div>

      <div className={css.container}>
        <motion.div
          className={css.statGrid}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
        >
          <div className={css.statCard}>
            <div className={css.statLabel}>Participants</div>
            <div className={css.statValue}>{stats?.participants ?? '—'}</div>
          </div>
          <div className={css.statCard}>
            <div className={css.statLabel}>Correct Answers</div>
            <div className={css.statValue}>{stats?.correctAnswers ?? '—'}</div>
          </div>
          <div className={css.statCard}>
            <div className={css.statLabel}>Completed Hunts</div>
            <div className={css.statValue}>{stats?.fullCompletions ?? '—'}</div>
          </div>
          <div className={css.statCard}>
            <div className={css.statLabel}>QR Codes</div>
            <div className={css.statValue}>{qrs.length}</div>
          </div>
        </motion.div>

        <motion.div
          className={css.panel}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
        >
          <div className={css.panelHeader}>
            <h2 className={css.panelTitle}><Trophy size={16} /> Leaderboard</h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className={css.tabRow}>
                <button
                  className={`${css.tabBtn} ${board === 'live' ? css.tabBtnActive : ''}`}
                  onClick={() => setBoard('live')}
                >
                  LIVE PROGRESS
                </button>
                <button
                  className={`${css.tabBtn} ${board === 'winners' ? css.tabBtnActive : ''}`}
                  onClick={() => setBoard('winners')}
                >
                  WINNERS
                </button>
              </div>
              <button className={css.smallBtn} onClick={refreshAll} disabled={refreshing} aria-label="Refresh">
                <RefreshCw size={13} className={refreshing ? css.loadingSpin : ''} />
              </button>
            </div>
          </div>

          {board === 'live' ? (
            stats?.leaderboard && stats.leaderboard.length > 0 ? (
              <table className={css.table}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Public ID</th>
                    <th>Fragments</th>
                    <th>Last Find</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.leaderboard.map((row, i) => (
                    <tr key={row.publicId}>
                      <td className={rankClass(i)}>#{i + 1}</td>
                      <td>{row.name}</td>
                      <td className={css.publicIdCell}>{row.publicId}</td>
                      <td>{row.fragments} / 18</td>
                      <td>{new Date(row.lastFragmentAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={css.emptyState}>No fragments discovered yet.</p>
            )
          ) : stats?.winners && stats.winners.length > 0 ? (
            <table className={css.table}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Public ID</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {stats.winners.map((winner, i) => (
                  <tr key={winner.publicId}>
                    <td className={rankClass(i)}>#{i + 1}</td>
                    <td>{winner.name}</td>
                    <td className={css.publicIdCell}>{winner.publicId}</td>
                    <td>{new Date(winner.lastCompletedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={css.emptyState}>No participants have completed the hunt yet.</p>
          )}
        </motion.div>

        <motion.div
          className={css.panel}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
        >
          <div className={css.panelHeader}>
            <h2 className={css.panelTitle}><QrCode size={16} /> QR Codes ({qrs.length})</h2>
            <div className={css.actions}>
              {qrs.length > 0 && (
                <button className={`${css.btn} ${css.btnAmber}`} onClick={downloadAllAsPDF} disabled={isGeneratingPdf}>
                  {isGeneratingPdf ? <Loader2 size={13} className={css.loadingSpin} /> : <Download size={13} />}
                  {isGeneratingPdf ? 'GENERATING...' : 'DOWNLOAD ALL AS PDF'}
                </button>
              )}
              {qrs.length < 100 && (
                <button className={`${css.btn} ${css.btnPrimary}`} onClick={generateQRs}>
                  GENERATE REMAINING
                </button>
              )}
            </div>
          </div>

          <table className={css.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Point</th>
                <th>Token (URL: /login?token=…)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {qrs.map(qr => (
                <tr key={qr.id}>
                  <td style={{ color: qr.type === 'REAL' ? 'var(--qh-accent)' : 'var(--qh-faint)' }}>{qr.type}</td>
                  <td>{qr.observationPoint}</td>
                  <td className={css.publicIdCell}>{qr.token}</td>
                  <td>
                    <button className={css.smallBtn} onClick={() => downloadQR(qr)}>Download PNG</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
