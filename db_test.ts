import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function test() {
  const client = new MongoClient(process.env.MONGODB_URI as string);
  await client.connect();
  const db = client.db();
  const realSample = await db.collection('QRChallenge').findOne({ type: 'REAL' });
  console.log('Sample REAL Token:', realSample?.publicToken, ' Active:', realSample?.active);
  await client.close();
}
test();
