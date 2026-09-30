# Feature F50 -- Galeria do Rafa

**Status:** planned
**Owner:** @architect
**PRD:** inline (B-35)
**Backlog:** B-35 (Galeria do Rafa: blocos, placas e inimigos com desenhos importados)
**Depends on:** F37 (LevelData v2 + Editor com Entidades) -- completed and merged into homolog.

## Goal

Allow players to upload custom images (PNG/JPG) in the level editor that become "custom block" textures and "sign with drawing" content. Images are resized to 64x64 and pixelated on the client before upload. Stored as base64 data URIs inside the level's JSON data (no external storage service needed). Kid-safe: upload requires a logged-in (non-guest) account, and custom images are private by default -- they appear only in the creator's own levels.

## Problem

The editor palette is limited to the 11 built-in block types with procedurally generated textures. There is no way to add custom visuals to blocks or signs. The Rafa-drawn coin sprite (F24/F28) proved that kid-made art inside the game is a powerful engagement tool, but there is no pipeline for importing arbitrary images into levels. Without this, levels all look the same and the creative/personal dimension of level-building is missing.

## Architecture Decision: base64 inside LevelData JSON

**Why base64 in the level JSON (not S3, not Render disk)?**

1. **No new infrastructure:** Render free tier has no persistent disk for the API service (it is a web service, not a background worker). S3 would require an AWS account, IAM keys, and a new dependency (`@aws-sdk/client-s3`). Both add operational complexity disproportionate to the feature.
2. **Data locality:** Images are 64x64 pixels, pixelated. A PNG at that size is 2-5 KB; a base64 data URI adds ~33% overhead, so 3-7 KB per image. With a cap of 10 custom assets per level, the worst case is ~70 KB added to the level JSON -- well within Prisma's JSONB capacity and Fastify's default body limit.
3. **Simplicity:** The level is fully self-contained. No broken image links, no CORS, no CDN, no cleanup of orphaned files. Loading a level loads all its custom assets in a single GET.
4. **Privacy by default:** Since images live inside the level data, they are only served when someone loads that specific level. Combined with the `published` flag and the planned kid-safe allowlist (B-28), this provides adequate privacy without an approval workflow for now.

**Limits enforced:**
- Max 10 custom assets per level (`LevelDataV2.customAssets.length <= 10`)
- Max image size before encoding: 64x64 (enforced client-side by canvas resize)
- Max encoded string length per asset: 15 KB (safety net on the backend)
- Total level JSON size validated to stay under 500 KB (backend body limit)

## New Types (`packages/shared/src/types.ts`)

```typescript
// Custom asset for Galeria do Rafa
export interface CustomAsset {
  id: string;           // unique ID within the level, e.g. "custom-1695000000"
  name: string;         // user-given name, max 20 chars
  dataUri: string;      // base64 data URI, e.g. "data:image/png;base64,..."
}

// Added to LevelDataV2:
export interface LevelDataV2 {
  // ... existing fields ...
  customAssets?: CustomAsset[];  // max 10 per level
}

// New block type
export type BlockType = /* existing types */ | "custom";

// EntityData props extension for signs:
// { type: "sign", x, y, props: { customAssetId: "custom-xxx" } }
```

## New Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/game/editor/ImageUploader.tsx` | React component: file input + canvas 64x64 resize + pixelation + preview + name input. Returns `CustomAsset`. |
| `packages/frontend/src/game/editor/CustomAssetPalette.tsx` | Sub-palette inside EditorUI "Custom" tab: shows uploaded assets as clickable thumbnails, add/remove buttons, limit indicator (N/10). |
| `packages/frontend/src/game/systems/CustomTextureCache.ts` | Manages THREE.CanvasTexture instances created from base64 data URIs. Provides `getCustomTexture(dataUri): THREE.CanvasTexture` with lazy creation and disposal. |
| `packages/backend/src/validation/customAssetValidation.ts` | Validates custom assets array: max 10 items, each dataUri starts with `data:image/`, length <= 15000 chars, name length <= 20 chars. |

## Modified Files

