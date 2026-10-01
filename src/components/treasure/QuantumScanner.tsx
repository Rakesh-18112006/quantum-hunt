import { useEffect, useRef, useState, useCallback } from 'react';
import { Upload, X, Aperture } from 'lucide-react';
import css from '@/app/(hunt)/treasure/TreasureHunt.module.css';

type ScanState =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'detected'
  | 'verified'
  | 'error-camera'
  | 'error-invalid';

interface QuantumScannerProps {
  onScanSuccess: (challengeId: string) => void;
  onClose: () => void;
}

export default function QuantumScanner({ onScanSuccess, onClose }: QuantumScannerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);
  const jsQRRef   = useRef<((data: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null>(null);

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  // ── Stop camera cleanly ─────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── QR decode & validate ────────────────────────────────────────────────
  const handleQRData = useCallback((raw: string) => {
    let token = raw;
    try {
      const url = new URL(raw);
      if (url.searchParams.get('token')) {
        token = url.searchParams.get('token')!;
      }
    } catch {}

    setDetectedCode(token.substring(0, 8) + '...');
    setScanState('detected');
    stopCamera();
    setTimeout(() => {
      setScanState('verified');
      setTimeout(() => onScanSuccess(token), 600);
    }, 900);
  }, [onScanSuccess, stopCamera]);

  // ── Camera scan loop ────────────────────────────────────────────────────
  const startScanLoop = useCallback(async () => {
    // Lazy-load jsQR once
    if (!jsQRRef.current) {
      const mod = await import('jsqr');
      jsQRRef.current = mod.default as (data: Uint8ClampedArray, w: number, h: number) => { data: string } | null;
    }
    const jsQR = jsQRRef.current;

    const scan = () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result  = jsQR(imgData.data, imgData.width, imgData.height);
      if (result) {
        handleQRData(result.data);
        return; // stop loop
      }
      rafRef.current = requestAnimationFrame(scan);
    };

    rafRef.current = requestAnimationFrame(scan);
  }, [handleQRData]);

  // ── Start camera ────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setScanState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanState('active');
      await startScanLoop();
    } catch {
      setScanState('error-camera');
    }
  }, [startScanLoop]);

  // Auto-start on mount
  useEffect(() => {
    if ('mediaDevices' in navigator) {
      startCamera();
    } else {
      setScanState('error-camera');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── File upload handler ─────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Lazy-load jsQR
    if (!jsQRRef.current) {
      const mod = await import('jsqr');
      jsQRRef.current = mod.default as (data: Uint8ClampedArray, w: number, h: number) => { data: string } | null;
    }
    const jsQR = jsQRRef.current;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result  = jsQR(imgData.data, imgData.width, imgData.height);
      URL.revokeObjectURL(img.src);
      if (result) {
        handleQRData(result.data);
      } else {
        setScanState('error-invalid');
        setTimeout(() => setScanState(streamRef.current ? 'active' : 'idle'), 2200);
      }
    };
    img.onerror = () => setScanState('error-invalid');
    img.src = URL.createObjectURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  }, [handleQRData]);

  // ── Status labels ───────────────────────────────────────────────────────
  const statusText: Record<ScanState, string> = {
    idle:            'INITIALISING SCANNER...',
    requesting:      'REQUESTING CAMERA ACCESS...',
    active:          'SEARCHING FOR QUANTUM SIGNAL...',
    detected:        'QUANTUM SIGNAL DETECTED',
    verified:        'OBSERVATION POINT VERIFIED',
    'error-camera':  'CAMERA UNAVAILABLE — USE IMAGE UPLOAD',
    'error-invalid': 'SIGNAL UNRECOGNISED — ALIGN QR AND RETRY',
  };

  const statusCls =
    scanState === 'active'   ? css.scannerStatusActive :
    scanState.startsWith('error') ? css.scannerStatusError :
    scanState === 'detected' || scanState === 'verified' ? css.scannerStatusActive :
    '';

  return (
    <div className={css.scannerPage}>
      {/* Header */}
      <div className={css.scannerHeader}>
        <button className={css.backBtn} onClick={onClose} aria-label="Close scanner">
          <X size={14} /> CLOSE
        </button>
        <span className={css.scannerTitle}>QUANTUM SIGNAL SCANNER</span>
        <Aperture size={14} color="#22d3ee" style={{ marginLeft: 'auto' }} />
      </div>

      {/* Body */}
      <div className={css.scannerBody}>

        {/* Viewport */}
        <div className={css.scannerViewport}>

          {/* Camera video */}
          <video
            ref={videoRef}
            className={css.scannerVideo}
            autoPlay muted playsInline
            style={{ display: scanState === 'active' ? 'block' : 'none' }}
            aria-hidden="true"
          />

          {/* Idle / requesting placeholder */}
          {(scanState === 'idle' || scanState === 'requesting' || scanState === 'error-camera') && (
            <div style={{
              width: '100%', height: '100%',
              background: 'var(--qh-scan-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '0.75rem',
            }}>
              <Aperture size={32} color="rgba(34,211,238,0.3)" />
              <span style={{
                fontFamily: "'Orbitron',monospace", fontSize: '0.55rem',
                color: 'var(--qh-faint)', letterSpacing: '0.2em',
              }}>
                {scanState === 'error-camera' ? 'NO CAMERA SIGNAL' : 'STANDBY'}
              </span>
            </div>
          )}

          {/* Detection overlay */}
          {(scanState === 'detected' || scanState === 'verified') && (
            <div className={css.scannerDetected}>
              <div className={css.detectRing} />
              <div className={css.detectRing} style={{ animationDelay: '0.3s' }} />
              <p className={css.detectText}>
                {scanState === 'verified' ? 'SIGNAL VERIFIED' : 'QUANTUM SIGNAL DETECTED'}
              </p>
              {detectedCode && (
                <p className={css.detectSub}>
                  OBSERVATION {detectedCode.replace('ch-', '').padStart(2,'0')} IDENTIFIED
                </p>
              )}
            </div>
          )}

          {/* Quantum frame — always visible */}
          {scanState !== 'error-camera' && (
            <div className={css.scannerFrame}>
              <div className={`${css.scannerCorner} tl`} />
              <div className={`${css.scannerCorner} tr`} />
              <div className={`${css.scannerCorner} bl`} />
              <div className={`${css.scannerCorner} br`} />
              {/* Scanning line only when active */}
              {scanState === 'active' && <div className={css.scannerLine} />}
            </div>
          )}
        </div>

        {/* Status text */}
        <p className={`${css.scannerStatus} ${statusCls}`}>
          {statusText[scanState]}
        </p>

        {/* Instruction */}
        {scanState === 'active' && (
          <p style={{
            fontFamily: "'Space Grotesk',monospace", fontSize: '0.65rem',
            color: 'var(--qh-faint)', letterSpacing: '0.12em', textAlign: 'center',
          }}>
            ALIGN THE QR CODE WITHIN THE QUANTUM FRAME
          </p>
        )}

        {/* Upload button */}
        <label className={css.uploadBtn} role="button" tabIndex={0}>
          <Upload size={13} />
          UPLOAD QR IMAGE
          <input
            type="file"
            accept="image/*,image/jpeg,image/png,image/gif,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            tabIndex={-1}
          />
        </label>

        {/* Desktop hint */}
        <p style={{
          fontFamily: "'Space Grotesk',monospace", fontSize: '0.55rem',
          color: 'var(--qh-deep)', letterSpacing: '0.1em', textAlign: 'center',
        }}>
          DESKTOP: USE IMAGE UPLOAD WITH A SCREENSHOT OF THE QR CODE
        </p>
      </div>

      {/* Hidden canvas for frame analysis */}
      <canvas ref={canvasRef} className={css.scannerCanvas} aria-hidden="true" />
    </div>
  );
}
