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
			
			let [variant, uci, san, gameid, score, fen1, fen2, fen3, fen4] = m[1].split(" ")
			
			let key = `${fen1} ${fen2} ${fen3} ${fen4}`
			
			let index = i++

			//console.log("adding", index, "san", san, "score", score, "key", key)
			
			result = await poscoll.findOne({
				variant: variant,
				key: key,
				uci: uci
			})
			
			let doc = {
				variant: variant,
				key: key,
				uci: uci,
				san: san,
				score: parseFloat(score),
				plays: 1,
				gameids: [gameid]
			}
			
			if(!result){
				console.log("inserting", doc)
				
				await poscoll.insertOne(doc)
			}else{
				//console.log("result", index, result)	
				
				if(!result.gameids){
					result.gameids = [gameid]
					
					//console.log("adding gameids")
					
					poscoll.updateOne({variant: variant, key: key, uci: uci}, {$set: doc}, {upsert: true})
				}else{
					if(result.gameids.includes(gameid)){
						//console.log("result", index, "has gameid", "score", result.score)
					}else{
						result.gameids.push(gameid)
						let newScore = (result.score || 0.0) + parseFloat(score)
						result.score = newScore
						result.plays++
						
						console.log("updating score", index, newScore, result.plays)
						
						poscoll.updateOne({variant: variant, key: key, uci: uci}, {$set: result}, {upsert: true})
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

const drop = false
 
MongoClient.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, setClient) {  
	if(err){
		console.log("MongoDb connection failed.")
	}else{
		console.log("MongoDb connected.")
		
		client = setClient
		
		bookdb = client.db("book")
		
		poscoll = bookdb.collection("positions")
		
		if(drop) poscoll.drop()
		
		pytp.stdin.write("start\n")
	}
})

function stream(){
	if(drop) return
	
	console.log("streaming")
	
	//poscoll.find({key: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"}).toArray().then(result => console.log(result)); return
	
	streamNdjson({
		url: `https://lichess.org/api/games/user/${BOT_NAME}?max=250`,
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
