# absolute shirt poster ✋😐🤚

To install 👕:

```bash
bun install
```

To 👕:

```bash
bun run index.ts
```

Database migrations in `.drizzle` are applied automatically on startup.

### Initial 👕 setup

Run `/kv key:GET value:ADMIN global:true` to get admin rights assigned to your user. Only one user can do this.


### KV 👕 options

key | type | purpose
----|------|--------
initial-admin | string | userid of the first user to claim admin, if any
chat-history.length | int | max amount of messages to keep in memory per guild
daily-poll.channel | string | id for the daily poll channel
user.{id}.{permission} | bool | if the user has the permission
chess-rating.channels | string | channel IDs where chess ratings are enabled (comma-separated), or `*` for guild-wide
chess-rating.min-confidence | float | minimum confidence lead between top choices to react (default: `0.1`)
chess-rating.history-limit | int | max number of messages in context flow (default: `10`)
chess-rating.history-cutoff-hours | float | max gap in hours between messages before cutting off (default: `3`)


### 👕 Permissions
name | purpose
-----|--------
admin | this user can change permissions
