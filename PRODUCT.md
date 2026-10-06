# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed on Vercel. Upstash Redis for storage (local JSON file fallback in development). GitHub OAuth and Google OAuth are hand-written (no auth framework). Installable as a PWA. Font: Plus Jakarta Sans. Icons: react-icons. User-chosen.

## Users

One person: the owner of many Google accounts (each with its own Drive). Signs in with their GitHub account (the "parent" account); nobody else may get in. Checks the app mostly from their phone.

## Product Purpose

One place to watch every Google Drive account: how full each one is, which apps the owner has linked to each email, and the account passwords, which are kept encrypted. Success = the owner can see at a glance which account is near full, and can reach any account's credentials or Google settings in a few taps from the phone.

## Positioning

Personal, single-owner control panel. Passwords are encrypted in the browser with a key built from a master password plus a secret that only exists on the enrolled phone, so the server (Vercel, Redis) only ever holds ciphertext, and a laptop cannot open the vault even with the master password.

## Operating Context

- Owner opens the app on the phone, often quickly, to check storage or copy a password.
- Each Google account is connected once via Google OAuth (scope `drive.file` + profile); the server keeps an encrypted refresh token and reads `about.storageQuota`.
- Phone-number changes are done in Google's own pages: the app lists every account, opens the right Google page per account (`authuser=email`), and tracks which are done.
- Connected third-party apps: Google offers no API for personal accounts, so the list is kept by the owner per account, with a shortcut to Google's "Connections" page.

## Capabilities and Constraints

- Storage stats per account: usage, limit, Drive vs trash, with daily snapshots for trend.
- Encrypted password vault (AES-256-GCM, PBKDF2 600k + device secret via HKDF). Recovery code shown once at setup.
- Per-account profile: nickname, note, mascot avatar picked from ipaslogo.com (CDN `cdn.ipaslogo.com/display-512/*.webp`).
- Cannot change phone numbers or list connected apps automatically: Google provides no API for personal accounts. Do not claim otherwise in UI copy.
- Must stay light: minimal client JS, CSS/transform-only motion, respects reduced motion.

## Brand Commitments

- Name: Drive Manager (working name).
- Language of UI copy: Indonesian.
- Font Plus Jakarta Sans, react-icons, avatars from ipaslogo.com — owner-specified.
- Must not look AI-generated.

## Evidence on Hand

No real data yet; all numbers come from the connected Google accounts at runtime. Do not fabricate account data in the shipped UI.

## Product Principles

1. The phone is the primary device; every screen works one-handed.
2. Secrets never leave the device in plaintext.
3. Be honest about what Google allows; hand off to Google's page instead of pretending.
4. Speed over spectacle: data first, motion only where it explains a change.

## Accessibility & Inclusion

Respect `prefers-reduced-motion`; WCAG AA contrast; touch targets ≥ 44px.
