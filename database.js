
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
const uri = "mongodb+srv://mongo:adminadmin@cluster0.wpkzo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
await client.connect();
const db = client.db("db_test");
const coll = db.collection("notes");
const collUser = db.collection("userInfo");

export async function addNotes(title, contents) {
  const res = await coll.insertOne({
    title: title,
    contents: contents,
    created: new Date(),
  });
  console.log(res);
  return res;
}

export async function getNotes() {
  const cursor = coll.find({}, {
    projection: {
      _id: 0,
      id: { $toString: "$_id" },
      title: 1,
      contents: 1,
      created: 1
    }
  });
  const results = await cursor.toArray();
  console.log(results)
  return results
}
export async function getNote(id) {
  console.log(id);
  const res = await coll.findOne({ _id: new ObjectId(id) }, {
    projection: {
      _id: 0,
      id: { $toString: "$_id" },
      title: 1,
      contents: 1,
      created: 1
    }
  });
  console.log(res)
  return res;
}
export async function updateNote(id, title, contents) {
  const res = await coll.updateOne(
    { _id: new ObjectId(id) },
    { $set: { 'title': title, 'contents': contents } })
  console.log(res);
  return res
}
export async function deleteNote(id) {
  const res = await coll.deleteOne({ _id: new ObjectId(id) });
  console.log(res)
  return res
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    console.log("Connected successfully to server");
    const db = client.db("db_test");
    db.createCollection("userInfo");
    const collection = db.collection("userInfo");
    // await collection.insertOne({ x: 1, y: "string" });
    await collection.insertOne({
      userNumber: 0,
      id: "mhlee",
      password: "qwer1234",
      username: "이명한",
      created: new Date(),
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

async function getNextSequence(name) {
  const db = client.db("db_test");
  const collection = db.collection("counters");
  const sequenceDocument = await collection.findOneAndUpdate(
    { _id: name },
    { $inc: { sequence_value: 1 } },
    { returnNewDocument: true } // 업데이트 후의 값을 반환
  );
  console.log(sequenceDocument.sequence_value);

  return sequenceDocument.sequence_value;
}

export async function registUser(id, password, username) {
  const res = await collUser.insertOne({
    userNumber: await getNextSequence("userId"),  // 고유한 사용자 번호,
    id: id,
    password: password,
    username: username,
    created: new Date(),
  });
  return res;
}

// registUser('karyo', '1234', '이명한2');
