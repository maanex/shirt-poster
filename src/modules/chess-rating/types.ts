export type ChessRating = 'blunder' | 'inaccuracy' | 'good' | 'excellent' | 'book' | 'brilliant'

export const CHESS_RATING_EMOJIS: Record<ChessRating, string> = {
  blunder: '<:blunder:1371421711932850186>',
  brilliant: '<:brilliant:1562949599969288253>',
  inaccuracy: '<:inaccuracy:1371421718878617703>',
  good: '<:good:1371421716890386452>',
  excellent: '<:excellent:1371421715464323082>',
  book: '<:book:1371421713971282002>',
  // blunder: '⁉️',
  // brilliant: '🤯',
  // inaccuracy: '🤔',
  // good: '✅',
  // excellent: '🌟',
  // book: '📕',
}

// export const CHESS_RATING_INSTRUCTIONS = 'Rate the last message (marked as RATE THIS) in a conversational context. Focus on the quality of the message, its relevance, and its impact on the conversation only. Format is `Author: Message`, one line per message.'
export const CHESS_RATING_INSTRUCTIONS =
  'You are an expert chess engine analyzing a casual text conversation like a game of chess ("Texting Theory"). ' +
  'Evaluate ONLY the single target move labeled [TARGET MOVE] based on its wit, timing, banter, and conversational tactics within the context.'

export const CHESS_RATING_CRITERIA: Record<ChessRating, string> = {
  book: 'Standard textbook opening greetings or conventional pleasantries at the start of a conversation (e.g. "hey", "sup", "how are you", "what\'s up"). Never applies to mid-conversation banter.',
  good: 'A standard, solid conversational move that keeps dialogue going naturally without taking big risks or showing exceptional wit.',
  excellent: 'A sharp, charming, or clever response; great comedic timing, smooth teasing, or an effective conversational save.',
  brilliant: 'An extraordinary conversational move; a savage comeback, springing a deliberate trap, delivering a devastating punchline, or a high-risk gambit that paid off completely.',
  inaccuracy: 'A weak, dry, lukewarm, or awkward message; fumbling conversational momentum or missing an obvious joke, but not conversation-ending.',
  blunder: 'Conversational suicide; walking straight into a trap, an embarrassing self-own, desperate cringe, or killing the vibe completely.',
}

export type { MessageMemory, MessageMemory as CachedMessage } from '../chat-history'
