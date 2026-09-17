# Admin Hub Games — Game Development Handoff

**Inspection date:** 2026-09-17  
**Repository:** `gatshaayanda/admin-hub-games`  
**Default branch:** `main`  
**Purpose:** carry the foundation directly into the first playable Admin Hub Games world without rebuilding setup.

## 1. Current state

The foundation is established and the first playable world vertical slice now exists.

Current stack:

- Vite 8
- TypeScript 6
- Phaser 4
- Vitest
- Firebase 12
- Vercel deployment target
- Browser-first / PWA-capable architecture
- 960 × 540 Phaser base canvas with `Phaser.Scale.FIT`

The project is intentionally not tied to one game. The first world is a **meta game-making world** that can grow alongside future titles.

## 2. Current player experience

```text
OPEN LINK / APP
      ↓
BootScene
      ↓
PublisherIntroScene
      ↓
ADMIN HUB GAMES / presents
      ↓
NameEntryScene
      ↓
GameShellScene
      ↓
TOP-DOWN ADMIN HUB GAMES WORLD
      ↓
WANDER
      ↓
DISCOVER VILLAGES
      ↓
LEAVE IDEAS / NOTES
      ↓
GAMEBOOK
```

The publisher intro remains a recurring cinematic opening. The world is now the first actual playable experience after name entry.

## 3. World concept

The game is a relaxed, top-down exploration world representing the Admin Hub Games creative universe.

The player controls a small avatar representing their presence in the world. The character can wander between themed villages that represent game-system families.

Current villages:

- Story Village
- Adventure Village
- Management Village
- Strategy Village
- Arcade Village
- Simulation Village
- Puzzle Village
- Chess House
- Home / Studio

The design intent is **meta but playable**: the player is exploring the same kinds of systems they are learning to build. The world itself becomes a visual game-idea notebook.

## 4. First vertical slice implemented

`GameShellScene` now provides:

- large top-down world beyond the camera viewport
- camera follow and world bounds
- avatar movement with WASD / arrow keys
- tap-to-walk on touch devices
- explore/interact button for mobile
- themed system villages
- Chess House as the connection between the player's real chess interest and the game world
- discovery panels for villages
- persistent Gamebook notes via browser local storage
- `B` to open the Gamebook
- `E` / tap to explore nearby locations
- player name carried from `NameEntryScene`
- simple procedural ambient sound that is optional and never blocks gameplay
- reusable chunky Botswana-inspired visual language from the publisher intro

This is intentionally a **small vertical slice**, not a finished world.

## 5. Design direction

The intended feel is:

> **“Let me just walk around for five minutes.”**

It should be calm, curious, slightly adventurous and personal.

The world should reward wandering rather than constantly demanding objectives.

Creative principle:

> **Start local → make it globally understandable.**

Use Botswana-inspired details without turning the world into a generic stereotype or a corporate “African” theme.

## 6. Gamebook concept

The Gamebook is a core meta mechanic.

When the player discovers a village, its system note is saved locally. Future development can turn this into a richer notebook where the player can write their own game ideas, revisit discoveries and eventually connect notes to playable games.

Long-term concept:

```text
PLAYER IDEA
     ↓
GAMEBOOK NOTE
     ↓
SYSTEM VILLAGE
     ↓
GAME PROTOTYPE
     ↓
PLAYABLE GAME
     ↓
WORLD EXPANDS
```

## 7. Chess connection

The Chess House is deliberately part of the first world rather than a separate menu item.

It is intended as a subtle bridge between:

```text
real player
    ↓
real chess activity
    ↓
Chess.com / BoardSignal
    ↓
Admin Hub Games world
    ↓
avatar + Chess House
```

Do not invent live Chess.com data inside the game yet. The first slice only establishes the thematic connection. A future integration can be added when it has a clear gameplay purpose.

## 8. Publisher intro contract

The publisher identity remains a product requirement:

> **ADMIN HUB GAMES appears once, clearly, then gets out of the way and lets the game happen.**

The intro should feel like a real game opening, not a website splash screen.

Current fixed sequence:

- dark/world fade: 1.0s
- character entrance: 4.2s
- arrival pause: 0.7s
- publisher reveal: 0.85s
- publisher identity hold: 3.4s
- publisher fade: 1.0s
- transition: 0.7s

No incidental keyboard/pointer skip handlers should be reintroduced.

## 9. Foundation architecture

Keep the conceptual separation:

```text
PLAYER INPUT
      ↓
GAME RULES / STATE
      ↓
PHASER RENDERS STATE
```

Do not turn the project into a giant custom engine.

Build reusable systems when real games prove that they should be reusable.

Likely future shared systems from the world:

- avatar state
- movement
- collision
- interactables
- locations
- environmental storytelling
- discovery/progression
- notebook/Gamebook
- ambience/audio
- save/load
- settings
- touch controls
- accessibility

## 10. Firebase

Firebase is initialized centrally from `src/firebase/firebase.ts`.

Dedicated project:

- Project ID: `admin-hub-games`
- Auth domain: `admin-hub-games.firebaseapp.com`
- Storage bucket: `admin-hub-games.firebasestorage.app`

Do not copy another game's Firebase project configuration into this repository.

## 11. PWA follow-up

The repository has favicon and manifest metadata, but the earlier inspection identified that the files were at repository root rather than Vite's conventional `public/` location.

This remains a verification item. Confirm `/favicon.svg` and `/manifest.webmanifest` on the deployed Vercel build before calling PWA metadata production-verified.

This does not block world/game development.

## 12. Verification status for the first world slice

Source inspection: **completed**.

World implementation: **committed to GitHub**.

Latest world commit:

`82d07373a8f4e8faafd87f37b1669307dbf3ca27`

`feat: turn game shell into first Admin Hub Games world slice`

A local production build could not be executed from this inspection environment because outbound network/DNS access to GitHub was unavailable, so the new TypeScript has **not** been falsely marked as locally build-verified.

Next local station checkpoint should run:

```text
npm ci
npm run build
npm test
```

Then push/deploy and visually inspect the live Vercel build.

## 13. Next development direction

Do not rebuild the foundation.

Continue the world in small playable slices:

```text
CURRENT
  ↓
world + avatar + villages + Gamebook
  ↓
NPCs / ambient life
  ↓
better interactions
  ↓
real editable notes
  ↓
Chess House connection
  ↓
first embedded mini-game
  ↓
Mhele
  ↓
Lode Runner-style game
  ↓
world grows with every game made
```

The next meaningful goal is **more life and discovery**, not a giant map.

## 14. Owner workflow

**START → BUILD → VERIFY → CHECKPOINT → CONTINUE / RECOVER**

- GitHub is source of truth.
- VS Code + Git Bash is the normal local workflow.
- Avoid PowerShell.
- Localhost is for development/debugging.
- Push meaningful visual checkpoints and verify the Vercel deployment.
- Do not ask the owner for screenshots when browser/live verification can be performed another way.
- Unexpected results should stop the workflow rather than being patched blindly.
