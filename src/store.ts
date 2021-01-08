/* eslint-disable no-await-in-loop */
import fs from 'fs'

import type Discord from 'discord.js'
import { setIntervalAsync } from 'set-interval-async/fixed'

import {
	ACTIVE_USERS,
	CHANNEL,
	CLOCK_REGEX,
	HARVEST_TIMEOUT,
	NORMAL_HARVEST_THRESHOLD,
	TYPING_HARVEST_THRESHOLD,
	INT_RADIX,
	MAPLE_ID,
	NEXT_HARVEST_REGEX,
	MAPLE_TIMEOUT,
	HARVESTED_REGEX,
	ACTIVE_USER_NAMED,
	ME
} from './constants'
import { sleep } from './time'
import { snipe } from './util'
import { success, info, warn, update } from './log'

interface ICache {
	ms: number
	clock: number
	users: {
		[key: string]: number
	}
}

export default class Store {
	// username -> next harvest time
	private userMap: Map<string, number>
	private channel?: Discord.TextChannel
	private clock: number
	private me?: Discord.User
	private iterations: number

	constructor() {
		this.userMap = new Map()
		this.clock = 0
		this.iterations = 0
	}

	public async setChannel(client: Discord.Client) {
		this.channel = (await client.channels.fetch(
			CHANNEL
		)) as Discord.TextChannel
	}

	public async setMe(client: Discord.Client) {
		this.me = await client.users.fetch(ME)
	}

	public async init() {
		if (fs.existsSync('harvester.cache')) {
			info('Found cache, restoring data...')
			this.partialInit()
		} else {
			info('Cache not found, re-initializing data...')
			this.fullInit()
		}
	}

	private async partialInit() {
		const dat = JSON.parse(
			(await fs.promises.readFile('harvester.cache')).toString()
		) as ICache

		this.clock =
			Math.round(new Date().getTime() / 1000) - dat.ms + dat.clock
		Object.entries(dat.users).forEach(([k, v]) => this.userMap.set(k, v))
	}

	private async fullInit() {
		for (const user of ACTIVE_USERS) {
			// avoid rate limiting
			await sleep(2)

			await this.channel?.send(`nextharvest=${user}`)
			const reply = await this.getReply()

			try {
				const matches = reply?.content.match(
					NEXT_HARVEST_REGEX
				) as RegExpMatchArray

				this.userMap.set(
					user,
					parseInt(matches[1], INT_RADIX) * 60 +
						parseInt(matches[2], INT_RADIX)
				)
			} catch {
				// assume their harvest is not on cooldown
				this.userMap.set(user, 0)
			}
		}

		success('Gathered harvest countdowns!')

		await sleep(2)
		await this.channel?.send(`clock`)
		const reply = await this.getReply()

		const matches = reply?.content.match(CLOCK_REGEX) as RegExpMatchArray

		this.clock = parseInt(matches[1], INT_RADIX)
		success('Bot initialization complete!')
	}

	private async getReply() {
		return (
			await this.channel?.awaitMessages((m) => m.author.id === MAPLE_ID, {
				max: 1,
				time: MAPLE_TIMEOUT,
				errors: ['time']
			})
		)?.first()
	}

	public initializeHarvestTimeCycle(delay: number) {
		info('Initializing harvest time cycle...')
		setIntervalAsync(async () => {
			this.userMap.forEach((value, key) => {
				if (value === 0) return
				this.userMap.set(key, value <= delay ? 0 : value - delay)
			})

			this.clock += delay
			if (this.clock >= NORMAL_HARVEST_THRESHOLD && this.canSnipe()) {
				// triple points hack
				await Promise.all([snipe(), snipe(), snipe()])
			}

			// dump every 5 mins
			if (++this.iterations % 300 === 0) this.dump()
		}, delay * 1000)
	}

	public clearClock() {
		this.clock = 0
	}

	private canSnipe() {
		return this.userMap.get('REDACTED') === 0
	}

	public async handleTypingEvent(username: string) {
		const record = this.userMap.get(username)

		if (record === null || record !== 0) return
		if (this.clock >= TYPING_HARVEST_THRESHOLD && this.canSnipe()) {
			// triple points hack
			await Promise.all([snipe(), snipe(), snipe()])
		}
	}

	public async handleHarvest(msg: Discord.Message) {
		const { username } = msg.author

		if (this.userMap.get(username) === undefined) return

		const reply = await this.getReply()
		const matches = reply?.content.match(HARVESTED_REGEX)

		if (matches === null || matches === undefined) return

		this.userMap.set(msg.author.username, HARVEST_TIMEOUT)
		this.clock = 0

		const isMe = username === 'REDACTED'
		const [, points] = matches

		const fn = isMe ? success : warn

		fn(`${ACTIVE_USER_NAMED(username)} harvested ${points} points!`)
		if (isMe) this.me?.send(`REDACTED`)
	}

	public dumpObject() {
		const ret = {
			ms: Math.round(new Date().getTime() / 1000),
			clock: this.clock,
			users: {} as { [key: string]: number }
		}

		this.userMap.forEach((val, key) => {
			ret.users[key] = val
		})

		return ret
	}

	// utility
	public dump() {
		this.userMap.forEach((val, key) => {
			update(`${ACTIVE_USER_NAMED(key)}:\t${val}s`)
		})
		update(`Clock:\t${this.clock}s`)
	}
}
