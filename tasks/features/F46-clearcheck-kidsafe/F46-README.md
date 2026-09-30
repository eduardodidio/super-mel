# F46 -- Clear Check + Comunidade Kid-Safe

**Status:** done
**Owner:** @architect
**PRD:** inline (B-26 + B-28)
**Backlog:** B-26 (Clear check + codigo de fase + estatisticas), B-28 (Comunidade kid-safe)
**Depends on:** F42 (Fim de fase + Checkpoints) -- MUST be completed first. This feature uses the level completion flow (goal entity, `completeLevel()`, `"levelclear"` scene) from F42.

## Goal

Make community level sharing safe and functional for a kid audience. Require creators to clear their own level before publishing (clear check), assign each published level a 6-character shareable code, track play/clear statistics per level, auto-label difficulty by clear rate, add stamp-only reactions, word-filtered level names, a report button, and a Family Mode that restricts browsable levels to an allowlist of approved creators (plus any level accessed via code).

## Problem

Currently, anyone can publish a level via the editor without ever testing it, meaning impossible or trivial levels flood the community list. There is no shareable code -- players must browse the full list to find a friend's level. There are no play/clear statistics, no difficulty labels, no reactions, no name moderation, and no safety net for a kid-facing public URL. The `LevelSelectScene3D` shows all published levels with no filtering, sorting, or safety layer.

## Architecture

### Prisma Schema Changes (Migration)

Add fields to `Level` model:

```prisma
model Level {
  // ... existing fields ...
  code       String?   @unique @db.VarChar(6)
  plays      Int       @default(0)
  clears     Int       @default(0)
  bestTime   Int?      @map("best_time")
  cleared    Boolean   @default(false)
  approved   Boolean   @default(false)
}
```

New models:

```prisma
model LevelAttempt {
  id        String   @id @default(uuid()) @db.Uuid
  levelId   String   @map("level_id") @db.Uuid
  playerId  String   @map("player_id") @db.Uuid
  cleared   Boolean  @default(false)
  time      Int?
  createdAt DateTime @default(now()) @map("created_at")

  level  Level  @relation(fields: [levelId], references: [id], onDelete: Cascade)
  player Player @relation(fields: [playerId], references: [id])

  @@map("level_attempts")
}

model LevelReaction {
  id        String   @id @default(uuid()) @db.Uuid
  levelId   String   @map("level_id") @db.Uuid
  playerId  String   @map("player_id") @db.Uuid
  stamp     String   @db.VarChar(10)
  createdAt DateTime @default(now()) @map("created_at")

  level  Level  @relation(fields: [levelId], references: [id], onDelete: Cascade)
  player Player @relation(fields: [playerId], references: [id])

  @@unique([levelId, playerId])
  @@map("level_reactions")
}

model LevelReport {
  id        String   @id @default(uuid()) @db.Uuid
  levelId   String   @map("level_id") @db.Uuid
  playerId  String   @map("player_id") @db.Uuid
  reason    String   @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")

  level  Level  @relation(fields: [levelId], references: [id], onDelete: Cascade)
  player Player @relation(fields: [playerId], references: [id])

  @@unique([levelId, playerId])
  @@map("level_reports")
}
```

Update `Player` model to add relations:

```prisma
model Player {
  // ... existing ...
  attempts  LevelAttempt[]
  reactions LevelReaction[]
  reports   LevelReport[]
}
```

### Backend Route Changes

**`routes/levels.ts`** -- major expansion:
- `GET /` -- accept query params `sort` (new/popular), `familyMode` (boolean), `approved` filter; return `plays`, `clears`, `clearRate`, `difficulty` label, `code`
- `GET /code/:code` -- lookup level by 6-char code
- `PUT /:id` -- when `published: true` is sent, verify `cleared === true` on the level (clear check gate); generate unique 6-char `code` on first publish
- `POST /:id/attempt` -- record a play attempt; increment `plays` on the level; if `cleared: true`, increment `clears` and update `bestTime`
- `POST /:id/reaction` -- upsert a stamp reaction (paw/heart/bone/star); one per player per level
- `POST /:id/report` -- record a report; one per player per level
- `GET /:id/reactions` -- get reaction counts per stamp for a level

**New `routes/community.ts`** (optional, or inline in levels.ts):
- `GET /api/community/allowlist` -- returns list of approved creator IDs (hardcoded or from DB)

### Frontend Changes

**`EditorUI.tsx` / `EditorWrapper.tsx`**:
- Level name input with word filter (client-side blocklist check before save)
- SALVAR button gated: disabled until `cleared === true` (creator beat their own level in test mode)
- After save+publish, display the level code for sharing
- Visual indicator of clear check status: "Voce precisa zerar sua fase para publicar"

**`LevelSelectScene3D.tsx`**:
- Add "Buscar por codigo" input field at the top
- Display `plays`, `clears`, difficulty badge (Easy/Normal/Hard/Extreme) per level card
- Sorting tabs: "Novas" (by date) and "Populares" (by plays)
- Family Mode toggle (default ON for guests): filters to `approved === true` levels only
- Stamp reaction row per level (paw/heart/bone/star) with count + clickable
- "Denunciar" button per level

