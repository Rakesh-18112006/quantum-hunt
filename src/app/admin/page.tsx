'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [qrs, setQrs] = useState<any[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  const generateQRs = async () => {
    await fetch('/api/admin/qrs', { method: 'POST' });
    fetchQRs();
  };

  const downloadQR = async (qr: any) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const qrData = `${baseUrl}/treasure?token=${qr.token}`;
      
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 1024,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
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

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const qrData = `${baseUrl}/treasure?token=${qr.token}`;
        const dataUrl = await QRCode.toDataURL(qrData, {
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

  return (
    <div style={{ padding: '2rem', color: 'white', fontFamily: 'monospace' }}>
      <h1>Quantum Hunt Admin</h1>
      
      <div style={{ display: 'flex', gap: '2rem', margin: '2rem 0' }}>
        <div style={{ border: '1px solid #333', padding: '1rem' }}>
          <h3>Participants</h3>
          <p style={{ fontSize: '2rem' }}>{stats?.participants || 0}</p>
        </div>
        <div style={{ border: '1px solid #333', padding: '1rem' }}>
          <h3>Correct Answers</h3>
          <p style={{ fontSize: '2rem' }}>{stats?.correctAnswers || 0}</p>
        </div>
        <div style={{ border: '1px solid #333', padding: '1rem' }}>
          <h3>Completed Hunts</h3>
          <p style={{ fontSize: '2rem' }}>{stats?.fullCompletions || 0}</p>
        </div>
      </div>

      <div style={{ margin: '2rem 0', border: '1px solid #333', padding: '1rem' }}>
        <h2 style={{ color: '#22d3ee' }}>Leaderboard (Winners)</h2>
        {stats?.winners && stats.winners.length > 0 ? (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #555' }}>
                <th style={{ padding: '0.5rem' }}>Rank</th>
                <th>Name / ID</th>
                <th>Public ID</th>
                <th>Completion Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.winners.map((winner: any, index: number) => (
                <tr key={winner.publicId} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '0.5rem', color: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'white' }}>
                    #{index + 1}
                  </td>
                  <td>{winner.name}</td>
                  <td style={{ color: '#aaa' }}>{winner.publicId}</td>
                  <td>{new Date(winner.lastCompletedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ marginTop: '1rem', color: '#888' }}>No participants have completed the hunt yet.</p>
        )}
      </div>

      <div style={{ margin: '2rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>QR Codes ({qrs.length})</h2>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {qrs.length > 0 && (
              <button 
                onClick={downloadAllAsPDF}
                disabled={isGeneratingPdf}
                style={{ background: '#f59e0b', color: 'black', padding: '0.5rem 1rem', border: 'none', cursor: isGeneratingPdf ? 'wait' : 'pointer', fontWeight: 'bold' }}
              >
                {isGeneratingPdf ? 'Generating PDF...' : 'Download All 100 QRs as PDF'}
              </button>
            )}

            {qrs.length < 100 && (
              <button 
                onClick={generateQRs}
                style={{ background: '#22d3ee', color: 'black', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer' }}
              >
                Generate Remaining QRs up to 100
              </button>
            )}
          </div>
        </div>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ padding: '0.5rem' }}>Type</th>
              <th>Point</th>
              <th>Token (Print URL: /scan?token=...)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {qrs.map(qr => (
              <tr key={qr.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '0.5rem', color: qr.type === 'REAL' ? '#22d3ee' : '#888' }}>{qr.type}</td>
                <td>{qr.observationPoint}</td>
                <td style={{ fontFamily: 'monospace', color: '#aaa' }}>{qr.token}</td>
                <td>
                  <button 
                    onClick={() => downloadQR(qr)}
                    style={{ background: '#333', color: 'white', padding: '0.2rem 0.5rem', border: '1px solid #555', cursor: 'pointer' }}
                  >
                    Download PNG
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
