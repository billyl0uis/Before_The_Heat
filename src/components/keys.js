// Shortcut labels in the reader's own keyboard: ⌘ on Apple devices,
// Ctrl everywhere else.
const isApple =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '')

export const UNDO_KEY = isApple ? '⌘Z' : 'Ctrl+Z'
export const REDO_KEY = isApple ? '⇧⌘Z' : 'Ctrl+Shift+Z'
