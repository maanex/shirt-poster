import chatHistory from "../modules/chat-history"
import chessRating from "../modules/chess-rating"
import dailyPoll from "../modules/daily-poll/daily-poll"
import directTalk from "../modules/direct-talk"
import wordReactions from "../modules/word-reactions"
import type { Module } from "./module"


export const moduleList = [
  wordReactions,
  chatHistory,
  dailyPoll,
  directTalk,
  chessRating,
] satisfies Module[]
