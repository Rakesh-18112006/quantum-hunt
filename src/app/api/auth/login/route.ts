import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { setSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json({ success: false, error: 'Public ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const participant = await db.collection('Participant').findOne({ publicId });
    if (!participant) {
      return NextResponse.json({ success: false, error: 'Invalid participant ID' }, { status: 404 });
    }

    // Set secure cookie session
    await setSession(participant._id.toString(), publicId);

    return NextResponse.json({ success: true, publicId, name: participant.name });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Failed to login' }, { status: 500 });
  }
}
