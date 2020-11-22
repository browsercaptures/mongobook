const { spawn } = require('child_process')

const pytp = spawn("bash", ["python.sh", "test.py"])

const fs = require('fs')

const MongoClient = require('mongodb').MongoClient
 
const MONGODB_URI = process.env.MONGODB_URI
 
const dbName = 'games'

const { streamNdjson } = require('./fetchutils.js')

const BOT_NAME = process.env.BOT_NAME || "chesshyperbot"
const BOT_TOKEN = process.env.BOT_TOKEN

const BOOK_DEPTH = parseInt(process.env.BOOK_DEPTH || "5")
 
/*MongoClient.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {  
	if(err){
		console.log("MongoDb connection failed.")
	}else{
		console.log("MongoDb connected.")
		
		const db = client.db(dbName)
 
  		client.close()
	}
})*/

function stream(){
	console.log("streaming")
	
	streamNdjson({
		url: `https://lichess.org/api/games/user/${BOT_NAME}?max=10`,
		token: BOT_TOKEN,
		callback: game => {
			console.log(`processing game ${game.id}`)

			pytp.stdin.write(JSON.stringify(game) + "\n")
		},
		endcallback:_ => {
			console.log("end")
			
			pytp.stdin.write("end\n")
		}
	})
}

pytp.stdin.write("start\n")

pytp.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

pytp.stdout.on("data", data => {	
	let line = data.toString().replace(/\s+$/, "")
	
	console.log(line)
	
	if(line == "started"){
		console.log("started")
		
		stream()
	}
})

pytp.on("close", _ => console.log("done"))