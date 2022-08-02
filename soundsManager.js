module.exports = function (bot,huntedName){
	this.sounds = require('./sounds.json')
	console.log("[Sound Manager] Started! ")
	// this
	
	this.countKeysFor = function(botAlias,event) {
	  let dictionnary = Object.keys(this.sounds).filter(sound => sound.startsWith(botAlias+"."+event))
	  let counter = dictionnary.length
	  // console.log(dictionnary.length,"occurences for",botAlias+"."+event)
	  return dictionnary.length
	}
	
	this.randomNumber = function(max){
		return Math.round(Math.random() * (max-1)) + 1
	}
	this.playSound = function(botAlias, event) {
		// console.log(this)
	  let possibilities = this.countKeysFor(botAlias,event)
	  let number = this.randomNumber(possibilities)
	  let soundId = `${botAlias}.${event}${number}`
	
	  Object.keys(this.sounds).forEach((sound)=>{
		  if(sound!="ost1" && sound!="ost2")
			bot.chat("/execute at "+huntedName+" run stopsound "+huntedName+" * immersivesmp:"+sound)
	  })
	  bot.chat("/execute at "+huntedName+" run playsound immersivesmp:"+soundId+" master "+huntedName)
	}
	
	this.playSoundById = function(soundId) {
	  bot.chat("/execute at "+huntedName+" run playsound immersivesmp:"+soundId+" master "+huntedName)
	}
	
	return {
		playSound:this.playSound,
		playSoundById:this.playSoundById,
		randomNumber:this.randomNumber,
		countKeysFor:this.countKeysFor,
		sounds:this.sounds
	}
	// this.playSound("bbh","death")
}