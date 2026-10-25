export type ChessRating = 'blunder' | 'inaccuracy' | 'good' | 'excellent' | 'book' | 'brilliant'

export const CHESS_RATING_EMOJIS: Record<ChessRating, string> = {
  blunder: '<:blunder:1371421711932850186>',
  brilliant: '<:brilliant:1562949599969288253>',
  inaccuracy: '<:inaccuracy:1371421718878617703>',
  good: '<:good:1371421716890386452>',
  excellent: '<:excellent:1371421715464323082>',
  book: '<:book:1371421713971282002>',
}

export const CHESS_RATING_INSTRUCTIONS = 'Rate the last message (marked as RATE THIS). Treat traits within each criterion as alternatives: matching any one is enough, not all.'

export const CHESS_RATING_CRITERIA: Record<ChessRating, string> = {
  book: 'highly predictable message, not surprising or original, the most obvious response or standard answer, lacks creativity or insight',
  brilliant: 'outstanding message (positive or negative), highly unexpected but well-executed, smart comeback, funny comment, or clever roast on another person',
  excellent: 'message showing strong personality, insightful point, funny remark, good explanation, or genuinely helpful',
  good: 'basic ordinary message, simple acknowledgment, standard confirmation, or straightforward functional reply',
  inaccuracy: 'sub-optimal message, passive or unhelpful reply, mild misunderstanding, awkward phrasing, or slightly lost take',
  blunder: 'terrible misplay, cringe, lost, self-own, obvious self-contradiction, embarrassing take, or conversational derailment',
}

export type { MessageMemory, MessageMemory as CachedMessage } from '../chat-history'
