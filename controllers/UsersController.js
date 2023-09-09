import sha from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400);
      res.json({ error: 'Missing email' });
      return res;
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const emailCheck = await dbClient.client.db(dbClient.database).collection('users').findOne({ email });
    if (emailCheck) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const hashpassword = sha(password);
    await dbClient.client.db(dbClient.database).collection('users').insertOne({ email, password: hashpassword });
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ email });
    res.status(201);
    return res.json({ id: user._id.toString(), email: user.email });
  }

  static async getMe(req, res) {
    const token = req.get('X-Token');
    const key = `auth_${token}`;
    const userID = await redisClient.get(key);
    if (!token || !userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const _id = new ObjectId(userID);
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ _id });
    res.status(200);
    return res.json({ email: user.email, id: user._id.toString() });
  }
}

module.exports = UsersController;
