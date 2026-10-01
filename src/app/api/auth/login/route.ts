import { NextResponse } from 'next/server';
import clientPromise, { getDb } from '@/lib/mongodb';
import { setSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicId } = body;

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
      await db.collection('HuntEvent').insertOne({
        publicId,
        eventType: 'LOGIN_FAILED',
        metadata: JSON.stringify({ reason: 'Invalid participant ID' }),
        createdAt: new Date(),
        environment: process.env.NODE_ENV
      });
      return NextResponse.json({ success: false, error: 'Invalid participant ID' }, { status: 404 });
    }

    // Set secure cookie session
    await setSession(participant._id.toString(), publicId);

    // Track successful login
    await db.collection('HuntEvent').insertOne({
      participantId: participant._id,
      publicId: participant.publicId,
      eventType: 'LOGIN_SUCCESS',
      createdAt: new Date(),
      environment: process.env.NODE_ENV
    });

    return NextResponse.json({ success: true, publicId, name: participant.name });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Failed to login' }, { status: 500 });
  }
}
