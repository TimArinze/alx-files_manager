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
    const emailcheck = await dbClient.findEmail(email);
    console.log(emailcheck);
    if (emailcheck === true) {
      return res.json({ error: 'Already exist' }).status(400);
    }
    const hashpassword = sha(password);
    const user = await dbClient.putNewUser({ email, password: hashpassword });
    return res.json(user).status(201);
  }
}

module.exports = UsersController;
