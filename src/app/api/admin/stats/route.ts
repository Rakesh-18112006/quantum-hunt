import { NextResponse } from 'next/server';
import clientPromise, { getDb } from '@/lib/mongodb';

// Simple middleware can check admin session, here we just return the stats
export async function GET() {
  try {
    const db = await getDb();

    const participants = await db.collection('Participant').countDocuments();
    const correctAnswers = await db.collection('HuntEvent').countDocuments({ eventType: 'ANSWER_CORRECT' });
    const completedHunts = await db.collection('Participant').countDocuments(); // Would need deeper query for actual fully complete ones

    // Let's do a better completedHunts query: check how many users have 3 ParticipantWord docs
    const fullCompletionsAggr = await db.collection('ParticipantWord').aggregate([
      { $group: { _id: "$participantId", count: { $sum: 1 }, lastCompletedAt: { $max: "$completedAt" } } },
      { $match: { count: { $gte: 3 } } },
      { $sort: { lastCompletedAt: 1 } },
      { $lookup: {
          from: "Participant",
          localField: "_id",
          foreignField: "_id",
          as: "participant"
      }},
      { $unwind: "$participant" },
      { $project: {
          publicId: "$participant.publicId",
          name: "$participant.name",
          lastCompletedAt: 1
      }}
    ]).toArray();
    
    const fullCompletions = fullCompletionsAggr.length;

    return NextResponse.json({
      participants,
      correctAnswers,
      fullCompletions,
      winners: fullCompletionsAggr // Include winners for leaderboard
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
