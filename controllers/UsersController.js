import sha from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.json({ 'error': 'Missing email' }).status(400);
    }
    if (!password) {
      return res.json({ 'error': 'Missing password' }).status(400);
    }
    const emailCheck = await dbClient.client.db(dbClient.database).collection('users').findOne({ email });
    if (emailCheck) {
      return res.json({ 'error': 'Already exist' }).status(400);
    }
    const hashpassword = sha(password);
    await dbClient.client.db(dbClient.database).collection('users').insertOne({ email, password: hashpassword });
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ email });
    return res.json({ 'id': user._id.toString(), 'email': user.email }).status(201);
  }

  static async getMe(req, res) {
    const token = req.get('X-Token');
    const key = `auth_${token}`;
    const userID = await redisClient.get(key);
    if (!token || !userID) {
      return res.json({ 'error': 'Unauthorized' }).status(401);
    }
    const _id = new ObjectId(userID);
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ _id });
    return res.json({ 'email': user.email, 'id': user._id.toString() });
  }
}

module.exports = UsersController;