**`AuthScreen.tsx`**:
- Family Mode default ON for "Visitante" tab; show toggle in settings

### Key Design Decisions

1. **Clear check as server gate:** The `PUT /:id { published: true }` route refuses unless `level.cleared === true`. The `cleared` flag is set by the editor test mode flow: after the creator reaches the goal in test mode, the frontend PUTs `{ cleared: true }` to the level. This prevents bypassing via direct API calls by requiring the level to be saved first (with `cleared: false`), then tested, then updated with `cleared: true`, and only then published.

2. **6-char alphanumeric code:** Generated server-side on first publish using uppercase letters + digits (excluding confusable chars: 0/O, 1/I/L). 32^6 = ~1 billion possible codes -- more than enough. Unique constraint prevents collisions (retry on conflict).

3. **Difficulty auto-label:** Calculated from clear rate at read time, not stored:
   - `clears === 0 && plays >= 5` => "Extremo"
   - `clearRate >= 0.5` => "Facil"
   - `clearRate >= 0.2` => "Normal"
   - `clearRate >= 0.05` => "Dificil"
   - `clearRate < 0.05` => "Extremo"
   - `plays < 5` => no label yet

4. **Family Mode:** Default ON for guests. When ON, `GET /api/levels` filters by `approved === true`. Levels accessed by code bypass Family Mode (the parent shared the code, implicit trust). The allowlist is a simple `approved` boolean on the Level model, manually set by the admin.

5. **Stamp reactions (not text):** Only 4 stamps: paw, heart, bone, star. One reaction per player per level (upsert). No text comments. Kid-safe by design.

6. **Word filter:** Client-side blocklist of ~200 Portuguese bad words. Applied to level names before save. Not a substitute for moderation, but a first barrier. The `report` button handles the rest.

7. **Attempt tracking:** Each time a player starts a level, POST `/api/levels/:id/attempt` with `{ cleared: false }`. On level clear, PUT the attempt with `{ cleared: true, time }`. This gives per-player attempt history and feeds the level stats.

## Waves

| Wave | Tasks | Rationale |
|------|-------|-----------|
| 0 | F46-T01 | Prisma migration -- all backend tasks depend on the new schema |
| 1 | F46-T02, F46-T03 | Parallel: backend clear-check + attempt routes, backend reactions + reports routes (different route concerns) |
| 2 | F46-T04, F46-T05 | Parallel: editor clear-check UI, level-select UI overhaul (different frontend files) |
| 3 | F46-T06, F46-T07 | Parallel: Family Mode + word filter, code lookup + sharing flow (cross-cutting, depend on T02-T05) |

### Dependency Graph

```
T01 (Prisma migration) ──────┬──> T02 (Clear check + attempt routes)
                              │
                              ├──> T03 (Reactions + reports routes)
                              │
T02 ──────────────────────────┼──> T04 (Editor clear-check UI)
                              │
T02 + T03 ────────────────────┼──> T05 (Level select UI overhaul)
                              │
T02 + T04 + T05 ──────────────┼──> T06 (Family Mode + word filter)
                              │
T02 + T05 ────────────────────┴──> T07 (Code lookup + sharing flow)
```

## Global Acceptance Criteria

- [ ] Prisma schema has `code`, `plays`, `clears`, `bestTime`, `cleared`, `approved` on Level model
- [ ] `LevelAttempt`, `LevelReaction`, `LevelReport` models exist with proper relations
- [ ] Migration runs without data loss on existing levels
- [ ] `PUT /api/levels/:id { published: true }` returns 400 if `cleared !== true`
- [ ] Creator must reach the goal in test mode before SALVAR/PUBLICAR is enabled
- [ ] Published levels get a unique 6-char code (uppercase alphanumeric)
- [ ] `GET /api/levels/code/:code` returns the level data
- [ ] Each play attempt is tracked via `POST /api/levels/:id/attempt`
- [ ] Level clears update `plays`, `clears`, and `bestTime` on the Level
- [ ] Difficulty label (Facil/Normal/Dificil/Extremo) is derived from clear rate
- [ ] Level select shows plays, clears, difficulty badge per level card
- [ ] Level select has "Novas" and "Populares" sort tabs
- [ ] Level select has "Buscar por codigo" input
- [ ] Stamp reactions work: paw, heart, bone, star (one per player per level)
- [ ] Report button works: one per player per level
- [ ] Level names are validated against a word filter before save
- [ ] Family Mode (default ON for guests) filters levels to approved creators only
- [ ] Levels accessed by code are playable regardless of Family Mode
- [ ] Editor shows clear-check status message and gates the publish button
- [ ] After publish, editor shows the level code for sharing
- [ ] No regressions in existing editor save/test flow, level select, or auth
- [ ] TypeScript compiles with no errors

## Diagrams

- `docs/diagrams/F46-architecture.mmd` -- Schema additions, route topology, frontend component changes
- `docs/diagrams/F46-journey.mmd` -- Creator journey (edit -> test -> clear check -> publish -> share code) and player journey (browse/search by code -> play -> react -> report)