| File | Change |
|------|--------|
| `packages/shared/src/types.ts` | Add `CustomAsset` interface; add `customAssets?: CustomAsset[]` to `LevelDataV2`; add `"custom"` to `BlockType` union; add `"custom"` to `BLOCK_PROPERTIES` (solid, non-destructible). |
| `packages/shared/src/levelMigration.ts` | Handle `customAssets` field: default to `[]` if missing in v2 data. |
| `packages/frontend/src/game/scenes/EditorUI.tsx` | Add 4th tab "Custom" to `PaletteTab` union. Tab shows `CustomAssetPalette` with upload button and asset thumbnails as selectable tools. Add `"custom_block"` and `"custom_sign"` to `EditorTool` union. |
| `packages/frontend/src/game/scenes/EditorWrapper.tsx` | Manage `customAssets` state array. Pass it to `EditorUI` and `EditorScene3D`. Include `customAssets` in `buildLevelDataV2()`. When loading a saved level for editing, populate `customAssets` from the level data. |
| `packages/frontend/src/game/scenes/EditorScene3D.tsx` | When rendering a block with `type === "custom"`, use `CustomTextureCache` to get the texture from the custom asset's dataUri. When rendering a sign entity with `props.customAssetId`, display the custom image on the sign face. |
| `packages/frontend/src/game/systems/BlockTextures3D.ts` | Add `"custom"` entry to `BLOCK_VISUALS` (fallback color). Add `getCustomBlockMaterials(dataUri)` function that creates materials from a data URI texture instead of the procedural texture. |
| `packages/backend/src/validation/levelValidation.ts` | Add validation for `customAssets` array when present: max 10, valid data URIs, max length per item, valid names. Add `"custom"` to `VALID_BLOCK_TYPES`. |
| `packages/backend/src/routes/levels.ts` | Add auth check: reject level save with custom assets if the player is a guest (`isGuest === true` or `local-*` / `dev-*` ID patterns). Return 403 with message "Crie uma conta para usar imagens personalizadas". |

## Key Design Decisions

1. **"custom" block type:** A single new entry in the `BlockType` union. The specific custom asset is identified by the block's grid position: an entity of type `"custom_block_asset"` at the same (x,y) links to a `customAssetId` (same pattern as `item_block_content`). This avoids adding unlimited block types to the union.

2. **Sign with drawing:** The existing `sign` entity type gains an optional `props.customAssetId`. When present, the sign renders the custom image instead of (or alongside) text. This reuses the entity system from F37.

3. **Client-side pixelation:** The `ImageUploader` component draws the uploaded image onto a 64x64 canvas using `imageSmoothingEnabled = false` (nearest-neighbor). The user sees the pixelated preview before confirming. This ensures all custom art matches the voxel aesthetic and keeps file sizes small.

4. **No approval workflow (yet):** Custom images are private by default -- they appear only in the creator's own levels. The `published` flag on levels already controls visibility. A future approval pipeline (B-28) can add moderation before images appear in public levels. For now, this is sufficient for family/friends use.

5. **Guest restriction:** Only logged-in (non-guest) accounts can upload images. This prevents anonymous abuse and gives a natural moderation handle (ban account = remove all their custom content). The backend enforces this by checking auth on level save when `customAssets` is non-empty.

## Waves

- **Wave 0**: F50-T01, F50-T02  (Shared types + Backend validation -- independent foundations)
- **Wave 1**: F50-T03, F50-T04  (ImageUploader component + CustomTextureCache -- independent frontend pieces)
- **Wave 2**: F50-T05, F50-T06  (Editor integration + Game rendering -- depend on all above)

### Dependency Graph

```
T01 (shared types + migration) ────────┬──> T05 (Editor UI + Wrapper integration)
                                        │
T02 (backend validation + auth gate) ───┤
                                        │
T03 (ImageUploader component) ──────────┤
                                        │
T04 (CustomTextureCache) ──────────────┴──> T06 (Game rendering: custom blocks + signs)
```

## Global Acceptance Criteria

- [ ] `CustomAsset` interface exported from `@super-mel/shared`
- [ ] `"custom"` added to `BlockType` union and `BLOCK_PROPERTIES`
- [ ] `customAssets?: CustomAsset[]` field exists in `LevelDataV2`
- [ ] `migrateLevelData()` defaults `customAssets` to `[]` for existing data
- [ ] ImageUploader accepts PNG/JPG, resizes to 64x64, pixelates, and returns a `CustomAsset`
- [ ] ImageUploader shows a pixelated preview before confirming
- [ ] Editor palette has a 4th "Custom" tab with uploaded asset thumbnails
- [ ] Clicking a custom asset thumbnail selects it as the active tool (custom block or custom sign)
- [ ] Custom blocks render in the editor with the uploaded texture
- [ ] Custom blocks render in gameplay with the uploaded texture
- [ ] Sign entities with `customAssetId` display the custom image
- [ ] Max 10 custom assets per level (enforced client-side and backend)
- [ ] Max 64x64 image resolution (enforced client-side)
- [ ] Max 15 KB per data URI (enforced backend)
- [ ] Backend rejects level save with custom assets from guest accounts (403)
- [ ] Backend validates `customAssets` array structure on POST/PUT
- [ ] Loading a saved level in the editor restores custom assets in the palette
- [ ] `"custom"` block type in `VALID_BLOCK_TYPES` (backend validation)
- [ ] No regressions in editor, gameplay, level save/load, or infinite mode
- [ ] TypeScript compiles with no errors across all packages

## Diagrams

- `docs/diagrams/F50-architecture.mmd` -- Custom asset data flow: upload -> resize -> base64 -> LevelDataV2 -> rendering pipeline
- `docs/diagrams/F50-journey.mmd` -- User journey: open editor -> Custom tab -> upload image -> name it -> place custom block/sign -> save -> play
