var spawn = require('child_process').spawn
const fs = require('fs')
function createClient(botName, id) {
	process = spawn('node.exe', ["createBot.js",botName, id])
	process.stdout.on('data', function (data) {
		console.log('{' + botName + '} ' + data.toString());
	});

	process.stderr.on('data', function (data) {
		console.log('{' + botName + '} ' + data.toString());
	});

	process.on('exit', function (code) {
		console.log('{' + botName + '} exited with code ' + code.toString());
	});
}
const { botsNames } = JSON.parse(fs.readFileSync("./config.json").toString())
botsNames.forEach((botName, i) => {
	createClient(botName, i)
})

require('./discordRPC.js')()