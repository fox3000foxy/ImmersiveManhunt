const Vec3 = require("vec3")
console.clear()
const mineflayer = require("mineflayer")
const fs = require("fs")
const { botsNames, host, port,huntedName } = JSON.parse(fs.readFileSync("./config.json").toString())
const totalBotsCount = botsNames.length
let Mineflayer_AI = require('./mineflayerAI.js')
function createBot(username) {
	return mineflayer.createBot({
		host,
		username,
		port
	})
}

let bot = createBot(process.argv[2])
let id = process.argv[3]
// console.log(id)
Mineflayer_AI(bot,id)