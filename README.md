# InterestMatch v1.8 — Ultimate Social Match Upgrade

InterestMatch is a Telegram matching/social discovery bot with gender-aware discovery, rich profiles, interest matching, quick match, mutual matches, trending people, custom matching and private bot-relayed chat.

## v1.8 additions
- Who Liked You inbox
- Rewind latest pass
- VIP feature/status screen and admin VIP assignment service
- Online/offline activity indicator
- Verified/VIP profile badges
- Multi-photo profile gallery storage using Telegram profile photos
- Admin report review/resolution workflow
- `/liked`, `/rewind`, `/vip`, `/reports` commands
- Existing Boy → Girl / Girl → Boy matching rules preserved
- Existing success/primary/danger button styles and menu image preserved

## Setup
```powershell
npm install
npm run migrate
npm run seed
npm test
npm start
```

Set `BOT_TOKEN`, `ADMIN_IDS`, and other values in `.env`. The default menu image is the requested Catbox image and can be overridden with `MENU_IMAGE_URL`.

## v1.9.0 upgrades
- 💘 Guided **Find My Perfect Match** flow with age, interests and ideal-match text.
- 🔥 Trending modes: Most Liked, Most Matched, Most Active and Rising.
- 🌎 Nearby matching toggle using the user's saved country.
- 🕘 Match activity history for likes, super likes and passes.
- 👑 VIP gates for Who Liked You, Rewind and Super Likes.
- 🚨 Structured report reasons for spam, inappropriate content, fake profiles, scams and harassment.
- 💬 Media relay for photos, videos, voice, audio, documents, stickers and animations after a connection.
- 🔁 Safer mutual-match handling can reopen a previously declined connection.
