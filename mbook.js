let client

let bookdb

let poscoll

const { spawn } = require('child_process')

const pytp = spawn("bash", ["python.sh", "test.py"])

pytp.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`)
})

let result

let i = 0

async function processData(data){
	let line = data.toString().replace(/\s+$/, "")
	
	let m
	
	if(line == "started"){
		stream()
	}else{
		if(m = line.match(/^bookmove (.*)/)){						
			
			let [san, gameid, score, fen1, fen2, fen3, fen4] = m[1].split(" ")
			
			let key = `${fen1} ${fen2} ${fen3} ${fen4}`
			
			let index = i++

			console.log("adding", index, san, result, "key", key)
			
			result = await poscoll.findOne({
				key: key,
				san: san
			})
			
			let doc = {
					key: key,
					san: san,
					score: score,
					gameids: [gameid]
				}
			
			if(!result){
				console.log("inserting", doc)
				
				await poscoll.insertOne(doc)
			}else{
				//console.log("result", index, result)	
				
				if(!result.gameids){
					result.gameids = [gameid]
					
					console.log("adding gameids")
					
					poscoll.updateOne({key: key, san: san}, {$set: doc}, {upsert: true})
				}else{
					if(result.gameids.includes(gameid)){
						console.log("result", index, "has gameid")
					}else{
						result.gameids.push(gameid)
						result.score = (result.score || 0) + score
						
						console.log("updating score")
						
						poscoll.updateOne({key: key, san: san}, {$set: doc}, {upsert: true})
					}
				}
			}
		}
	}
}

pytp.stdout.on("data", data => {	
	let lines = data.toString().split("\n")
	
	for(let line of lines) processData(line)
})

pytp.on("close", _ => console.log("done"))

const fs = require('fs')

const MongoClient = require('mongodb').MongoClient
 
const MONGODB_URI = process.env.MONGODB_URI
 
const dbName = 'games'

const { streamNdjson } = require('./fetchutils.js')

const BOT_NAME = process.env.BOT_NAME || "chesshyperbot"
const BOT_TOKEN = process.env.BOT_TOKEN

const BOOK_DEPTH = parseInt(process.env.BOOK_DEPTH || "5")
 
MongoClient.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, setClient) {  
	if(err){
		console.log("MongoDb connection failed.")
	}else{
		console.log("MongoDb connected.")
		
		client = setClient
		
		bookdb = client.db("book")
		
		poscoll = bookdb.collection("positions")
		
		pytp.stdin.write("start\n")
	}
})

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
			//console.log("end")
			
			//pytp.stdin.write("end\n")
			
			//client.close()
		}
	})
}
