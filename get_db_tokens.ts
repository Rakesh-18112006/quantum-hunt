import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function test() {
  const client = new MongoClient(process.env.MONGODB_URI as string);
  await client.connect();
  const db = client.db();
  const qrs = await db.collection('QRChallenge').find({}).limit(5).toArray();
  console.log(qrs.map(q => q.publicToken).join('\n'));
  await client.close();
}
test();
