import { NextResponse } from 'next/server';
import clientPromise, { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { setSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicId } = body;

    const idRegex = /^QSK2026[0-9]{6,10}$/;
    if (!idRegex.test(publicId)) {
      return NextResponse.json({ success: false, error: 'Invalid Qiskit-Id format. Must be QSK2026 followed by digits.' }, { status: 400 });
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
      name: 'Observer',
      sessionToken,
      createdAt: new Date(),
    };

    const result = await db.collection('Participant').insertOne(participant);
    
    // Set secure cookie session
    await setSession(result.insertedId.toString(), publicId);

    // Track successful registration
    await db.collection('HuntEvent').insertOne({
      participantId: result.insertedId,
      publicId: publicId,
      eventType: 'REGISTER_SUCCESS',
      createdAt: new Date(),
      environment: process.env.NODE_ENV
    });

    return NextResponse.json({ success: true, publicId, name: participant.name });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Failed to register' }, { status: 500 });
  }
}
