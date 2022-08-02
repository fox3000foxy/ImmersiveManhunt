/* 	async function craftItem (name, amount=1) {
		const item = items[name]
		let craftingBlock = bot.findBlock({
			matching: blocks["crafting_table"].id,
			maxDistance:64
		})
		if (!craftingBlock) {
			if(hasItem("crafting_table").result){
				await bot.equip(items["crafting_table"].id)
				await bot.look(0,-45,true)
				let supportBlock = bot.blockAtCursor(maxDistance=256)
				await bot.placeBlock(supportBlock, faces[supportBlock.face])
				craftBasic("crafting_table")
				setTimeout(()=>{
					craftItem(name,amount)
				},500)
				return;
			} else if(
				hasItem("oak_planks").result ||
				hasItem("spruce_planks").result ||
				hasItem("birch_planks").result ||
				hasItem("jungle_planks").result ||
				hasItem("acacia_planks").result ||
				hasItem("dark_oak_planks").result
			){
				craftBasic("crafting_table")
				setTimeout(()=>{
					craftItem(name,amount)
				},500)
				return
			} else if(
				hasItem("oak_log").result ||
				hasItem("spruce_log").result ||
				hasItem("birch_log").result ||
				hasItem("jungle_log").result ||
				hasItem("acacia_log").result ||
				hasItem("dark_oak_log").result 
			){
				craftPlanks()
				setTimeout(()=>{
					craftItem(name,amount,table)
				},500)
				return;
			} else {
				wood_logs = await findBlock("log",3)
				bot.collectBlock.collect(wood_logs)
				return;
			}	
			return;
		}
		let target = craftingBlock.position
		await bot.pathfinder.setGoal(new GoalNear(target.x, target.y, target.z, 3))
		bot.on("goal_reached",async ()=>{
			if (item) {
				if (canCraft(item, craftingBlock)){
					const recipe = bot.recipesFor(item.id, null, null, craftingBlock)[0]
					try {
						bot.craft(recipe, amount, craftingBlock)
						bot.closeWindow(bot.window)
						bot.equip(item.id)
						bot.chat(`did the recipe for ${name} ${amount} times`)
					} catch (err) {bot.chat(err.message)}
				}else {bot.chat('cant craft')}
			} else {bot.chat(`unknown item: ${name}`)}
		})
	}
	function craftBasic(name, amount=1){
		const item = items[name]
		if (item) {
			if (canCraft(item, null)){
				const recipe = bot.recipesFor(item.id, null, null, null)[0]
				try {
					bot.craft(recipe, amount, null)
					bot.closeWindow(bot.window)
					bot.equip(item.id)
					bot.chat(`did the recipe for ${name} ${amount} times`)
				} catch (err) {bot.chat(err.message)}
			}
			else {bot.chat('cant craft')}
		} else {bot.chat(`unknown item: ${name}`)}
	}

	function canCraft(item, table){
		const recipe = bot.recipesFor(item.id, null, 1, table)[0]
		if (recipe) {return true} 
		else {return false}
	} 
	
	function doCraft(name,count) {
		if(!items[name]) {
			bot.chat('inexsting item: '+name)
			return
		}
		let recipes = mcData.recipes[items[name].id]
		if(recipes) {
			let recipe = recipes[0]
			console.log(recipe)
			if((recipe.ingredients && recipe.ingredients.length <= 5) || (recipe.inShape && recipe.inShape.length < 3 && recipe.inShape[0].length < 3)) {
				// craftBasic(name, count)
				
			}
			else {
				// craftItem(name, count)
			}
		}
		else {
			bot.chat("unknown item, or no craft for this item")
		}
	}
	
	function craftPlanks(count=1){
		if(hasItem("oak_log").result){craftBasic("oak_planks", count)}
		else if (hasItem("spruce_log").result){craftBasic("spruce_planks", count)}
		else if (hasItem("birch_log").result){craftBasic("birch_planks", count)} 
		else if (hasItem("jungle_log").result){craftBasic("jungle_planks", count)}
		else if (hasItem("acacia_log").result){craftBasic("acacia_planks", count)}
		else if (hasItem("dark_oak_log").result){craftBasic("dark_oak_planks", count)}
	} */