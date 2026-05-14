# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Next.js web app that displays Makers Club projects. The stack is React + Next.js (App Router).

## Commands

```bash
npm install          # install dependencies
npm run dev 

         # start dev server at http://localhost:3000
npm run build        # production build
npm run start        # run production build locally
npm run lint         # run ESLint
```

## Architecture

This is a Next.js App Router project. Key conventions:

- `app/` — routes and layouts using the file-system router; `page.tsx` files define routes, `layout.tsx` wraps them
- `app/components/` — shared React components
- `public/` — static assets served at the root path
- Server Components are the default; add `"use client"` only when interactivity or browser APIs are needed
- Data fetching lives in Server Components via `async/await`; no `getServerSideProps` or `getStaticProps` (those are Pages Router patterns)
