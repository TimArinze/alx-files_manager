import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.get('Authorization');

    // to remove the Basic and just the encoded number
    const authBasicStripped = auth.split(' ')[1];

    if (auth.split(' ')[0] !== Basic) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    // changing it to buffer of something like this
    // <Buffer 05 ab 22 71 89 bd 89 01 91 e5 b1 85 b8 b9 8d bd b4 e9 d1>
    const authDecoded = Buffer.from(authBasicStripped, 'base64');
    const authToString = authDecoded.toString('utf-8');
    const [email, password] = authToString.split(':');
    const hashedPassword = sha1(password);

    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ email });

    if (!user || user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Generating random token
    const authToken = uuidv4();
    // Storing in redis as key: auth_<token>
    const key = `auth_${authToken}`;
    await redisClient.set(`${key}`, `${user._id.toString()}`, 86400);
    return res.status(200).json({ token: authToken });
  }

  static async getDisconnect(req, res) {
    const token = req.get('X-token');
    const key = `auth_${token}`;
    const userID = await redisClient.get(key);
    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(key);
    return res.status(204).json('');
  }
}

module.exports = AuthController;
