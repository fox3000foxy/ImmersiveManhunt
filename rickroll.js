var RPC = require("discord-rpc");
var { botsNames } = require('./config.json')
var rpc = new RPC.Client({ transport: "ipc" })
rpc.on("ready", async () => {
	// rpcActive = true
	await rpc.setActivity({
		state: "Never gonna give you up !",
		details: "or rickroll !",
		startTimestamp: new Date(),
		largeImageKey: "rickroll",
		// smallImageText: "VixensStudios",
		// smallImageKey: "icon",
		largeImageText: "Immersive SMP",
		// buttons: [
		// { label: "Me rejoindre", url: "vixapp://app.html?appId="+appId }
		// ]
	})
});
rpc.login({ clientId: "1002531177963462706" }).catch((e) => {
	// rpcActive = false
	// console.log("Discord not found !")
	console.log(e)
});