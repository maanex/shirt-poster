export type ChessRating = "blunder" | "inaccuracy" | "good" | "excellent" | "book" | "brilliant"

export const CHESS_RATING_EMOJIS: Record<ChessRating, string> = {
  // blunder: "❓",
  // inaccuracy: "⚠️",
  // good: "✅",
  // excellent: "✨",
  // book: "📖",
  blunder: "<:blunder:1371421711932850186>",
  brilliant: "<:brilliant:1562949599969288253>",
  inaccuracy: "<:inaccuracy:1371421718878617703>",
  good: "<:good:1371421716890386452>",
  excellent: "<:excellent:1371421715464323082>",
  book: "<:book:1371421713971282002>",
}

export const CHESS_RATING_INSTRUCTIONS = "Just rate the last message in this conversation"

// export const CHESS_RATING_CRITERIA: Record<ChessRating, string> = {
//   blunder: "Catastrophic conversational blunder, embarrassing take, cringe, completely unprompted awkwardness, or terrible argument",
//   inaccuracy: "Sub-optimal remark, slight conversational misstep, mildly awkward phrasing, or slightly flawed point",
//   good: "Solid, standard, sound conversational move or ordinary decent contribution",
//   excellent: "Brilliant remark, witty comeback, insightful point, or exceptional banter",
//   book: "Standard conversational opening or conventional reply, common greeting, well-known meme, or routine etiquette",
// }
export const CHESS_RATING_CRITERIA: Record<ChessRating, string> = {
  book: "A textbook or predictable move: routine greeting, standard etiquette, familiar meme, or expected cliché",
  brilliant: "An extraordinary 200 IQ play: an unexpected zinger, genius revelation, or remarkably clever twist",
  excellent: "A strong, high-effort move: insightful point, genuinely funny remark, great explanation, or sharp comeback",
  good: "A basic, ordinary move: simple acknowledgment, standard confirmation, or straightforward functional reply",
  inaccuracy: "A sub-optimal move: slight tangent, passive or unhelpful reply, mild misunderstanding, or awkward phrasing",
  blunder: "A terrible misplay: severe cringe, obvious self-contradiction, embarrassing take, or conversational derailment",
}

export type CachedMessage = {
  id: string
  channelId: string
  authorId: string
  authorUsername?: string
  authorDisplayName?: string
  authorName: string
  content: string
  createdAt: number
  referenceMessageId?: string
}

