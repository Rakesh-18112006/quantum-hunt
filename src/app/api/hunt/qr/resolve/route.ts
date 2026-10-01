import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
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

    const session = await getSession();
    if (!session) {
      // Analytics only - respond immediately rather than waiting on it.
      db.collection('HuntEvent').insertOne({
        participantId: null,
        publicId: null,
        eventType: 'QR_SCANNED_ANONYMOUS',
        challengeId: challenge._id,
        metadata: JSON.stringify({ token }),
        createdAt: new Date(),
        environment: process.env.NODE_ENV
      }).catch((err) => console.error('Failed to log QR_SCANNED_ANONYMOUS:', err));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Analytics only - never blocks the response.
    db.collection('HuntEvent').insertOne({
      participantId: new ObjectId(session.participantId as string),
      eventType: 'QR_SCANNED',
      challengeId: challenge._id,
      metadata: JSON.stringify({ type: challenge.type }),
      createdAt: new Date()
    }).catch((err) => console.error('Failed to log QR_SCANNED:', err));

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
