import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();

  const participant = await db.collection('Participant').findOne(
    { _id: new ObjectId(session.participantId as string) },
    { projection: { _id: 0, publicId: 1, name: 1, createdAt: 1 } }
  );

  if (!participant) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, participant });
}
