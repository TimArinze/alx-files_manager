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

  static async getShow(req, res) {
    const token = req.get('X-Token');
    const { id } = req.params;
    if (!token) {
      res.status(401);
      res.json({ error: 'Unauthorized' });
      return res;
    }
    const key = `auth_${token}`;
    const userID = await redisClient.get(key);
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ _id: ObjectID(userID) });
    if (!user) {
      res.status(401);
      res.json({ error: 'Unauthorized' });
      return res;
    }
    const file = await dbClient.client.db(dbClient.database).collection('files').findOne({ _id: ObjectID(id) });
    if (!file) {
      res.status(404);
      res.json({ error: 'Not found' });
      return res;
    }
    if (file.userId.toString() !== userID) {
      res.status(404);
      res.json({ error: 'Not found' });
      return res;
    }
    const fileArranged = {
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    };
    res.status(200);
    res.json(fileArranged);
    return res;
  }

  static async getIndex(req, res) {
    const token = req.get('X-Token');
    if (!token) {
      res.status(401);
      res.json({ error: 'Unauthorized' });
      return res;
    }
    const userID = await redisClient.get(`auth_${token}`);
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ _id: ObjectID(userID) });
    if (!user) {
      res.status(401);
      res.json({ error: 'Unauthorized' });
      return res;
    }
    let { parentId } = req.query;
    let { page } = req.query;
    console.log(parentId);
    console.log(page);
    if (!parentId) {
      parentId = 0;
    } else {
      parentId = parentId.toString();
    }
    const perPage = 20;
    if (!page) {
      page = 1;
    }
    const files = await dbClient.client.db(dbClient.database).collection('files')
      .find({ parentId, userId: ObjectID(userID) })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .toArray();

    const filesArranged = [];
    await files.forEach((file) => {
      filesArranged.push({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    });
    res.status(200);
    res.json(filesArranged);
    return res;
  }

  static async putPublish(req, res) {
    const token = req.get('X-token');
    const { id } = req.params
    if (!token) {
      res.status(401);
      res.json("Unauthorized")
      return res
    }
    const userID = await redisClient.get(`auth_${token}`);
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({_id: ObjectID(userID)});
    if (!user) {
      res.status(401);
      res.json('Unauthorized')
      return res
    }
    const collection = await dbClient.client.db(dbClient.database).collection('files');
    const query = { _id: ObjectID(id), userId: ObjectID(userID)};
    const update = { $set: {isPublic: true}};
    const result = await collection.updateOne(query, update)
    console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    const file = await dbClient.client.db(dbClient.database).collection('files').findOne({_id: ObjectID(id)});
    const fileArranged = {
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    };
    res.status(200);
    res.json(fileArranged)
    return res
  }
  static async putUnpublish(req, res) {
    const token = req.get('X-token');
    const { id } = req.params
    if (!token) {
      res.status(401);
      res.json('Unauthorized')
      return res
    }
    const userID = await redisClient.get(`auth_${token}`);
    const user = await dbClient.client.db(dbClient.database).collection('users').findOne({_id: ObjectID(userID)});
    if (!user) {
      res.status(401);
      res.json('Unauthorized')
      return res
    }
    const collection = await dbClient.client.db(dbClient.database).collection('files');
    const query = { _id: ObjectID(id), userId: ObjectID(userID)}
    const update = {$set: {isPublic: false}};
    const result = await collection.updateOne(query, update)
    console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`)
    const file = await dbClient.client.db(dbClient.database).collection('files').findOne({_id: ObjectID(id)});
    const fileArranged = {
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId
    };
    res.status(200);
    res.json(fileArranged)
    return res
  }
}

module.exports = FilesController;
