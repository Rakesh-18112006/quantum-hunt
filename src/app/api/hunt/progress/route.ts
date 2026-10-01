import { NextResponse } from 'next/server';
import clientPromise, { getDb } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();
    const participantId = new ObjectId(session.participantId as string);

    // Get all words
    const words = await db.collection('GameWord').find({}).sort({ position: 1 }).toArray();
    
    // Get all user unlocked letters
    const unlockedDocs = await db.collection('ParticipantLetter').find({ participantId }).toArray();
    const unlockedLetterIds = unlockedDocs.map(d => d.letterId.toString());

    // Get all user completed words
    const completedWordDocs = await db.collection('ParticipantWord').find({ participantId }).toArray();
    const completedWordIds = completedWordDocs.map(d => d.wordId.toString());

    // Get all letters in DB to structure the progress correctly
    const allLetters = await db.collection('GameLetter').find({}).toArray();

    // Construct safe progress response
    const progress = words.map(word => {
      const isCompleted = completedWordIds.includes(word._id.toString());
      const wordLetters = allLetters.filter(l => l.wordId.toString() === word._id.toString());
      wordLetters.sort((a, b) => a.position - b.position);

      return {
        wordId: word._id,
        wordName: word.wordName,
        isCompleted,
        // ONLY expose the secret word if it's completed
        revealedWord: isCompleted ? word.secretWord : null,
        fragments: wordLetters.map(l => {
          const discovered = unlockedLetterIds.includes(l._id.toString());
          return {
            slot: l._id,
            position: l.position,
            discovered,
            // ONLY expose the letter if discovered
            displayValue: discovered ? l.letterValue : null
          };
        })
      };
    });

    // Get general stats
    const solvedChallenges = await db.collection('ParticipantChallenge').countDocuments({ participantId, status: 'SOLVED' });
    const totalFragments = allLetters.length;
    const discoveredFragments = unlockedDocs.length;

    return NextResponse.json({
      progress,
      stats: {
        solvedChallenges,
        discoveredFragments,
        totalFragments,
        isHuntComplete: discoveredFragments === totalFragments
      }
    });

  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
