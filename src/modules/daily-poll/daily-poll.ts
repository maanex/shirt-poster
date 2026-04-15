import axios from 'axios'
import { defineModule } from '../../lib/module'
import { getMessageMemoryFor, type MessageMemory } from '../chat-history'
import { KV } from '../../lib/kv'
import { DailyPollHelpers } from './helpers'
import { lcgRandom, pickOne } from '../../lib/utils'


const prompters = [
	(messages: MessageMemory[]) => {
		const mes = messages.filter(msg => msg.content.length > 20).at(-1)
		return mes ? `user "${mes.authorName}" said "${mes.content}"` : 'no recent messages, make up a prompt'
	},
	(messages: MessageMemory[]) => {
		const mesList = messages.filter(msg => msg.content.length >= 10 && msg.content.length <= 30)
		if (mesList.length < 3)
			return mesList[0]?.content ?? 'this place is dead :skull:'
		const now = Date.now()
		const mes1 = mesList[lcgRandom(now, mesList.length)]
		const mes2 = mesList[lcgRandom(now + 1, mesList.length)]
		const mes3 = mesList[lcgRandom(now + 2, mesList.length)]
		return `make a poll about "${mes1?.content}" vs "${mes2?.content}" vs "${mes3?.content}"`
	},
	(messages: MessageMemory[]) => {
		const mesList = messages.filter(msg => msg.content.length > 5)
		const now = Date.now()
		const mes1 = mesList[lcgRandom(now, mesList.length)]
		const mes2 = mesList[lcgRandom(now + 1, mesList.length)]
		return `${mes1?.content}, ${mes2?.content}`
	},
	(messages: MessageMemory[]) => {
		return messages.map(m => `${m.authorName}: ${m.content}`).join('\n').slice(-1000)
	},
	(messages: MessageMemory[]) => {
		const users = new Set(messages.map(msg => msg.authorName))
		const user = Array.from(users)[lcgRandom(Date.now(), users.size)]
		return `make a poll about user "${user ?? 'FreeStuff Bot'}"`
	},
	(messages: MessageMemory[]) => {
		const users = new Set(messages.map(msg => msg.authorName))
		if (users.size === 1 || (users.size > 1 && Math.random() < 0.1))
			return `user "${Array.from(users)[0]}" vs something else`
		else if (users.size >= 2)
			return `user "${Array.from(users)[lcgRandom(Date.now(), users.size)]}" vs "${Array.from(users)[lcgRandom(Date.now(), users.size)]}"`
		else
			return 'the server is very quiet, make a play on that'
	},
	(messages: MessageMemory[]) => {
		const words = new Map<string, number>()
		for (const msg of messages) {
			for (const word of msg.content.split(/\s+/)) {
				if (word.length < 4)
					continue
				words.set(word, (words.get(word) ?? 0) + 1)
			}
		}
		const sorted = Array.from(words.entries()).sort((a, b) => b[1] - a[1])
		const topWords = sorted.slice(0, 5).map(entry => entry[0])
		if (topWords.length > 0)
			return `make a poll about "${topWords[lcgRandom(Date.now(), topWords.length)]}"`
		else
			return 'current weather events'
	},
	async () => {
		const cities = [ 'New York', 'London', 'Tokyo', 'Paris', 'Sydney' ]
		const city = cities[lcgRandom(Date.now(), cities.length)]!
		const res = await axios
			.get(`https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current_weather=true&timezone=UTC&city=${encodeURIComponent(city)}`, { timeout: 5000 })
			.then(res => JSON.stringify(res.data))
			.catch(() => 'bruhhhhhhhhhhhhhhhhhhhh')
		return `current weather in ${city}: ${res}`
	},
	() => {
		return axios.get('https://xkcd.com/info.0.json', { timeout: 5000 })
			.then(res => res.data?.alt ?? Math.random().toString(20))
			.catch(() => 'sad day today :(')
	},
	() => `make a poll about ${pickOne('movies', 'video games', 'food', 'music', 'sports', 'technology', 'books', 'travel', 'fashion', 'memes', 'celebrities', 'animals', 'nature', 'space', 'history', 'art', 'science', 'health', 'education', 'politics', 'business', 'finance', 'relationships', 'philosophy', 'psychology', 'self-improvement', 'productivity', 'hobbies', 'fun facts', 'jokes', 'random trivia')}`,
	() => pickOne(
		'dad joke time',
		'speak like a boomer',
		'speak like a 14 year old',
		'speak like a pirate',
		'question never asked before',
		'deep philosophical question',
		'controversial opinion',
		'fun fact',
		'conspiracy theory',
		'this or that',
		'would you rather',
		'hypothetical scenario',
		'what if',
		'guess the answer',
		'make a poll about the last thing you ate',
	)
]

