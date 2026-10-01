import { NextResponse } from 'next/server';
import clientPromise, { getDb } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

function hashAnswer(answer: string) {
  const norm = answer.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(norm).digest('hex');
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let challengeId: ObjectId;
  try {
    challengeId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: 'Invalid challenge ID' }, { status: 400 });
  }

  try {
    const { answer } = await request.json();
    if (!answer) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    const db = await getDb();
    const participantId = new ObjectId(session.participantId as string);

    // Get challenge
    const challenge = await db.collection('QRChallenge').findOne({ _id: challengeId, active: true });
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found or inactive' }, { status: 404 });
    }

    // DUMMIES can be answered now

    // Check if already solved
    const existing = await db.collection('ParticipantChallenge').findOne({ participantId, challengeId });
    if (existing?.status === 'SOLVED') {
      return NextResponse.json({ error: 'Already solved' }, { status: 400 });
    }

    const isCorrect = challenge.answerHash === hashAnswer(answer);

    // Update attempts
    await db.collection('ParticipantChallenge').updateOne(
      { participantId, challengeId },
      { 
        $set: { status: isCorrect ? 'SOLVED' : 'ATTEMPTED' },
        $inc: { attempts: 1 }
      },
      { upsert: true }
    );

    // Log event
    await db.collection('HuntEvent').insertOne({
      participantId,
      eventType: isCorrect ? 'ANSWER_CORRECT' : 'ANSWER_FAILED',
      challengeId,
      metadata: JSON.stringify({ isDummy: challenge.type === 'DUMMY' }),
      createdAt: new Date()
    });

    if (!isCorrect) {
      return NextResponse.json({ success: false, message: 'Quantum state unresolved. Incorrect answer.' });
    }

    // CORRECT ANSWER LOGIC
    if (challenge.type === 'DUMMY') {
      // It's a dummy, give them the dummy message and NO fragment
      return NextResponse.json({
        success: true,
        isDummy: true,
        message: challenge.dummyMessage || 'The quantum trail continues... but no fragment here.',
        fragment: null
      });
    }

    // It's a REAL challenge
    // Unlock the letter!
    if (challenge.letterId) {
      await db.collection('ParticipantLetter').updateOne(
        { participantId, letterId: challenge.letterId },
        { $setOnInsert: { participantId, letterId: challenge.letterId, discoveredAt: new Date() } },
        { upsert: true }
      );
      
      await db.collection('HuntEvent').insertOne({
        participantId,
        eventType: 'LETTER_UNLOCKED',
        challengeId,
        createdAt: new Date()
      });

      // CHECK FOR WORD COMPLETION
      // Find the word this letter belongs to
      const letter = await db.collection('GameLetter').findOne({ _id: challenge.letterId });
      if (letter) {
        const wordId = letter.wordId;
        // How many letters in this word total?
        const totalLetters = await db.collection('GameLetter').countDocuments({ wordId });
        
        // How many of this word's letters has the participant unlocked?
        // First get all letter IDs for this word
        const wordLetters = await db.collection('GameLetter').find({ wordId }).toArray();
        const wordLetterIds = wordLetters.map(l => l._id);
        
        const unlockedCount = await db.collection('ParticipantLetter').countDocuments({
          participantId,
          letterId: { $in: wordLetterIds }
        });

        if (unlockedCount === totalLetters) {
          // Word is complete!
          await db.collection('ParticipantWord').updateOne(
            { participantId, wordId },
            { $setOnInsert: { participantId, wordId, completedAt: new Date() } },
            { upsert: true }
          );
          
          await db.collection('HuntEvent').insertOne({
            participantId,
            eventType: 'WORD_COMPLETED',
            metadata: JSON.stringify({ wordId }),
            createdAt: new Date()
          });
        }
      }
    }

    // Get the newly unlocked letter to return to frontend
    const unlockedLetter = await db.collection('GameLetter').findOne({ _id: challenge.letterId });

    return NextResponse.json({ 
      success: true, 
      message: 'Measurement successful.',
      fragment: unlockedLetter ? {
        position: unlockedLetter.position,
        letterValue: unlockedLetter.letterValue,
      } : null
    });

  } catch (error) {
    console.error('Answer submission error:', error);
    return NextResponse.json({ error: 'Failed to process answer' }, { status: 500 });
  }
}
