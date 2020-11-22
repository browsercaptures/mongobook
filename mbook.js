const MongoClient = require('mongodb').MongoClient
 
const MONGODB_URI = process.env.MONGODB_URI
 
const dbName = 'games'
 
MongoClient.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {  
	if(err){
		console.log("MongoDb connection failed.")
	}else{
		console.log("MongoDb connected.")
		
		const db = client.db(dbName)
 
  		client.close()
	}
})
