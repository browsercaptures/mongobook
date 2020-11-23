const { makeSanMovesScala } = require('@easychessanimations/scalachess/lib/outopt.js')

let client

let bookdb

let poscoll

const { spawn } = require('child_process')

let result

let i = 0

const fs = require('fs')

const MongoClient = require('mongodb').MongoClient
 
const MONGODB_URI = process.env.MONGODB_URI
 
const dbName = 'games'

const { streamNdjson } = require('./fetchutils.js')

const BOT_NAME = process.env.BOT_NAME || "chesshyperbot"
const BOT_TOKEN = process.env.BOT_TOKEN

const BOOK_DEPTH = parseInt(process.env.BOOK_DEPTH || "40")

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
		
		stream()
	}
})

function processGameThen(game){
	return new Promise(resolve => processGame(game, resolve))
}

async function processGame(game, resolve){	
	console.log(`processing game ${game.id}`)

	if(game.moves){				
		let moves = game.moves.split(" ")
		if(moves.length > BOOK_DEPTH) moves = moves.slice(0, BOOK_DEPTH)
		
		let [ucis, fens] = makeSanMovesScala(game.variant, game.initialFen, moves)
		
		let variant = game.variant
		
		let gameid = game.id
		
		let score = 0.5
		
		if(game.winner){
			score = game.winner == "white" ? 1 : 0
		}
		
		if(game.players.black.user.name == BOT_NAME){			
			score = 1 - score
		}
		
		for(let j = 1; j < fens.length; j++){
			let san = moves[j-1]
			let uci = ucis[j]
			let fen = fens[j-1]
			let key = fen.split(" ").slice(0, 4).join(" ")
			
			let index = i++

			console.log(index, san, uci, key)

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
				score: score,
				plays: 1,
				gameids: [gameid]
			}

			if(!result){
				console.log("inserting", doc)

				await poscoll.insertOne(doc)
				
				resolve(true)
				
				return
			}else{
				//console.log("result", index, result)	

				if(!result.gameids){
					result.gameids = [gameid]

					console.log("adding gameids")

					poscoll.updateOne({variant: variant, key: key, uci: uci}, {$set: doc}, {upsert: true})
					
					resolve(true)
					
					return
				}else{
					if(result.gameids.includes(gameid)){
						console.log("has gameid")
					}else{
						result.gameids.push(gameid)
						let newScore = (result.score || 0.0) + score
						result.score = newScore
						result.plays++

						console.log("updating score", index, newScore, result.plays)

						poscoll.updateOne({variant: variant, key: key, uci: uci}, {$set: result}, {upsert: true})
						
						resolve(true)
						
						return
					}
				}
			}
		}
	}else{
		console.log(`game ${game.id} has no moves`)
	}
	
	resolve(false)
}

let allgames = []

async function processGames(games){
	for(let game of games){				
		await processGameThen(game)
	}
	
	client.close()
}

function stream(){
	if(drop){		
		return
	}
	
	console.log("streaming")
	
	//poscoll.find({key: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"}).toArray().then(result => console.log(result)); return
	
	streamNdjson({
		url: `https://lichess.org/api/games/user/${BOT_NAME}?max=2500`,
		token: BOT_TOKEN,
		callback: game => {
			console.log(`adding game ${game.id}`)

			allgames.push(game)
		},
		endcallback:_ => {
			console.log("received games")
			
			processGames(allgames)
			
			//client.close()
		}
	})
}
