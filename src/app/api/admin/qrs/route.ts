import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const currentCount = await db.collection('QRChallenge').countDocuments();
    const targetCount = 100;
    
    if (currentCount < targetCount) {
      const needed = targetCount - currentCount;
      const dummyDocs = Array.from({ length: needed }).map(() => ({
        publicToken: `token_${crypto.randomBytes(8).toString('hex')}`,
        type: 'DUMMY',
        observationPoint: `UNKNOWN NODE ${Math.floor(Math.random()*1000)}`,
        locationClue: 'Random fluctuations in the quantum field.',
        locationSignal: 'Somewhere on campus.',
        challengeType: 'hidden',
        prompt: 'There is no stable fragment here. The quantum noise is too high. Keep searching.',
        hint: '',
        answerHash: '',
        active: true,
        letterId: null
      }));
      
      await db.collection('QRChallenge').insertMany(dummyDocs);
    }

    return NextResponse.json({ success: true, message: `Generated QRs up to 100 total.` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const qrsAggr = await db.collection('QRChallenge').aggregate([
      {
        $lookup: {
          from: 'GameLetter',
          localField: 'letterId',
          foreignField: '_id',
          as: 'letter'
        }
      },
      {
        $unwind: { path: '$letter', preserveNullAndEmptyArrays: true }
      }
    ]).toArray();
    
    return NextResponse.json({
      qrs: qrsAggr.map(qr => ({
        id: qr._id,
        token: qr.publicToken,
        type: qr.type,
        observationPoint: qr.observationPoint,
        letterValue: qr.letter?.letterValue || null
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
