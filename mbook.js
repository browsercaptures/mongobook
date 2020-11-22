const MongoClient = require('mongodb').MongoClient
 
const MONGODB_URI = process.env.MONGODB_URI
 
const dbName = 'games'

const { streamNdjson } = require('./fetchutils.js')

const BOT_NAME = process.env.BOT_NAME || "chesshyperbot"
const BOT_TOKEN = process.env.BOT_TOKEN
 
/*MongoClient.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {  
	if(err){
		console.log("MongoDb connection failed.")
	}else{
		console.log("MongoDb connected.")
		
		const db = client.db(dbName)
 
  		client.close()
	}
})*/

streamNdjson({
	url: `https://lichess.org/api/games/user/${BOT_NAME}?max=10`,
	token: BOT_TOKEN,
	log: true,
	callback: blob => {
		console.log(blob)
	}
})