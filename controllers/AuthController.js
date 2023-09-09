import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.get('Authorization');
    // to remove the Basic and just the encoded number
    const authBasicStripped = auth.split(' ')[1];
    // changing it to buffer of something like this
    // <Buffer 05 ab 22 71 89 bd 89 01 91 e5 b1 85 b8 b9 8d bd b4 e9 d1>
    const authDecoded = Buffer.from(authBasicStripped, 'base64');
    const authToString = authDecoded.toString('utf-8');
    const [email, password] = authToString.split(':');
    const hashedPassword = sha1(password);

    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ email });

    if (user.password !== hashedPassword) {
      return res.json({ error: 'Unauthorized' }).status(401);
    }
    // Generating random token
    const authToken = uuidv4();
    // Storing in redis as key: auth_<token>
    const key = `auth_${authToken}`;
    await redisClient.set(`${key}`, `${user._id.toString()}`, 86400);
    return res.json({ token: authToken }).status(200);
  }

  static async getDisconnect(req, res) {
    const token = req.get('X-token');
    const key = `auth_${token}`;
    const userID = await redisClient.get(key);
    if (!userID) {
      return res.json({ error: 'Unauthorized' }).status(401);
    }
    await redisClient.del(key);
    return res.status(204).json('');
  }
}

module.exports = AuthController;
