# Admin Hub Games — Current Foundation Handoff

Inspection checkpoint: 2026-09-18
Repository: gatshaayanda/admin-hub-games
Branch: main
Current production checkpoint: f56178823f362f7f319c09853b82373d6e338cc6

## What this repository is

This is the canonical Admin Hub Games game base. It is both the playable Admin Hub Games meta-world and the production starting point for future catalog games.

Do not start a new catalog game from a blank Vite/Phaser project.

## Current player flow

BOOT → publisher cinematic → name / player identity → Admin Hub Games world → walk / tap-to-walk / joystick → discover a village or house → EXPLORE → interaction modal → close → keep walking.

The first-playthrough flow is the primary quality gate before expanding the world.

## Current foundation

- Vite 8
- TypeScript 6
- Phaser 4
- Vitest available, with zero-test runs allowed
- Firebase 12
- Vercel
- Phaser Scale RESIZE
- mobile joystick and action controls
- anonymous Firebase identity when shared features are used
- local player name
- private Gamebook
- World Notes
- recurring publisher intro
- no custom engine

Phaser documents RESIZE as filling the available parent area regardless of aspect ratio.

## Corrections in this checkpoint

- Firebase profile persistence no longer blocks the name-to-world transition.
- landmark taps no longer teleport the player; discovery stays a walking interaction.
- desktop tap-to-walk no longer loses a mobile-only bottom dock.
- mobile no longer gets a duplicate Phaser Gamebook button beside the native BOOK control.
- Vitest no longer fails a new catalog title simply because it has no tests yet.
- browser theme color now follows the publisher indigo identity.
- the PWA manifest belongs under Vite public static assets.

## Deep inspection backlog

P0 — first-playthrough polish:
- real-phone verification of welcome → name → world → walk → discover → explore → close → continue;
- better player animation than the current two-pose procedural animation;
- remaining modal and keyboard/viewport polish;
- more life and discovery without making a giant map.

P1 — foundation correctness:
- scope World Notes reads by villageId and bound the result set;
- validate local Gamebook JSON before accepting it as state;
- decide whether browser prompt() should become an in-game note editor;
- consolidate the active global audio path and unused GameShell audio methods;
- handle audio visibility/lifecycle;
- deploy and verify Firestore rules from source;
- verify anonymous Auth and shared-world behavior on the deployed project.

P2 — PWA/catalog release:
- add service-worker/offline behavior when installable PWA behavior is ready;
- verify manifest/icon/theme from the deployed URL;
- define shared catalog metadata and per-game checkpoint metadata.

P3 — reusable systems only when real games justify them:
- collision/path blocking;
- interactables, dialogue and quests;
- grid/board systems;
- inventory, timers, score and progression;
- level loading and shared settings/save abstractions.

Do not turn this into a custom engine prematurely.

## New-game workflow

CLONE KNOWN-GOOD BASE → WRITE PROJECT-SPECIFIC AGENTS.md → BUILD COMPLETE FIRST PLAYABLE GAME → REFINE → PUSH → LIVE VERCEL CHECKPOINT.

A cloned title does not need a test/build ceremony before creative implementation. Verification remains a release gate and a response to foundation/dependency changes or real bugs.

## Source-of-truth workflow

START → inspect actual reality and AGENTS.md → BUILD one controlled slice → VERIFY when the slice/release requires it → CHECKPOINT in Git → CONTINUE / RECOVER.

Unexpected result = STOP → inspect reality → then act.

## Current publisher identity

Deep indigo / midnight blue, stars, restrained teal energy, warm gold, cream/white typography, fantasy-medieval plus subtle futuristic geometry. Individual games may have their own worlds and palettes.

## Clone documentation

GAME-CLONE-PROTOCOL.md explains the exact clone and AGENTS rewrite procedure.