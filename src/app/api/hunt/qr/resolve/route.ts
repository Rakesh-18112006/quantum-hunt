import { NextResponse } from 'next/server';
import clientPromise, { getDb } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const db = await getDb();

    // Find the challenge by QR token
    const challenge = await db.collection('QRChallenge').findOne({ publicToken: token, active: true });
    
    if (!challenge) {
      return NextResponse.json({ error: 'Unknown Quantum Signal' }, { status: 404 });
    }

    // Check if participant already solved this challenge
    const progress = await db.collection('ParticipantChallenge').findOne({
      participantId: new ObjectId(session.participantId as string),
      challengeId: challenge._id,
      status: 'SOLVED'
    });

    if (progress) {
      return NextResponse.json({ 
        alreadySolved: true,
        message: 'This quantum node has already collapsed for you.'
      });
    }

    // Log the event
    await db.collection('HuntEvent').insertOne({
      participantId: new ObjectId(session.participantId as string),
      eventType: 'QR_SCANNED',
      challengeId: challenge._id,
      metadata: JSON.stringify({ type: challenge.type }),
      createdAt: new Date()
    });

    // Return ONLY the current challenge info (NO answerHash, NO letterId, NO dummy status)
    return NextResponse.json({
      id: challenge._id,
      // We always return 'REAL' to the frontend so they don't know it's a dummy until answered
      type: 'REAL',
      observationPoint: challenge.observationPoint,
      challengeType: challenge.challengeType,
      prompt: challenge.prompt,
      options: challenge.options, // Pass the MCQ options
      hint: challenge.hint
    });
  } catch (error) {
    console.error('QR Resolve error:', error);
    return NextResponse.json({ error: 'Failed to resolve signal' }, { status: 500 });
  }
}
