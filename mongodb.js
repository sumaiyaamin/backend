import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = "mongodb+srv://cambridge_admin:PbT6ZP1Eezee8IIZ@cluster0.osfm1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    return client.db("cambridgeClone");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export { client };
