# .mrpack split

Split a modrinth modpack in two configurations, server mods only and client mods only.

## Env

Create a `.env` file, an example is [here](.env.example).

```env
MODRINTH_PAT=mrp_____________________________________________________________
USER_AGENT_PREFIX=someone
```

Get yourself a [modrinth personal access token](https://modrinth.com/settings/account). Read more about it [here](https://docs.modrinth.com/api/).

Change `USER_AGENT_PREFIX` to your github username and `MODRINTH_PAT` to your new modrinth personal access token.

## Usage

```
pnpm start <your-file-here>
```

> Expect two files `client_---.mrpack` and `server_---.mrpack` in the same directory and a few log files near the executable.
