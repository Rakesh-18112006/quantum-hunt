import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function test() {
  const client = new MongoClient(process.env.MONGODB_URI as string);
  await client.connect();
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
  ]).limit(1).toArray();
  console.log(JSON.stringify(qrsAggr, null, 2));
  await client.close();
}
test();
