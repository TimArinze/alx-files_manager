import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    const redis = await redisClient.isAlive();
    const db = await dbClient.isAlive();
    const status = {
      redis,
      db,
    };
    return res.json(status).status(200);
  }

  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    const status = {
      users,
      files,
    };
    res.json(status);
    res.status(200);
  }
}

module.exports = AppController;
