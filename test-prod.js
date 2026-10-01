const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://mummanarakesh_db_user:mCvbpyfD9RWQ1qkq@cluster0.bpbc86l.mongodb.net/quantum-hunt-prod?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db();
    const res = await db.collection('Participant').insertOne({ name: 'TestUser', publicId: 'QH-000000', createdAt: new Date() });
    console.log("Inserted test participant", res.insertedId);
  } catch (err) {
    console.dir(err);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
