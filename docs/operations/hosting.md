# Hosting

One Cloudflare Worker serves everything: the built game as static assets, and
`/api/*` and `/ws/*` through its code. All of it is declared in
`apps/server/wrangler.jsonc`; there is no staging, every push to `main` that
passes CI goes live.

| Piece         | Provider                                | Identifier                                                                 |
| ------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| The Worker    | Cloudflare Workers, account `431a5290…` | `parallax` (`name`)                                                        |
| The game      | Static assets of the Worker             | `apps/game/dist` (`assets`), single-page fallback                          |
| Rooms         | Durable Object, SQLite-backed           | class `RoomObject`, binding `ROOMS`                                        |
| Room creation | Workers Rate Limiting                   | binding `ROOM_CREATION_LIMITER`, namespace `2001`, 10 a minute per address |
| Its address   | Custom domain, zone `adrienlcp.com`     | `parallax.adrienlcp.com` (`routes`); no `workers.dev` host (`workers_dev`) |

`scripts/operations/hosting.ts` holds the account, zone, repository, Worker
name and domain for the scripts. The CI secrets that let GitHub deploy to
Cloudflare are covered in [secrets.md](secrets.md).

The app is private: every response carries `X-Robots-Tag: noindex`
(`apps/game/public/_headers`) and the page has `<meta name="robots">` to match.

## Create or recreate it

Nothing to run apart from a deploy: `wrangler deploy` creates the Worker if it
is missing, applies the Durable Object migrations, and creates the custom
domain with its DNS record. After deleting the Worker by mistake, re-run the
last CI run (`gh run rerun <id>`) or deploy by hand (below). The domain
answers once its certificate is issued, a few minutes after the first deploy.

Rate limit namespace ids are account-wide: `2001` must stay unused by the
other Workers of the account (melee holds the 1000s).

After any change to `wrangler.jsonc`, regenerate the binding types and commit
`apps/server/worker-configuration.d.ts` (the server build checks them):

```powershell
pnpm --filter @parallax/server cf-typegen
```

## Deploy by hand

The last resort, when CI cannot deploy: from a clean clone of `main` only (it
ships whatever the folder holds). Unlock first ([secrets.md](secrets.md),
_Unlocking_), then in that terminal:

```powershell
pnpm install --frozen-lockfile; pnpm build
```

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "431a529079f2d76802b95056e39950f0"; $env:CLOUDFLARE_API_TOKEN = bw get password "Cloudflare Pages token"; pnpm --filter @parallax/server exec wrangler deploy
```

Expected: `Uploaded parallax`, `Deployed parallax triggers`, then
`parallax.adrienlcp.com (custom domain)`. Close the terminal afterwards: it
holds the token.

## Common errors

| Message                                                 | Fix                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Authentication error [code: 10000]`                    | The Cloudflare token lacks a permission listed in [secrets.md](secrets.md), or expired: renew it.                                           |
| `No access to the specified resource`, after `Uploaded` | The code is up but the custom domain was refused: the token lacks _Zone · Workers Routes · Edit_ on `adrienlcp.com`.                        |
| A record for `parallax.adrienlcp.com` already exists    | Another record holds the name: dashboard → _adrienlcp.com → DNS → Records_, delete it, deploy again.                                        |
| The site answers `522` or a certificate error           | The certificate is not issued yet: wait ten minutes. Still failing: dashboard → _Workers & Pages → parallax → Settings → Domains & Routes_. |
