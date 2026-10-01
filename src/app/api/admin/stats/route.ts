import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// Simple middleware can check admin session, here we just return the stats
export async function GET() {
  try {
    const db = await getDb();

    const participants = await db.collection('Participant').countDocuments();
    const correctAnswers = await db.collection('HuntEvent').countDocuments({ eventType: 'ANSWER_CORRECT' });

    // Full completions: every participant who has collected all 3 code words.
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

    /*
      A full-completion table only has anyone in it once someone finishes all
      18 challenges - which, for most of the event, is nobody. "Leaderboard
      not coming" was this being empty for the entire hunt, not an actual
      bug in the query. This adds a second ranking that fills in from the
      very first fragment anyone finds: every participant ordered by
      fragments discovered, tie-broken by whoever reached that count first.
      This is what the admin page watches live; fullCompletionsAggr above
      still answers "who actually won."
    */
    const liveRankingAggr = await db.collection('ParticipantLetter').aggregate([
      { $group: { _id: '$participantId', fragments: { $sum: 1 }, lastFragmentAt: { $max: '$discoveredAt' } } },
      { $sort: { fragments: -1, lastFragmentAt: 1 } },
      { $limit: 50 },
      { $lookup: {
          from: 'Participant',
          localField: '_id',
          foreignField: '_id',
          as: 'participant'
      }},
      { $unwind: '$participant' },
      { $project: {
          _id: 0,
          publicId: '$participant.publicId',
          name: '$participant.name',
          fragments: 1,
          lastFragmentAt: 1
      }}
    ]).toArray();

    return NextResponse.json({
      participants,
      correctAnswers,
      fullCompletions,
      winners: fullCompletionsAggr, // Full completions, in finishing order
      leaderboard: liveRankingAggr, // Everyone, ranked by progress so far
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
