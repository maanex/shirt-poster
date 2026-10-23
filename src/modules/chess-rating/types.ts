export type ChessRating = 'blunder' | 'inaccuracy' | 'good' | 'excellent' | 'book' | 'brilliant'

export const CHESS_RATING_EMOJIS: Record<ChessRating, string> = {
  blunder: '<:blunder:1371421711932850186>',
  brilliant: '<:brilliant:1562949599969288253>',
  inaccuracy: '<:inaccuracy:1371421718878617703>',
  good: '<:good:1371421716890386452>',
  excellent: '<:excellent:1371421715464323082>',
  book: '<:book:1371421713971282002>',
}

export const CHESS_RATING_INSTRUCTIONS = 'Given the conversation context, evaluate the conversational quality and impact of the message marked as (RATE THIS)'

export const CHESS_RATING_CRITERIA: Record<ChessRating, string> = {
  // book: 'A textbook or predictable move: routine greeting, standard etiquette, familiar meme, or expected cliché',
  // brilliant: 'An extraordinary 200 IQ play: an unexpected zinger, genius revelation, or remarkably clever twist',
  // excellent: 'A strong, high-effort move: insightful point, genuinely funny remark, great explanation, or sharp comeback',
  // good: 'A basic, ordinary move: simple acknowledgment, standard confirmation, or straightforward functional reply',
  // inaccuracy: 'A sub-optimal move: slight tangent, passive or unhelpful reply, mild misunderstanding, or awkward phrasing',
  // blunder: 'A terrible misplay: severe cringe, obvious self-contradiction, embarrassing take, or conversational derailment',
  book: 'A predictable move: routine greeting, familiar meme, or expected cliché - neutral positive',
  brilliant: 'An outstanding reply: unexpected twist, genius comeback, or even a complete roast or dunk on another person',
  excellent: 'A strong message: insightful point, genuinely funny remark, great explanation, or nice comeback',
  good: 'A basic, ordinary text: simple acknowledgment, standard confirmation, or straightforward functional reply',
  inaccuracy: 'A sub-optimal: passive or unhelpful reply, mild misunderstanding, awkward phrasing, or slightly lost take',
  blunder: 'A terrible misplay: cringe, self-own, obvious self-contradiction, embarrassing take, or conversational derailment',
}

export type { MessageMemory, MessageMemory as CachedMessage } from '../chat-history'
