import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const LOCAL_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum-hunt';
const PROD_URI = 'mongodb+srv://mummanarakesh_db_user:mCvbpyfD9RWQ1qkq@cluster0.bpbc86l.mongodb.net/quantum-hunt-prod?retryWrites=true&w=majority&appName=Cluster0';

async function copyData() {
  const localClient = new MongoClient(LOCAL_URI);
  const prodClient = new MongoClient(PROD_URI);

  try {
    console.log('Connecting to Local DB...');
    await localClient.connect();
    const localDb = localClient.db();

    console.log('Connecting to Prod DB...');
    await prodClient.connect();
    const prodDb = prodClient.db();

    // The collections we need to copy exactly
    const collectionsToCopy = ['GameWord', 'GameLetter', 'QRChallenge'];

    for (const colName of collectionsToCopy) {
      console.log(`\n--- Processing Collection: ${colName} ---`);
      
      // 1. Fetch all documents from local
      const docs = await localDb.collection(colName).find({}).toArray();
      console.log(`Found ${docs.length} documents in local DB.`);

      if (docs.length === 0) {
        console.log('Nothing to copy. Skipping.');
        continue;
      }

      // 2. Clear prod collection to ensure clean state
      console.log(`Clearing collection '${colName}' in prod DB...`);
      await prodDb.collection(colName).deleteMany({});

      // 3. Insert into prod
      console.log(`Inserting ${docs.length} documents into prod DB...`);
      await prodDb.collection(colName).insertMany(docs);
      
      console.log(`✅ Successfully copied ${colName}`);
    }

    console.log('\n🎉 ALL GAME DATA SUCCESSFULLY COPIED TO PRODUCTION DB!');
    console.log('Your local DB remains untouched and is your source of truth.');

  } catch (error) {
    console.error('Error during data copy:', error);
  } finally {
    await localClient.close();
    await prodClient.close();
  }
}

copyData();
