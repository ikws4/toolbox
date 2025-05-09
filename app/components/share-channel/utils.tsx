'use client'

// Array of common emoji categories for usernames
const emojiGroups = [
  ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
  ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥝'],
  ['🚀', '🚁', '🚂', '🚃', '🚌', '🚎', '🚓', '🚕', '🛵', '🏍️', '🛺', '🚤', '⛵', '🛸', '🛩️'],
  ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋', '⛳', '🏊‍♀️', '🚴‍♀️'],
  ['🎮', '🎲', '🧩', '🎭', '🎨', '🎬', '🎤', '🎧', '🎸', '🎹', '🎺', '🎻', '🪕', '🎯', '🎪'],
]

// Adjectives to pair with emojis for more interesting names
const adjectives = [
  'Happy', 'Swift', 'Clever', 'Brave', 'Mighty',
  'Cosmic', 'Mystic', 'Radiant', 'Gentle', 'Wise',
  'Bouncy', 'Dazzling', 'Silent', 'Golden', 'Peaceful',
  'Fluffy', 'Sparkling', 'Magical', 'Vibrant', 'Witty'
]

/**
 * Generate a random emoji username
 * @returns A username with a random adjective and emoji
 */
export function generateEmojiUsername(): string {
  // Select a random emoji group
  const randomEmojiGroup = emojiGroups[Math.floor(Math.random() * emojiGroups.length)]
  
  // Select a random emoji from the group
  const randomEmoji = randomEmojiGroup[Math.floor(Math.random() * randomEmojiGroup.length)]
  
  // Select a random adjective
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  
  // Combine to create the username
  return `${randomAdjective}${randomEmoji}`
}

/**
 * Interface for discovered channels
 */
export interface DiscoveredChannel {
  id: string
  hostName: string
  peerCount: number
  timestamp: number
}

/**
 * Broadcast message types for channel discovery
 */
export enum BroadcastMessageType {
  CHANNEL_ANNOUNCEMENT = 'channel_announcement',
  CHANNEL_DISCOVERY = 'channel_discovery',
  CHANNEL_RESPONSE = 'channel_response'
}

/**
 * Format file size in human-readable form
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes'
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}