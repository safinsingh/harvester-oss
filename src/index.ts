import fs from 'fs'

import { config } from 'dotenv'
import Discord from 'discord.js'

import { info, fail, success } from './log'
import Store from './store'
import { CHANNEL } from './constants'

config()
const client = new Discord.Client()
const store = new Store()

client.on('ready', async () => {
	console.clear()
	success(`Bot ready at: ${client.user?.tag}!`)
	info(`Performing bot initialization...`)

	try {
		await store.setChannel(client)
		await store.setMe(client)
		await store.init()

		store.initializeHarvestTimeCycle(1)
	} catch (e) {
		fail(e)
	}
})

client.on('typingStart', async (chan, user) => {
	if (chan.id !== CHANNEL) return
	await store.handleTypingEvent(user.username as string)
})

client.on('message', async (msg) => {
	if (msg.channel.id !== CHANNEL) return
	if (msg.content === 'harvest') await store.handleHarvest(msg)
})

function handleDeath() {
	const obj = store.dumpObject()

	fs.writeFileSync('harvester.cache', JSON.stringify(obj))
	process.exit(0)
}

process.on('SIGINT', handleDeath)
process.on('SIGTERM', handleDeath)
process.on('SIGQUIT', handleDeath)

client.login(process.env.TOKEN)
