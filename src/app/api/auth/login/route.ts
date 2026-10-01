import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { setSession } from '@/lib/auth';
import { normalizePhone } from '@/lib/phone';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicId, phoneNumber } = body;

    if (!publicId) {
      return NextResponse.json({ success: false, error: 'Public ID is required' }, { status: 400 });
    }

    const idRegex = /^QSK2026[0-9]{6,10}$/;
    if (!idRegex.test(publicId)) {
      return NextResponse.json({ success: false, error: 'Invalid Qiskit-Id format. Must be QSK2026 followed by digits.' }, { status: 400 });
    }

    const db = await getDb();

    const participant = await db.collection('Participant').findOne({ publicId });
    if (!participant) {
      // Analytics only - never blocks the response.
      db.collection('HuntEvent').insertOne({
        publicId,
        eventType: 'LOGIN_FAILED',
        metadata: JSON.stringify({ reason: 'Invalid participant ID' }),
        createdAt: new Date(),
        environment: process.env.NODE_ENV
      }).catch((err) => console.error('Failed to log LOGIN_FAILED:', err));
      return NextResponse.json({ success: false, error: 'Invalid participant ID' }, { status: 404 });
    }

    // Set secure cookie session
    await setSession(participant._id.toString(), publicId);

    // Older participants registered before the phone field existed; this
    // quietly backfills it on their next login instead of making them
    // re-register. Never blocks the response, and never overwrites a number
    // already on file with a mistyped one.
    if (!participant.phoneNumber && phoneNumber) {
      const normalized = normalizePhone(phoneNumber);
      if (normalized) {
        db.collection('Participant')
          .updateOne({ _id: participant._id }, { $set: { phoneNumber: normalized } })
          .catch((err) => console.error('Failed to backfill phoneNumber:', err));
      }
    }

    // Analytics only - the session cookie is already set above.
    db.collection('HuntEvent').insertOne({
      participantId: participant._id,
      publicId: participant.publicId,
      eventType: 'LOGIN_SUCCESS',
      createdAt: new Date(),
      environment: process.env.NODE_ENV
    }).catch((err) => console.error('Failed to log LOGIN_SUCCESS:', err));

    return NextResponse.json({ success: true, publicId, name: participant.name });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Failed to login' }, { status: 500 });
  }
}
