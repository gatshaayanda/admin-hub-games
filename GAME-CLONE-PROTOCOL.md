# GAME-CLONE-PROTOCOL.md

## Purpose

This file exists so the Admin Hub Games base can be cloned into a new catalog game without losing the workflow, publisher identity or hard-won mobile foundation.

## The rule

Clone gatshaayanda/admin-hub-games. Do not run npm create vite for the new title, start from a blank Phaser project, or copy an old game's repo as the new base.

The canonical base is the latest production checkpoint of this repository.

## What the clone inherits

- Admin Hub Games publisher intro
- player/name handoff
- Phaser boot and scene structure
- responsive full-viewport behavior
- mobile joystick/action conventions
- desktop keyboard controls
- local player identity
- optional Firebase identity/shared-world hooks
- Gamebook foundation
- audio foundation
- GitHub/Vercel workflow
- START → BUILD → VERIFY → CHECKPOINT → CONTINUE / RECOVER

The actual game replaces the game layer. The clone does not have to keep the Admin Hub Games meta-world.

## First actions after cloning

1. Inspect AGENTS.md, this file, package.json, src/main.ts, scene list, Git state and deployment setup.
2. Rewrite AGENTS.md immediately so it reads as the new game's own contract.
3. Preserve the inherited publisher foundation and workflow, but document the new game's identity, genre, core loop, rules, state, scenes, controls, assets, save/data model, Firebase needs, current vertical slice, known issues and production target.
4. Do not pay a verification tax. The base is already a production checkpoint. Start building the real game.
5. When the first produced version is ready, review the diff, push to GitHub, let Vercel produce the live checkpoint, then do the appropriate release verification.

## New-game verification rule

Do not run tests/builds merely because the repo was cloned. Run them when a release candidate is ready, shared foundation code changes, dependencies/configuration change, or a real bug needs a deterministic check.

## Starting prompt

START. This repo is a clone of the Admin Hub Games canonical game base. Read AGENTS.md and GAME-CLONE-PROTOCOL.md first. Inspect the actual repository and Git state. Then rewrite AGENTS.md into the project-specific contract for [GAME TITLE]. Preserve the inherited Admin Hub Games publisher foundation and workflow, but document the new game's rules, core loop, scenes, controls, assets, save model, Firebase needs, current slice and production target. Do not create a new engine or restart from Vite. Do not run a test/build ceremony before the first playable implementation. Build the actual game first. Use START → BUILD → VERIFY → CHECKPOINT → CONTINUE / RECOVER. Unexpected result = STOP → inspect reality → then act.

## Feedback into the canonical base

When a new game proves a reusable improvement, identify the shared system, confirm that more than one real game can benefit, then update this canonical repository deliberately. Do not make the base depend on one game's rules.