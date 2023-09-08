const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    this.host = (process.env.DB_HOST) ? process.env.DB_HOST : 'localhost';
    this.port = (process.env.DB_PORT) ? process.env.DB_PORT : 27017;
    this.database = (process.env.DB_DATABASE) ? process.env.DB_DATABASE : 'files_manager';
    this.url = `mongodb://${this.host}:${this.port}`;
    this.connected = false;
    this.client = new MongoClient(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect().then(() => {
      this.connected = true;
    }).catch((err) => console.log(err.message));
    this.collection = this.client.db(this.database).collection('users');
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    const db = this.client.db(this.database);
    const collection = db.collection('users');
    const count = await collection.countDocuments();
    return count;
  }

  async nbFiles() {
    const db = this.client.db(this.database);
    const collection = db.collection('files');
    const count = await collection.countDocuments();
    return count;
  }

  async findEmail(email) {
    const db = this.client.db(this.database);
    const collection = db.collection('users');
    const emailExist = await collection.findOne({ email });
    console.log(emailExist);
    if (emailExist) return true;
    return false;
  }

  async putNewUser(user) {
    const db = this.client.db(this.database);
    const collection = db.collection('users');
    await collection.insertOne(user);
    const newUser = await collection.findOne({ email: user.email });
    return { email: user.email, id: newUser._id };
  }
}
const dbClient = new DBClient();
export default dbClient;
