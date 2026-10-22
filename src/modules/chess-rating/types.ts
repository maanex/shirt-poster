export type ChessRating = "blunder" | "inaccuracy" | "good" | "excellent" | "book"

export const CHESS_RATING_EMOJIS: Record<ChessRating, string> = {
  blunder: "❓",
  inaccuracy: "⚠️",
  good: "✅",
  excellent: "✨",
  book: "📖",
}

export const CHESS_RATING_INSTRUCTIONS = "Just rate the last message in this conversation"

export const CHESS_RATING_CRITERIA: Record<ChessRating, string> = {
  blunder: "Catastrophic conversational blunder, embarrassing take, cringe, completely unprompted awkwardness, or terrible argument",
  inaccuracy: "Sub-optimal remark, slight conversational misstep, mildly awkward phrasing, or slightly flawed point",
  good: "Solid, standard, sound conversational move or ordinary decent contribution",
  excellent: "Brilliant remark, witty comeback, insightful point, or exceptional banter",
  book: "Standard conversational opening or conventional reply, common greeting, well-known meme, or routine etiquette",
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

