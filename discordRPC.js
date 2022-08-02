module.exports = ()=>{
	var RPC = require("discord-rpc");
	var { botsNames,huntedName } = require('./config.json')
	var rpc = new RPC.Client({ transport: "ipc" })
	rpc.on("ready", async () => {
		await rpc.setActivity({
			state: "Je suis "+huntedName,
			details: "depuis Minecraft",
			startTimestamp: new Date(),
			largeImageKey: "icon",
			largeImageText: "Contre " + botsNames.join(", "),
		})
	});
	rpc.login({ clientId: "1002531177963462706" }).catch((e) => {
		console.log("Discord error:",e)
	});
}