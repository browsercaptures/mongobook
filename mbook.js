const MongoClient = require('mongodb').MongoClient
 
const MONGODB_URI = process.env.MONGODB_URI
 
const dbName = 'games'

const { streamNdjson } = require('./fetchutils.js')

const { Game } = require('./scsync.js')

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

streamNdjson({
	url: `https://lichess.org/api/games/user/${BOT_NAME}?max=2`,
	token: BOT_TOKEN,
	callback: game => {
		console.log(`processing game ${game.id}`)
		
		let g = Game(game.variant, undefined, game.id)				
		
		if(g){
			let result = 0.5
			
			if(game.winner) result = game.winner == "white" ? 1 : 0
			
			if(game.moves){
				let moves = game.moves.split(" ")
				
				if(moves.length > BOOK_DEPTH) moves = moves.slice(0, BOOK_DEPTH)
				
				for(const move of moves){
					let fen = g.fen()
					
					let ok = g.makeSanMove(move)
					
					if(ok){
						console.log(fen, "->", move, result)	
					}else{
						break	
					}					
				}
			}else{
				console.log(`no moves for game`)
			}
		}else{
			console.log(`could not create game from`, game)
		}
	}
})
