import dbClient from "../utils/db";
import redisClient from "../utils/redis";
import { ObjectID } from "mongodb"


class FilesController {
    static async postUpload(req, res) {
        const token = req.get('X-Token')
        let { name, type, data, isPublic, parentId } = req.body
        console.log(name, type, data, isPublic, parentId)
        if (!token) {
            return res.status(401).json({error: "Unauthorized"})
        }
        const key = `auth_${token}`
        const userID = await redisClient.get(key)
        if (!userID) {
            return res.status(401).json({error: "Unauthorized"})
        }
        const user = await dbClient.client.db(dbClient.database).collection('users').findOne({_id: ObjectID(userID)})
        if (!user) {
            return res.status(401).json({error: "Unauthorized"})
        }
        if (!name) {
            return res.status(400).json({error: "Missing name"})
        }
        if (!type) {
            return res.status(400).json({error: "Missing type"})
        }
        if (type === "file" || type === "image") {
            if (!data) {
                return res.status(400).json({error: "Missing data"})
            }
        }
        if (parentId === undefined) {
            parentId = 0
        }
        if (parentId !== 0) {
            const parent = await dbClient.client.db(dbClient.database).collection('files').findOne({_id: ObjectID(parentId)})
            if (!parent) {
                return res.status(400).json({error: "Parent not found"})
            }
            if (parent.type !== "folder") {
                return res.status(400).json({error: "Parent is not a folder"})
            }
        }
        if (isPublic === undefined) {
            isPublic = false 
        }
        if (type === "file" || type === "image") {
            await dbClient.client.db(dbClient.database).collection('files').insertOne({
                userId: userID,
                name: name,
                type: type,
                parentId: parentId,
                isPublic: isPublic,
                data: data
            })
            const newFile = await dbClient.client.db(dbClient.database).collection('files').findOne({userId: ObjectID(userID)})
            console.log(newFile)
            return res.status(201).json(newFile)
        } else {
            await dbClient.client.db(dbClient.database).collection('files').insertOne({
                userId: userID,
                name: name,
                type: type,
                parentId: parentId,
                isPublic: isPublic,
            })
            const newFile = await dbClient.client.db(dbClient.database).collection('files').findOne({userId: ObjectID(userID)})
            return res.status(201).json(newFile)
        }
    }
}


module.exports = FilesController;
