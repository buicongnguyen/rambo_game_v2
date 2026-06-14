# Operation Iron Vengeance — V2

A browser-based retro run-and-gun built with Phaser 3.90 + TypeScript, inspired by jungle-era
military shooters (`Contra`, `Ikari Warriors`, `Mercs`, `Metal Slug`). This is **version 2** of
[rambo_game](https://github.com/buicongnguyen/rambo_game): same nine-stage campaign, rebuilt
physics, rendering, and game-state logic.

> **Version 3 is out — [play it](https://buicongnguyen.github.io/rambo_game_v3/) · [repo](https://github.com/buicongnguyen/rambo_game_v3).** v3 adds arcade sound, combos & rank, a pause/settings menu, extra juice, and gamepad support on this v2 engine.

## What's new in V2

Research and the full plan live in [docs/V2_PLAN.md](docs/V2_PLAN.md). Highlights:

### Physics rebuilt on the engine
- Bullets carry real arcade-body velocity integrated on a **120Hz fixed physics step** instead of
  being teleported per frame — no more tunneling through walls at low FPS, and trajectories are
  identical at 30/60/144Hz (drop, wind, and boost zones are expressed as px/s velocity shaping).
- Compact square bullet hitboxes replace 28x5 slivers that never rotated with travel direction.
- Vehicle exits compute clearance from body extents — v1's fixed 42px offset landed inside
  jeep/tank hitboxes and instantly re-boarded, permanently trapping the player.
- Jump is a real dodge: airborne i-frames against bullets and contact, a sine arc with a ground
  shadow, and vaulting damages soft cover instead of deleting it for free.
- Terrain (water/holes/high ground) slows enemies, allies, and vehicles — not just players.
- Hitboxes match visuals: tank raiders 80x48 world-space (was ~49x27), bosses sized to their
  drawn hulls (was a uniform 72x40 sliver).

### Background and camera fixed for good
- The backdrop paints exactly the world rectangle and a **zoom floor guarantees the camera can
  never see outside the painted world at any window size** — the v1 "background void after
  resize" bug class is closed by invariant, not by patches.
- Two parallax tile layers per theme add depth using the device-independent tilePosition pattern.
- Overlay text counter-scales against camera zoom (no more breathing objective plaque).
- The game boots only once its root element has a real size, and a ResizeObserver keeps the scale
  manager honest — CSS-driven layouts can resize without window events.

### Game-state hardening
- A one-way stage-outcome latch ends the v1 race where a lingering poison tick could flip
  "Mission Failed" into "Stage Clear" (or vice versa); the director rejects stale transitions.
- Rescue bunkers actually work now (a solid collider had made the rescue overlap unreachable —
  Shadow Squad's core mechanic was dead in v1).
- Lasers stop at the first obstacle; splash damage no longer double-dips the direct target;
  hit-flashes restore identity tints; zone-clear rewards no longer confiscate stockpiled bombs.
- Enemy spawns relocate out of cover; per-kind tuning lives in one data table
  ([src/game/data/enemyStats.ts](src/game/data/enemyStats.ts)).
- The DOM HUD builds once and patches values in place (v1 rebuilt innerHTML up to ~8x/s and ate
  Skip-button taps mid-press).

### Tests
24 vitest unit tests cover the extracted combat math (vehicle-exit clearance, segment clipping,
frame-rate-independent smoothing, the camera zoom floor) and stage-data invariants (trigger
ordering, spawn bounds, boss config consistency).

```bash
npm test
```

## What is implemented

- Nine staged missions with distinct briefings, bosses, and dual-boss finales
- Solo or Shadow Squad mode (rescue AI soldiers who follow, ride along, and fight)
- Top-down commando movement, auto-targeted shooting, 11 weapons with ammo pickups
- Enterable jeeps, tanks, and motorcycles with mounted weapons
- Enemy waves, turrets, rocketeers, scouts, zombies, and vehicle raiders
- Terrain effects, bullet-physics field zones, destructible cover with rewards
- Air-strike specials, stage clear / game over / campaign overlays, responsive HUD
- Touch controls with a virtual stick for mobile play

## Run it

```bash
npm install
npm run dev
```

Build for production (also type-checks):

```bash
npm run build
```

## Sprite assets

Generated sprite strips ship in `public/assets/sprites`. Per-frame dumps and preview contact
sheets are working references only and live in `assets_src/sprites`. Regenerate the pack with:

```bash
python scripts/generate_sprite_assets.py
```

## Android phone build

This project uses Capacitor to package the Vite/Phaser game as a native Android app.

```bash
npm install
npm run android:sync
npm run android:run
```

For a physical phone, enable Developer Options and USB debugging, connect over USB, accept the
RSA prompt, then run `npm run android:run`. To work from Android Studio instead, run
`npm run android:open`. Command-line builds need Java and the Android SDK available to Gradle.

The Android app id is `com.operationironvengeance.game`, with bundled web assets copied from
`dist`. See [docs/ANDROID_LOCAL_SETUP.md](docs/ANDROID_LOCAL_SETUP.md) for APK build, install,
emulator, and GitHub Release instructions.

## Design direction (from v1)

The original NES `Rambo` is a single-player action-adventure; the stronger gameplay DNA for this
brief is `Contra` (stage pressure and bosses), `Ikari Warriors` and `Mercs` (military top-down
assault flow), and `Metal Slug` (readable chaos and boss silhouettes).

- [Rambo (1987 NES) on Wikipedia](https://en.wikipedia.org/wiki/Rambo_%281987_video_game%29)
- [Contra (1987) on Wikipedia](https://en.wikipedia.org/wiki/Contra_%28video_game%29)
- [Ikari Warriors on Wikipedia](https://en.wikipedia.org/wiki/Ikari_Warriors)
- [Mercs on Wikipedia](https://en.wikipedia.org/wiki/Mercs)
- [Metal Slug on SNK](https://www.snk-corp.co.jp/us/games/acaneogeo/metalslug/)

## Next production steps

- Replace generated shapes with authored pixel art and sprite animation
- True simultaneous local two-player (Shadow Squad mode is the current co-op offering)
- Object pooling for projectiles; gamepad support; pause/settings screens
- Phaser 4 migration once the prototype stabilizes