export async function makeAndPostDailyPoll(guildId: string, clientId: string) {
  const channelId = KV.get('daily-poll.channel', { guild: BigInt(guildId) })
	if (!channelId)
		return

	const stepper = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
	const messages = getMessageMemoryFor(guildId).filter((msg) => {
		if (msg.authorId === clientId)
			return false
		if (msg.content.length > 200)
			return false
		if (msg.timestamp < Date.now() - (1000 * 60 * 60 * 24))
			return false
		return true
	})

	const prompter = prompters[lcgRandom(stepper, prompters.length)]!
	const prompt = await Promise.resolve(prompter(messages))

	return DailyPollHelpers.generateAndPostPoll(prompt, channelId, {
		personality: pickOne(
			'cynical, terminally online shitposter',
			'sarcastic, edgy, slightly unhinged internet user',
			'absurdist, surrealist, dadaist troll',
			'uwu-obsessed, anime-loving, ironic memer',
			'pretentious, verbose, overeducated intellectual',
			'deadpan, dry, brutally honest realist',
			'conspiracy theorist who sees hidden meanings in everything',
			'snarky, witty, pop culture-obsessed critic',
			'weirdly specific niche enthusiast (e.g. vintage tech, obscure media, esoteric hobbies)',
			'stupid person. like really stupid. insanely dumb. no braincells, no coherent thoughts'
		),
		tone: pickOne(
			'surreal, dry, low-effort, slightly unhinged',
			'casual, conversational, with a hint of sarcasm',
			'over-the-top dramatic and theatrical',
			'deadpan and brutally honest',
			'conspiratorial and mysterious',
			'absurdist and nonsensical',
			'pretentious and verbose like an overeducated intellectual',
			'uwu girl :3 OwO .✦ ݁˖ hehe *purrs* ꉂ(˵˃ ᗜ ˂˵) meow ^^ kawaii (˶>⩊<˶)',
			'ignore the \'no emojis\' rule and only speak in emojis! ✨🤓🌲😳'
		),
		content: pickOne(
			'weirdly specific scenarios, niche internet observations, or bizarre hypotheticals',
			'current events and pop culture happenings',
			'universally relatable everyday experiences',
			'absurd and surreal situations that defy logic',
			'controversial and divisive topics that spark debate',
			'hilariously mundane things that people overreact to',
			'deep philosophical questions with no right answer',
			'conspiracy theories that are just plausible enough to be entertaining',
		),
	})
}

export default defineModule({
  onReady({ client }) {
    setInterval(() => {
      for (const guild of client.guilds.cache.values()) {
				const channelId = KV.get('daily-poll.channel', { guild: BigInt(guild.id) })
				if (!channelId)
					continue

				const currentDay = Math.floor((Date.now() + Number(BigInt(guild.id) >> 22n)) / (1000 * 60 * 60 * 24)).toString()
				const lastSend = KV.get('daily-poll.last', { guild: BigInt(guild.id), default: currentDay })
				if (lastSend === currentDay)
					continue

        setTimeout(() => {
					KV.set('daily-poll.last', currentDay, { guild: BigInt(guild.id) })
          makeAndPostDailyPoll(guild.id, client.user.id)
        }, Math.floor(Math.random() * 1000 * 60 * 59))
      }
    }, 1000 * 60 * 60 * 1)
  },
})
