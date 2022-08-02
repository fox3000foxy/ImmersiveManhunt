function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
const Vec3 = require("vec3")
const faces = [
	new Vec3(0, -1, 0),
	new Vec3(0, 1, 0),
	new Vec3(0, 0, -1),
	new Vec3(0, 0, 1),
	new Vec3(-1, 0, 0,),
	new Vec3(1, 0, 0,),
];

function hasItemName(bot, name, count = 1) {
	let items = bot.inventory.items().filter(item => (item.name.endsWith(name)))
	let finalCount = 0
	items.forEach((item) => { finalCount += item.count })
	let has = { result: finalCount >= count, count: count, pending: count - finalCount }
	return has
}
function hasItemId(bot, id, count = 1) {
	let items = bot.inventory.items().filter(item => (item.type == id))
	let finalCount = 0
	items.forEach((item) => { finalCount += item.count })
	let has = { result: finalCount >= count, count: count, pending: count - finalCount }
	return has
}

async function alternativeCraft(bot, itemName, count, furnaceMode = false) {
	if (count == 0) return
	console.log("[AlternativeCraft] Item:", itemName, "; Pending crafts:", count)
	if (!furnaceMode) {
		//get needed data
		let items = bot.mcData.items
		let itemsBN = bot.mcData.itemsByName
		let blocks = bot.mcData.blocksByName
		let recipes = bot.mcData.recipes

		//get all recipes for category of block or block 
		let recipesFor = []
		let itemsId = Object.keys(recipes).filter(item => items[item].name.endsWith(itemName) || items[item.name] == itemName)
		itemsId.forEach(itemId => { recipesFor.push(recipes[itemId][0]) })
		let finalRecipes = []
		let inventoryItems = {}
		bot.inventory.items().forEach(item => {
			if (!inventoryItems[item.type]) inventoryItems[item.type] = 0
			inventoryItems[item.type] += item.count
		})
		// console.log("[AlternativeCraft] Inventory:",inventoryItems)
		recipesFor.forEach(async recipe => {
			let neededItems = {}
			// console.log(recipe)
			//Calculate ingredients
			if (recipe.ingredients) {
				recipe.ingredients.forEach((ingredient) => {
					if (!ingredient) return;
					if (!neededItems[ingredient]) neededItems[ingredient] = 0
					neededItems[ingredient]++
				})
			}
			if (recipe.inShape) {
				recipe.inShape.forEach(line => {
					line.forEach(ingredient => {
						if (!ingredient) return;
						if (!neededItems[ingredient]) neededItems[ingredient] = 0
						neededItems[ingredient]++
					})
				})
			}

			//check if player can craft
			canTechnicallyCraft = true
			Object.keys(neededItems).forEach(neededItemId => {
				if (!hasItemId(bot, neededItemId, neededItems[neededItemId]).result)
					canTechnicallyCraft = false
			})

			//check if crafting table is needed
			let craftingTable = !((recipe.ingredients && recipe.ingredients.length <= 5) || (recipe.inShape && recipe.inShape.length < 3 && recipe.inShape[0].length < 3))

			//get result
			finalRecipes.push({ neededItems, craftingTable, canTechnicallyCraft, canCraft: !craftingTable && canTechnicallyCraft, result: recipe.result })
		})
		// console.log(blocks)
		possiblesRecipes = finalRecipes.filter(recipe => recipe.canTechnicallyCraft)
		// console.log("[AlternativeCraft] Possibles recipes:",possiblesRecipes)
		if (possiblesRecipes.length != 0) {
			let recipe = possiblesRecipes[0]
			if (recipe.canCraft) {
				// console.log("[AlternativeCraft] Used recipe:",recipe)
				// await console.log('/give @p '+items[recipe.result.id].name+' '+recipe.result.count)
				await bot.chat('/give @p ' + items[recipe.result.id].name + ' ' + recipe.result.count)
				await Object.keys(recipe.neededItems).forEach(async neededItemId => {
					await bot.chat('/clear @p ' + items[neededItemId].name + ' ' + recipe.neededItems[neededItemId])
				})
			}
			else if (recipe.canTechnicallyCraft) {
				let craftingBlock = bot.findBlock({
					matching: blocks["crafting_table"].id,
					maxDistance: 64
				})
				// bot.chat("CF position:",craftingBlock)
				if (!craftingBlock) {
					if (hasItemName(bot, "crafting_table", 1).result) console.log("[AlternativeCraft] have crafting table")
					else if (!hasItemName(bot, "crafting_table", 1).result && hasItemName(bot, "planks", 4).result) alternativeCraft(bot, "crafting_table", 1)
					else if (!hasItemName(bot, "planks", 4).result && hasItemName(bot, "log", 3).result) alternativeCraft(bot, "planks", 1)
					else if (!hasItemName(bot, "log", 3).result) {
						let posArray = []
						let blocks = bot.mcData.blocksByName
						bot.findBlocks({
							//all types of logs
							matching: [
								blocks["oak_log"].id,
								blocks["spruce_log"].id,
								blocks["birch_log"].id,
								blocks["acacia_log"].id,
								blocks["dark_oak_log"].id
							],
							maxDistance: 64,
							count: hasItemName(bot, "log", 3).pending
						}).forEach(coords => {
							posArray.push(bot.blockAt(coords))
						})
						await bot.collectBlock.collect(posArray)
					}

					let craftWaiting = setTimeout(async () => {
						if (!hasItemName(bot, "crafting_table", 1).result) alternativeCraft(bot, itemName, count)
						else {
							await bot.equip(itemsBN["crafting_table"].id)
							await bot.look(0, -0.75, true)
							let supportBlock = bot.blockAtCursor(maxDistance = 256)
							let p = supportBlock.position.plus(faces[supportBlock.face])
							await bot.chat("/setblock " + p.x + " " + p.y + " " + p.z + " crafting_table")
							bot.chat("/clear @p crafting_table 1")
							/* await bot.dig(supportBlock)
							supportBlock = bot.blockAtCursor(maxDistance=256)
							// bot.chat("/tp _Fox3000_ "+supportBlock.position.x+" "+supportBlock.position.y+" "+supportBlock.position.z+" ")
							await bot.placeBlock(supportBlock, faces[supportBlock.face])*/
							// console.log(itemName,count)

							await alternativeCraft(bot, itemName, count)
						}
					}, 500)
				} else {
					if (recipe.craftingTable && recipe.canTechnicallyCraft) {
						console.log("[AlternativeCraft] Used recipe:", recipe)
						await bot.chat('/give @p ' + items[recipe.result.id].name + ' ' + recipe.result.count)
						Object.keys(recipe.neededItems).forEach(async neededItemId => {
							await bot.chat('/clear @p ' + items[neededItemId].name + ' ' + recipe.neededItems[neededItemId])
						})
					}
				}
			} else {
				console.log("[AlternativeCraft] Can't craft:", itemName)
			}
			alternativeCraft(bot, itemName, count - 1)
		}
		// await sleep(500)
	} else {
		if (hasItemName(bot, "furnace", 1).result && hasItemName(bot, "cobblestone", 8).result) alternativeCraft(bot, "furnace", 1)
		/* 		else if(!hasItemName(bot,"cobblestone",8).result) {
					let posArray = []
					let blocks = bot.mcData.blocksByName
					bot.findBlocks({
						// all types of logs
						matching: blocks["stone"].id,
						maxDistance: 64,
						count:hasItemName(bot,"cobblestone",8).pending
					}).forEach(coords=>{
						posArray.push(bot.blockAt(coords))
					})
				} */
	}
	// console.log(bot.inventory.items())
}
module.exports = alternativeCraft