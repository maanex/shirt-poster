# shirt poster 👕

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

Database migrations in `.drizzle` are applied automatically on startup.

### Initial setup

Run `/kv key:GET value:ADMIN global:true` to get admin rights assigned to your user. Only one user can do this.


### KV options

key | type | purpose
----|------|--------
initial-admin | string | userid of the first user to claim admin, if any
chat-history.length | int | max amount of messages to keep in memory per guild
daily-poll.channel | string | id for the daily poll channel
user.{id}.{permission} | bool | if the user has the permission


### Permissions
name | purpose
-----|--------
admin | this user can change permissions
