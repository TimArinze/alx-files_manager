const { MongoClient } = require('mongodb')
 
class DBClient {
    constructor() {
        if (process.env.DB_HOST) {
            this.host = DB_HOST
        } else {
            this.host = 'localhost'
        }
        if (process.env.DB_PORT) {
            this.port = DB_PORT
        } else {
            this.port = 27017
        }
        if (process.env.DB_DATABASE) {
            this.database = DB_DATABASE
        } else {
            this.database = 'files_manager'
        }
        this.client = MongoClient(`mongodb://${this.host}:${this.port}/${this.database}`, { useUnifiedTopology: true })
        }

        isAlive() {
            this.client.connect()
            .then(() => {
                return true
            })
            .catch(() => {
                return false
            })
        }

        async nbUsers() {
            try {
                await this.client.connect()
                const count = await this.client
                    .db(this.database)
                    .collection('users')
                    .countDocuments()
                return count
            } catch (err) {
                return console.log(err)
            } finally {
                await this.client.close()
            }
        }

        async nbFiles() {
            try {
                await this.client.connect()
                const count = await this.client
                    .db(this.database)
                    .collection('files')
                    .countDocuments()
                return count
            } catch (err) {
                return console.log(err)
            } finally {
                await this.client.close()
            }
        }
}

const dbClient = new DBClient()
export default dbClient
