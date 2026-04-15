import chatHistory from "../modules/chat-history"
import dailyPoll from "../modules/daily-poll/daily-poll"
import directTalk from "../modules/direct-talk"
import wordReactions from "../modules/word-reactions"
import type { Module } from "./module"


export const moduleList = [
  wordReactions,
  chatHistory,
  dailyPoll,
  directTalk,
] satisfies Module[]
