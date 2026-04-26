/** Mirrors Electron `PostComposerContext` — only `todo` is wired on mobile today. */
export type PostComposerContext =
  | { type: 'event'; id: number; title: string }
  | { type: 'todo'; id: number; title: string }
  | null;
