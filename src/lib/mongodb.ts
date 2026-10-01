import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Helper to reliably get the correct database, even if URI is missing the DB name
export async function getDb() {
  const connectedClient = await clientPromise;
  // If the user forgot to put the DB name in the URI (e.g. ends with .net/?appName...), 
  // it defaults to 'test'. We force it to 'quantum-hunt-prod' in production.
  const isProd = uri.includes('cluster0');
  const dbName = isProd ? 'quantum-hunt-prod' : 'quantum-hunt';
  return connectedClient.db(dbName);
}

export default clientPromise;
