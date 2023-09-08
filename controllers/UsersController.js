import sha from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.json({ error: 'Missing email' }).status(400);
    }
    if (!password) {
      return res.json({ error: 'Missing password' }).status(400);
    }
    const emailCheck = await dbClient.client.db(dbClient.database).collection('users').findOne({ email });
    if (emailCheck) {
      return res.json({ error: 'Already exist' }).status(400);
    }
    const hashpassword = sha(password);
    await dbClient.client.db(dbClient.database).collection('users').insertOne({ email, password: hashpassword });
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ email });
    return res.json({ email: user.email, id: user._id }).status(201);
  }
}

module.exports = UsersController;
