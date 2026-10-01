import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { setSession } from '@/lib/auth';
import { isValidPhone, normalizePhone } from '@/lib/phone';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicId, phoneNumber } = body;

    const idRegex = /^QSK2026[0-9]{6,10}$/;
    if (!idRegex.test(publicId)) {
      return NextResponse.json({ success: false, error: 'Invalid Qiskit-Id format. Must be QSK2026 followed by digits.' }, { status: 400 });
    }

    if (!phoneNumber || !isValidPhone(phoneNumber)) {
      return NextResponse.json({ success: false, error: 'Enter a valid 10-digit phone number.' }, { status: 400 });
    }

    const db = await getDb();

    // Check if already exists
    const existing = await db.collection('Participant').findOne({ publicId });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Qiskit-Id already registered.' }, { status: 409 });
    }

    const sessionToken = uuidv4();

    const participant = {
      publicId,
      phoneNumber: normalizePhone(phoneNumber),
      name: 'Observer',
      sessionToken,
      createdAt: new Date(),
    };

    let insertedId;
    try {
      const result = await db.collection('Participant').insertOne(participant);
      insertedId = result.insertedId;
    } catch (err: unknown) {
      // Two devices racing to register the same ID at once - the findOne
      // check above can't catch this, only the collection's unique index on
      // publicId can. Report it the same way the pre-check does instead of a
      // generic 500.
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 11000) {
        return NextResponse.json({ success: false, error: 'Qiskit-Id already registered.' }, { status: 409 });
      }
      throw err;
    }

    // Set secure cookie session
    await setSession(insertedId.toString(), publicId);

    // Analytics only - the registration has already succeeded and the
    // session cookie is already set, so this is logged without making the
    // participant wait for a third database round trip.
    db.collection('HuntEvent').insertOne({
      participantId: insertedId,
      publicId: publicId,
      eventType: 'REGISTER_SUCCESS',
      createdAt: new Date(),
      environment: process.env.NODE_ENV
    }).catch((err) => console.error('Failed to log REGISTER_SUCCESS:', err));

    return NextResponse.json({ success: true, publicId, name: participant.name });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Failed to register' }, { status: 500 });
  }
}
