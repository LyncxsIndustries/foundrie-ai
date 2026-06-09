declare global {
  interface Liveblocks {
    Storage: Record<string, never>;
  }
}

export {};
