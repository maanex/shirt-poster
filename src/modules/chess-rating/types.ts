export type ChessRating = "blunder" | "inaccuracy" | "good" | "excellent" | "book"

export const CHESS_RATING_EMOJIS: Record<ChessRating, string> = {
  // blunder: "❓",
  // inaccuracy: "⚠️",
  // good: "✅",
  // excellent: "✨",
  // book: "📖",
  blunder: "<:blunder:1371421711932850186>",
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
  book: "Standard conversational opening or formulaic greeting (e.g. 'hi', 'how's it going', routine chat starters)",
  excellent: "A top-tier move: sharp insight, clever comeback, highly witty remark, or winning argument",
  good: "A solid, reasonable response that keeps the conversation flowing smoothly without standing out",
  inaccuracy: "A slight conversational misstep: mild misunderstanding, awkward phrasing, or slightly questionable take",
  blunder: "A devastating mistake: massive self-own, completely embarrassing take, total cringe, or destroying one's own point",
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

