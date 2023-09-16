import { ObjectID } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.get('X-Token');
    let { isPublic, parentId } = req.body;
    const { data, name, type } = req.body;

    console.log(name, type, data, isPublic, parentId);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userID = await redisClient.get(key);
    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ _id: ObjectID(userID) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type === 'file' || type === 'image') {
      if (!data) {
        return res.status(400).json({ error: 'Missing data' });
      }
    }
    if (parentId === undefined) {
      parentId = 0;
    }
    if (parentId !== 0) {
      const parent = await dbClient.client.db(dbClient.database).collection('files').findOne({ _id: ObjectID(parentId) });
      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (isPublic === undefined) {
      isPublic = false;
    }
    if (type === 'folder') {
      await dbClient.client.db(dbClient.database).collection('files').insertOne({
        userId: ObjectID(userID),
        name,
        type,
        parentId,
        isPublic,
      });
    }
    if (type === 'folder') {
      const newFile = await dbClient.client.db(dbClient.database).collection('files').findOne({ name, userId: ObjectID(userID) });
      res.status(201);
      const newFileArranged = {
        id: newFile._id,
        userId: newFile.userId,
        name: newFile.name,
        type: newFile.type,
        isPublic: newFile.isPublic,
        parentId: newFile.parentId,
      };
      res.json(newFileArranged);
      return res;
    }
    const path = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(path)) {
      // Create the folder if it doesn't exist
      fs.mkdirSync(path, { recursive: true });
    }
    // cd into the folder
    // process.chdir(path);
    const fileName = uuidv4();
    const filePath = `${path}/${fileName}`;
    const buffer = Buffer.from(data, 'base64').toString('utf-8');
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      console.log('The file has been saved!');
      return true;
    });
    await dbClient.client.db(dbClient.database).collection('files').insertOne({
      userId: ObjectID(userID),
      name,
      type,
      isPublic,
      parentId,
      localPath: filePath,
    });
    const newFile = await dbClient.client.db(dbClient.database).collection('files').findOne({ name, userId: ObjectID(userID) });
    const newFileArranged = {
      id: newFile._id,
      userId: newFile.userId,
      name: newFile.name,
      type: newFile.type,
      isPublic: newFile.isPublic,
      parentId: newFile.parentId,
    };
    res.status(201);
    res.json(newFileArranged);
    return res;
  }
}

module.exports = FilesController;
