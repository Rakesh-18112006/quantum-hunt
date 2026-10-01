import crypto from 'crypto';
import { URL } from 'url';

// Simulate DB
const db: any = {};
const publicToken = `token_${crypto.randomBytes(8).toString('hex')}`;
db[publicToken] = { active: true, type: 'REAL' };

// Simulate Admin Generate
const qrData = `http://localhost:3000/treasure?token=${publicToken}`;

// Simulate Scanner
let raw = qrData;
let token = raw;
try {
  const url = new URL(raw);
  if (url.searchParams.get('token')) {
    token = url.searchParams.get('token')!;
  }
} catch {}

// Simulate Resolve
const challenge = db[token];
console.log('Result:', challenge ? 'Found' : 'Not Found', 'Token:', token);
