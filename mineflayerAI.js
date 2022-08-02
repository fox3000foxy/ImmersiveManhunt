//Constants
const { faces, foodItems, stuffPriority, stuffPriorityTools, materialPriority } = require('./constants.js')
const { huntedName, stuffing, autoStart, botsNames, ostId } = require("./config.json")
const alternativeCraft = require("./alternativeCraft.js")
// Create your bot
const mineflayer = require("mineflayer")
const fs = require("fs")
const { GoalNear, GoalFollow, GoalBlock } = require('mineflayer-pathfinder').goals
let attackingEntity = []
let interruptFarm = false
let waitBeforeAnotherAttack = {}
let farmInstance = {}
let insultCooldown = 0
let newFarming = false
const Vec3 = require('vec3')
function addClaims(username, claimedBlocks) {
	console.log("[Claimer] Claiming as '" + username + "':", claimedBlocks.length, "blocks")
	let claims = JSON.parse(fs.readFileSync("claims.data").toString())
	claims[username] = []
	claimedBlocks.forEach(block => { claims[username].push(block.position) })
	fs.writeFileSync("claims.data", JSON.stringify(claims, null, 2))
}

function removeClaims(username) {
	let claims = JSON.parse(fs.readFileSync("claims.data").toString())
	delete claims[username]
	fs.writeFileSync("claims.data", JSON.stringify(claims, null, 2))
}

function getClaims() {
	let claims = JSON.parse(fs.readFileSync("claims.data").toString())
	return claims
}
const totalBotsCount = botsNames.length

