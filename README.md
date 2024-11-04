# Excali - Macro

SvelteKit Application that mimics basic Excalidraw functionality. Written as an exercise to see how I could improve on my interview performance at Macro

## Design Goals

Based on the prompt, I decided to focus on a minimal yet functional subset of Excalidraw, namely the following features -

- Panning
- Rectangles
- Circles (Ellipses)
- Text

I wanted to not just render lines on the canvas but figure out what idiomatic ways of working with the Canvas API are and how to work with them.

To this end, the code does the following -

- Proper state management of the global canvas object
- In-memory store of any drawn objects (doesn't persist across sessions) with Ctrl-Z (Undo) functionality.
- Multiple Parameters for rendered objects like - stroke color, line width, line style, font style etc.

The codebase makes extensive use of SkeletonUI components which allows me to avoid getting too bogged down with generating functional UI but allows for heavy customizability.

## AI Object Generation

As a fun experiment, I'm using Claude to generate drawings based on a given prompt. Here's an example

https://github.com/user-attachments/assets/4ff594ee-ae4d-4f45-b92f-d35f377779e7

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
