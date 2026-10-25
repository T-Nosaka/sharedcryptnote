
## SharedCryptNote
SharedCryptNote is a secure, web-based encrypted note-taking application. It uses SNC1 (AES-256-GCM + scrypt) encryption by default, with legacy Blowfish (Tombo-compatible BF01) read support, to securely store your notes and manages them efficiently within a file system. It is also compatible with the Android application "SharedKeyMemo," ensuring a seamless note-taking experience across your devices.

https://play.google.com/store/apps/details?id=org.dwmedia.sharedkeymemo

![](./screenshot1.png)

## Key Features
Strong Encryption

Uses SNC1 (AES-256-GCM + scrypt) by default, with legacy BF01 (Blowfish, Tombo compatible) read support, to keep your notes safe and secure.

Google Account Integration

Easily log in using your existing Google account.

Git Version Control

Each note is managed with Git, allowing you to track changes and revert to previous versions.

Multi-Device Compatibility

Compatible with the Android app SharedKeyMemo, enabling you to share and edit the same notes between your PC and smartphone.

Tech Stack
Frontend: Next.js

Encryption: SNC1 (AES-256-GCM + scrypt, default) / BF01 legacy (Blowfish, Tombo compatible)

Version Control: Git

Authentication: Google Account Integration

## Google AUTH
.env.local
```bash
# NextAuth.js のセッションを暗号化するための秘密鍵です。任意の文字列で構いません。
NEXTAUTH_SECRET=UUID

# Google Cloud Platform で取得した Client ID
GOOGLE_CLIENT_ID=

# Google Cloud Platform で取得した Client Secret
GOOGLE_CLIENT_SECRET=

# Callback URL (http://localhost:3000/api/auth/callback/google)
NEXTAUTH_URL=https://sharednote.hoge.com
```

## Allow Users (ALLOWUSERS)
Restrict which Google accounts can sign in, using an allowlist.

- Set the `ALLOWUSERS` environment variable to the path of a JSON file listing allowed email addresses.
- When unset: no restriction (any Google account can sign in, as before).
- When set: only the listed addresses can sign in and use the APIs. Any other address is rejected at sign-in.
- Addresses are normalized with trim + lowercasing before comparison.
- Fail-closed: if the file is missing, unreadable, or contains broken JSON, everyone is rejected.
- New sign-ins are blocked in the `signIn` callback, and existing sessions are blocked with 403 in every API route.
- The file is reloaded when its mtime changes, so no restart is needed after editing.

```bash
# Add to .env.local
ALLOWUSERS=/git-repos/allowusers.json
```

JSON format (a plain array, or an object with a `users` / `allowedUsers` / `allowUsers` / `emails` key):

```json
[
  "you@example.com",
  "family@example.com"
]
```

```json
{ "users": ["you@example.com"] }
```

Setup example:

```bash
cat > /git-repos/allowusers.json <<EOF
[
  "you@example.com"
]
EOF
echo "ALLOWUSERS=/git-repos/allowusers.json" >> .env.local
npm run build
```

Note: `allowusers.json` in this repository is only a dummy sample (contains `your-email@gmail.com`). Replace it with your real address before use. If you do not want to push real addresses to Git, consider adding it to `.gitignore` or deploying it only on the server.

## Encryption (.chi: SNC1 / BF01 dual-format)

`.chi` keeps its extension; the format is detected by the first 4 bytes (magic).

- `SNC1` (`53 4E 43 31`): new format, default for writes.
- `BF01` (`42 46 30 31`): legacy Tombo-compatible format, still readable.
- `.txt` files are never magic-detected.

### SNC1 layout

```
magic "SNC1" 4B | ver 0x01 1B | kdfId 0x01=scrypt 1B
| N u32BE 4B (=16384) | r u32BE 4B (=8) | p u32BE 4B (=1)
| salt 16B | nonce 12B | ciphertext (variable) | GCM tag 16B
```

- Header is 46B total and is used as AAD for AES-256-GCM.
- Key: `scrypt(password, salt, N=16384, r=8, p=1, 32B, maxmem 32MB)` -> `AES-256-GCM` (256-bit key, 96-bit nonce).
- Plaintext is the raw file bytes, same as the BF01 path.
- `salt` / `nonce` use `randomBytes` (CSPRNG), so the same plaintext encrypts differently each time.
- Tampering with the header, body, or tag fails decryption (returns invalid-password).

### BF01 legacy (Tombo compatible)

Blowfish-CBC with fixed IV `BLOWFISH`, MD5-based key (`MD5(password)`), MD5-embedded integrity check.
Hardened in Phase0 (still legacy, use SNC1 for new files):

- Random padding now uses `randomBytes(8)` (was `Math.random()`).
- MD5 comparison uses `timingSafeEqual` (was non-constant-time compare).
- Use `bf01` writes only when Android SharedKeyMemo / Tombo compatibility is required.

### Write mode

Default write mode is `CRYPTO_DEFAULT_MODE` (`snc1` | `bf01`, default `snc1`).
Per-request `mode` (`encrypt` / `put`) overrides it. Invalid values fall back to `snc1`.

```bash
# Add to .env.local (default is snc1 when unset)
CRYPTO_DEFAULT_MODE=snc1
```

### Password policy (all 4 routes, encryption and decryption)

- Minimum length via env: `CRYPTO_PASSWORD_MIN_LENGTH` (server, runtime) and `NEXT_PUBLIC_CRYPTO_PASSWORD_MIN_LENGTH` (browser, build time). Set both to the same value.
- Hard floor 4, default 8, cap 64. Out-of-range or invalid values fall back (`<4` -> `4`, `>64` -> `64`, unparsable -> `8`).
- Example: existing 4-char passwords keep working with `CRYPTO_PASSWORD_MIN_LENGTH=4` + `NEXT_PUBLIC_CRYPTO_PASSWORD_MIN_LENGTH=4` (dev `.env.local` is set this way). New deployments should use `8` or higher.
- NOTE: changing `NEXT_PUBLIC_*` requires `npm run build` (it is inlined at build time).
- Printable ASCII only: `^[\x20-\x7E]*$`. Full-width / non-ASCII (e.g. JA chars, e-acute) is rejected with 400.
- UI (`filelistcontents.tsx`) enforces the same minimum via `getPasswordMinLength()`.

### API

- `POST /api/file-content/encrypt`, `PUT /api/file-content/put`: accept optional `mode: "snc1" | "bf01"`, respond with `mode` actually used.
- `POST /api/file-content/get`, `POST /api/file-content/decrypt`: auto-detect by magic, respond with `enc: "snc1" | "bf01" | null`. Old clients ignore the extra field, so this is backward compatible.

### UI

- `.chi` editor header (`fileedit.tsx`) shows a badge only for encrypted files: green `SNC1` for new files, amber `BF01 (legacy)` for old files.
- Implementation note: `src/app/api/file-content/snc_crypto.ts` is server-only (`node:crypto`). Shared settings (`SncWriteMode` / `getDefaultWriteMode` / `resolveWriteMode` / `isAsciiPassword`) live in `src/app/utils/constants.ts`.

## Docker

It's easy to build with Docker.
Just get Google authentication and create a .env.local file.
Then it should be easy to start.

```bash
mkdir sharedcryptnote
cp Dockerfile sharedcryptnote/.
cp docker-compose.yml sharedcryptnote/.
cd sharedcryptnote
vi .env.local
docker compose up
```

## Getting Started
First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