module.exports = function (bot, id) {
	// console.log(this)
	let playing = false
	let started = false;
	bot.once('spawn', async function () {
		let actualPosX = bot.players[huntedName].entity.position.x
		bot.chat("/stopsound " + huntedName + " * immersivesmp:ost1")
		bot.chat("/stopsound " + huntedName + " * immersivesmp:ost2")
		bot.on('physicTick', async function () {
			if (id == 0) {
				if (!playing && bot.players[huntedName].entity) {
					let coords = bot.players[huntedName].entity.position
					if (bot.players[huntedName].entity && actualPosX != coords.x && !playing) {
						let coords = bot.players[huntedName].entity
						huntedPosition = coords.x + " " +
							coords.y + " " +
							coords.z + " "
						bot.chat("/execute at " + huntedName + " run playsound immersivesmp:ost" + ostId + " master " + huntedName + " ~ ~ ~ .1")
						setInterval(() => {
							bot.chat("/execute at " + huntedName + " run playsound immersivesmp:ost" + ostId + " master " + huntedName + " ~ ~ ~ .1")
						}, ostId == 1 ? 190503 : ostId == 2 ? 319126 : 0)
						playing = true
					}
				}
				if (!started) {
					let coords = bot.players[huntedName].entity.position
					if (bot.players[huntedName].entity && actualPosX != (coords.x) && !started) {
						this.farm()
						started = true
					}
				}
				else if (bot.players[huntedName].entity) bot.lookAt(coords.offset(0, 1.75, 0), true)
			}
		})
	})
	this.joke = function () {
		setTimeout(() => {
			if (!started) return;
			bot.soundManager.playSound("sk", "joke")
			this.joke()
		}, Math.round((Math.random() * 60)) * 1000)
	}
	bot.setMaxListeners(240)
	let mcData, items, blocks;
	//All events
	bot.is_ready_to_fight = false
	bot.on('windowOpen', (window) => { bot.window = window })
	bot.on("health", async () => {
		const player = bot.players[huntedName]
		if ((bot.health >= 8) && bot.is_ready_to_fight && attackingEntity.length == 0 && !newFarming) bot.pvp.attack(player.entity)
		else if (bot.pvp.target && bot.pvp.target.type == "player") bot.pvp.stop()
		if (bot.food <= 14 || bot.health <= 8) {
			let myFoods = bot.inventory.items().filter(food => foodItems.includes(food.name))
			if (myFoods.length) { await bot.autoEat.eat() }
			else { this.getFoodByKills(async () => { await bot.autoEat.eat() }) }
		}
		if (bot.health <= 1 && bot.health != 0) bot.soundManager.playSound("sk", "pity")
		if (bot.health == 0) {
			bot.soundManager.playSound("sk", "death")
			insultCooldown = 0
			this.farm()
		}
	})
	bot.on('entityHurt', (e) => {
		if (e == bot.entity) {
			if (!insultCooldown) {
				insultCooldown = 30 * 20
				bot.soundManager.playSound("sk", "insult")
			}
		}
	})
	bot.on("entityDead", (entity) => {
		if (entity == bot.players[huntedName].entity)
			bot.soundManager.playSound("bbh", "kill")
	})
	bot.on('chat', (p, m) => {
		if (m.startsWith("start") && !autoStart) {
			console.log("Start to farm")
			this.farm()
		}
	})

	this.getFoodByKills = function (cb) {
		passiveMobs = ['cow', 'sheep', 'chicken', 'pig']
		let animal = bot.nearestEntity(entity => passiveMobs.includes(entity.name))
		bot.pvp.attack(animal)
		bot.once('entityDead', (entity) => {
			if (passiveMobs.includes(entity.name)) {
				bot.pathfinder.setGoal(new GoalBlock(
					entity.position.x,
					entity.position.y,
					entity.position.z,
				))
				bot.once('goal_reached', cb)
			}
		})
	}
	//Load external plugins
	this.pluginLoader = function (bot) {
		console.log("[Plugin Manager] Loading external plugins...")
		bot.loadPlugin(require('mineflayer-pathfinder').pathfinder)
		bot.loadPlugin(require('mineflayer-collectblock').plugin)
		bot.loadPlugin(require("mineflayer-auto-eat"))
		bot.loadPlugin(require('mineflayer-armor-manager'))
		bot.loadPlugin(require('mineflayer-pvp').plugin)
		// require('mineflayer-bloodhound')(mineflayer)(bot);
		bot.once('spawn', () => {
			bot.soundManager = require('./soundsManager.js')(bot, huntedName)
			bot.pvp.attackRange = 2.5
			bot.pvp.viewDistance = 10000
			// bot.bloodhound.yaw_correlation_enabled = true;
			removeClaims(bot.username)
			console.log("[Plugin Manager] Spawned !")
			mcData = require('minecraft-data')(bot.version)
			bot.mcData = mcData
			items = mcData.itemsByName
			blocks = mcData.blocksByName
			bot.chat("/gamerule sendCommandFeedback false")
			bot.on('physicTick', async () => {
				Object.keys(waitBeforeAnotherAttack).forEach(uuid => {
					waitBeforeAnotherAttack[uuid]--
					if (!waitBeforeAnotherAttack[uuid])
						delete waitBeforeAnotherAttack[uuid]
				})
				if (insultCooldown) { insultCooldown-- }

				let entity = null
				// Do not attack mobs if the bot is to far from the guard pos
				// Only look for mobs within 16 blocks
				const filter = e => (e.type === 'mob' || e.type === 'player') && e.position.distanceTo(bot.entity.position) < 16 &&
					e.mobType !== 'Armor Stand' // Mojang classifies armor stands as mobs for some reason?
				entity = bot.nearestEntity(filter)
				if (entity) {
					if (entity.heldItem && entity.heldItem.name == "bow") {
						interruptFarm = true
						bot.pvp.attack(entity)

					}
					else if (
						(entity.type != "player" && bot.entity.position.distanceTo(entity.position) < 3) ||
						(entity.type == "player" && bot.entity.position.distanceTo(entity.position) < 3)
					) {
						if (entity.type == "player" && entity.username != huntedName) return
						else {
							if (!waitBeforeAnotherAttack[entity.uuid]) {
								waitBeforeAnotherAttack[entity.uuid] = 5
								const Vec3 = require("vec3")
								bot.lookAt(new Vec3(
									entity.position.x,
									entity.position.y,
									entity.position.z
								).offset(0, 1.55, 0), true)
								try {
									bot.attack(entity)
								} catch (e) { console.log("Attack error:", e) }
							}
						}
					}
					else {
						if (bot.is_ready_to_fight && !newFarming) { bot.pvp.attack(bot.players[huntedName].entity) }
						else if (interruptFarm) { interruptFarm = false }
					}
				}
			})

		})
	}
	this.pluginLoader(bot)
	this.hasItem = function (name, count = 1) {
		let items = bot.inventory.slots.filter(item => (item != null && item.name.endsWith(name)))
		let finalCount = 0
		items.forEach((item) => { finalCount += item.count })
		return { result: finalCount >= count, count: count, finalCount: finalCount, pending: count - finalCount }
	}

	this.findBlock = function (name, needed, count) {
		let matching = []
		let posArray = []
		Object.keys(blocks).sort().forEach(blockName => { if (blockName.endsWith(name) || blockName == name) matching.push(blocks[blockName].id) })
		let alreadyClaimed = []
		let claims = getClaims()
		Object.keys(claims).forEach(user => {
			console.log(user)
			claims[user].forEach(claim => {
				alreadyClaimed.push(claim)
			})
		})
		let findedBlocks = bot.findBlocks({
			matching,
			maxDistance: 128,
			count: count * totalBotsCount
		})

		findedBlocks = findedBlocks.filter(block => {
			let alreadyClaimedBool = false
			alreadyClaimed.forEach(claimPos => {
				if (
					block.x == claimPos.x &&
					block.y == claimPos.y &&
					block.z == claimPos.z
				) {
					alreadyClaimedBool = true
					console.log("[Claimer] The block at", block, "is already claimed. Removing from my list...")
				}
			})
			return !alreadyClaimedBool
		})

		findedBlocks = findedBlocks.slice(0, needed)
		findedBlocks.forEach(coords => {
			posArray.push(bot.blockAt(coords))
		})
		return posArray
	}
	this.craftPlanks = async function (count = 1) {
		if (hasItem("oak_log").result) { await alternativeCraft(bot, "oak_planks", count) }
		else if (hasItem("spruce_log").result) { await alternativeCraft(bot, "spruce_planks", count) }
		else if (hasItem("birch_log").result) { await alternativeCraft(bot, "birch_planks", count) }
		else if (hasItem("jungle_log").result) { await alternativeCraft(bot, "jungle_planks", count) }
		else if (hasItem("acacia_log").result) { await alternativeCraft(bot, "acacia_planks", count) }
		else if (hasItem("dark_oak_log").result) { await alternativeCraft(bot, "dark_oak_planks", count) }
		return
	}
	this.farmStuff = async function (options, name, minimum = 1, craft = false) {
		if (bot.is_ready_to_fight) return;
		let hasI = hasItem(name, minimum)
		if (!hasI.result) {
			console.log("[Farm Manager] " + (craft ? "Crafting" : "Mining"), hasI.pending, name)
			if (craft)
				await alternativeCraft(bot, name, hasI.pending, false)
			else {
				try {
					let blocks = this.findBlock(name, hasI.pending, minimum)
					addClaims(bot.username, blocks)
					for (block of blocks) {
						if (options.farmInstance.dead == true) { console.log("Dead, shut off this farm session..."); return; }
						await bot.pathfinder.goto(new GoalBlock(
							block.position.x,
							block.position.y,
							block.position.z,
						), 1).catch(async e => {
							console.log("Cant collect", block.name, "... Trying hard method...")
							await bot.collectBlock.collect(block)
						})
					}
				}
				catch (e) {
					console.log("[Farm Manager] Pathfinder Error. Retrying... (", e, ")")
					await this.farmStuff(options, name, minimum)
				}
			}
			console.log("[Farm Manager] " + (craft ? "Crafted" : "Mined"), hasI.pending, name)
		}
		else console.log("[Farm Manager] Already " + (craft ? "crafted" : "mined"), minimum, name)
		removeClaims(bot.username)

	}
	// Mineflayer_AI(bot)
	this.sleep = async function (ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
	this.farm = async function () {
		let coords = await getHuntedCoords()
		console.log("Hunted coords:", coords)
		console.log("[Farm Manager] Starting a farming session")
		let farmId = new Date().getTime()
		farmInstance[farmId] = {};
		farmInstance[farmId].dead = false;
		let options = { farmInstance }
		setTimeout(async () => {
			let craft = 1
			if (!bot.is_ready_to_fight) {
				if (!hasItem("iron_helmet", 1).result) {
					await this.farmStuff(options, "oak_log", 5); await this.sleep(500)
					if (!hasItem("oak_planks", 6 * 4).result) { await this.farmStuff(options, "oak_planks", 6, craft); console.log("Crafted 6 planks"); await sleep(500); }
					let craftingBlock = bot.findBlock({
						matching: blocks["crafting_table"].id,
						maxDistance: 64
					})
					if (!craftingBlock) { await this.farmStuff(options, "crafting_table", 1, craft); await sleep(500) }
					await this.farmStuff(options, "stick", 4, craft); await sleep(500)
					await this.farmStuff(options, "wooden_pickaxe", 1, craft); await sleep(500)
					if (!hasItem("cobblestone", 6).result) await this.farmStuff(options, "stone", hasItem("cobblestone", 6).count); await sleep(500)
					await this.farmStuff(options, "stone_pickaxe", 2, craft); await sleep(500)
					if (!hasItem("coal", 5).result) await this.farmStuff(options, "coal_ore", hasItem("coal", 5).pending); await sleep(500)
					await this.farmStuff(options, "iron_ore", 29); await sleep(500)
					await this.farmStuff(options, "golden_ore", 4); await sleep(500)
					if (!hasItem("cobblestone", 12).result) await this.farmStuff(options, "stone", hasItem("cobblestone", 12).count); await sleep(500)
					await this.farmStuff(options, "furnace", 1, craft); await (500)
					if (hasItem("furnace")) {
						await bot.equip(items["furnace"]);
						await sleep(500)
						await bot.look(0, -0.25, true)
						let supportBlock = bot.blockAtCursor(maxDistance = 256)
						let p = supportBlock.position
						bot.chat("/clear @p furnace 1")
						bot.chat("/clear @p coal 5")
						bot.chat("/clear @p iron_ore 29")
						bot.chat("/clear @p golden_ore 4")
						await bot.look(0, -0.25, true)
						bot.chat("/setblock " + p.x + " " + p.y + " " + p.z + " furnace[lit=true,facing=south]");
						// await sleep(5000) //330000 normallay
						let furnaceBlock = bot.blockAtCursor(maxDistance = 256)
						await bot.dig(furnaceBlock);
						stuffPriority.forEach(async (item) => {
							await bot.chat("/give @p iron_" + item)
						})
						await bot.look(0, 0, true)
						bot.chat("/replaceitem entity @p armor.head minecraft:iron_helmet"); await sleep(500)
						bot.chat("/replaceitem entity @p armor.chest minecraft:iron_chestplate"); await sleep(500)
						bot.chat("/replaceitem entity @p armor.legs minecraft:iron_leggings"); await sleep(500)
						bot.chat("/replaceitem entity @p armor.feet minecraft:golden_boots"); await sleep(500)
					}
				}
			} else {
				console.log(hasItem("iron_helmet"))
				if (!hasItem("iron_helmet").result) {
					bot.pvp.stop()
					newFarming = true
					await sleep(30000)
					stuffPriority.forEach(async (item) => {
						if (!hasItem("iron_" + item, 1).result)
							await bot.chat("/give @p iron_" + item)
					})
					await bot.look(0, 0, true)
					bot.chat("/replaceitem entity @p armor.head minecraft:iron_helmet"); await sleep(500)
					bot.chat("/replaceitem entity @p armor.chest minecraft:iron_chestplate"); await sleep(500)
					bot.chat("/replaceitem entity @p armor.legs minecraft:iron_leggings"); await sleep(500)
					bot.chat("/replaceitem entity @p armor.feet minecraft:golden_boots"); await sleep(500)
					newFarming = false
				}
			}
			console.log("[Farm Manager] Ready to fight !")
			bot.is_ready_to_fight = true
			bot.pvp.attack(bot.players[huntedName].entity)
		}, 1000 * id)
	}
	this.getHuntedCoords = async function () {
		return new Promise(async (resolve, rej) => {
			if (bot.players[huntedName].entity) resolve(bot.players[huntedName].entity.position)
			else {
				console.log("[Pathfinder] Player too far ! Rapproching")
				await bot.chat("/execute at " + huntedName + " run spreadplayers ~ ~ 110 128 false " + bot.username)
				await bot.chat('/spawnpoint')
				console.log(bot.players[huntedName].entity)
				if (bot.players[huntedName].entity) resolve(bot.players[huntedName].entity.position)
			}
		})
	}
}