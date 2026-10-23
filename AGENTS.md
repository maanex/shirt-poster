# Agent Guidelines & Project Learnings

## Scope & File Boundaries
- **Touch only requested files**: Never edit, refactor, or reformat unrelated files (e.g. core libraries like `src/lib/kv.ts` or `src/lib/system-one.ts`) unless explicitly asked to do so.
- **Do not introduce redundant state**: Reuse existing properties and logic instead of inventing redundant helper properties (e.g. check `content.length === 0` rather than adding a separate `hasOriginalContent` boolean).
- **Avoid duplicate caches**: Reuse existing shared modules (like `chat-history.ts`) with API fetch fallbacks instead of creating isolated private caches.

## Code Style & Formatting
- **Quotes**: Always use single quotes `'` over double quotes `"` in JavaScript/TypeScript code and string literals.
- **Control Flow Newlines**: Never write single-line `if` or `for` statements. The body must always start on the next line.
  ```ts
  // Correct
  if (condition)
    return

  // Forbidden
  if (condition) return
  ```
- **Braces `{ }` on conditionals and loops**:
  - Omit `{ }` **only** when the body is a single one-line statement.
  - **Always keep `{ }`** if multiple lines follow (e.g., nested `for`/`if` statements, multi-line expressions, or when an `if` block uses braces and an `else` block follows).
  ```ts
  // Correct: single line following
  if (!guildId)
    return false

  // Correct: multiple lines following inside loop/if -> MUST keep braces
  for (const item of parsedList) {
    if (item.guildId)
      recordInMemory(item.guildId, item)
  }
  ```

## Functions & Organization
- **No inner `function` keywords**: Never declare nested functions inside other functions using the `function` keyword. Use arrow functions (`const helper = () => ...`).
- **File Structure & Export Order**:
  - `export default` belongs at the very end of the file.
  - Sort functions contextually (group types, state, helpers, handlers, and public APIs logically).
- **Less is More / Compact & DRY**:
  - Eliminate single-use variables with trivial values.
  - Extract repetitive logic (like history cutoff loops) into small multipurpose helpers.

## Discord & Bot Conventions
- **Custom Emojis**: When reacting to messages with custom Discord emojis (`<:name:id>`), always pass the raw numeric snowflake ID (`match(/:(\d+)>/)?.[1]`), not the formatted string tag or name.
- **Bots & Rich Content**: Bot messages and messages without original text content should not be rated/reacted to, but should remain included in context representations.

