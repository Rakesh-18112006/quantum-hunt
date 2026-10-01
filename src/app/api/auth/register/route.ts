import { NextResponse } from 'next/server';
import clientPromise, { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { setSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body; // Name is optional

    const db = await getDb();

    // Generate unique public ID for hunt
    const publicId = `QH-${Math.floor(100000 + Math.random() * 900000)}`;
    const sessionToken = uuidv4();

    const participant = {
      publicId,
      name: name || 'Anonymous Observer',
      sessionToken,
      createdAt: new Date(),
    };

    const result = await db.collection('Participant').insertOne(participant);
    
    // Set secure cookie session
    await setSession(result.insertedId.toString(), publicId);

    return NextResponse.json({ success: true, publicId, name: participant.name });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Failed to register' }, { status: 500 });
  }
}
