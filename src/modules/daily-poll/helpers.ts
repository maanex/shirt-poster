import { google } from '@ai-sdk/google'
import axios from 'axios'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import consola from 'consola'
import { pickOne } from '../../lib/utils'


export namespace DailyPollHelpers {

	type System = {
		personality: string // cynical, terminally online shitposter
		tone: string // Surreal, dry, low-effort, slightly unhinged
		content: string // weirdly specific scenarios, niche internet observations, or bizarre hypotheticals
	}

	const pollSchema = z.object({
		question: z.string(),
		options: z.array(z.string()),
	})

	type Poll = z.infer<typeof pollSchema>

	export async function generatePoll(prompt: string, system: System): Promise<Poll | null> {
		try {
			const systemPrompt = `Act as a ${system.personality}. Generate one absurd poll question and 2-4 short options for a Discord community.

Constraints:
- Tone: ${system.tone}. No "AI enthusiasm."
- Style: ${pickOne('Lowercase preferred.', 'Lowercase preferred.', 'Title case preferred.', '')} No hashtags, no emojis (unless ironic/weird).
- Content: Avoid "would you rather" cliches. Focus on ${system.content}.
- Length: Question < 20 words. Options < 5 words.

Format:
Question
- Option 1
- Option 2`
			const result = await generateText({
				model: google('gemma-4-31b-it'),
				system: systemPrompt,
				prompt,
				output: Output.object({
					schema: pollSchema
				}),
			}).catch((err) => {
				consola.error('Error generating poll:', err)
				return null
			})

			return result?.output ?? null
		} catch (err) {
			consola.error('Unexpected error generating poll:', err)
			return null
		}
	}

	export async function generateAndPostPoll(prompt: string, channelId: string, system: System): Promise<boolean> {
		const poll = await generatePoll(prompt, system)
		if (!poll)
			return false

		const options = poll.options
			.map(option => option.trim())
			.filter(Boolean)
			.slice(0, 10)

		if (options.length < 2)
			return false

		const payload = {
			poll: {
				question: {
					text: poll.question.trim().slice(0, 300)
				},
				answers: options.map(option => ({
					poll_media: {
						text: option.slice(0, 55)
					}
				})),
				duration: Math.floor(Math.random() * 8 + 16),
				allow_multiselect: false,
				layout_type: 1,
			},
		}

		const endpoint = `https://discord.com/api/v10/channels/${channelId}/messages`
		const response = await axios.post(endpoint, payload, {
			headers: {
				Authorization: `Bot ${process.env.DISCORD_API_KEY}`,
				'Content-Type': 'application/json',
			}
		}).catch(() => null)

		return response?.status === 200
	}

}
