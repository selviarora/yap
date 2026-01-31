import fs from 'fs';
import { getConversationPath, getAssistantDir } from '../constants.js';
import { sync } from './sync.js';
import { parseMessageForMarkers } from '../parser.js';

// ANSI colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

export interface ConversationEntry {
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function say(message: string): Promise<void> {
  const assistantDir = getAssistantDir();
  const conversationPath = getConversationPath();

  // Check if .yap directory exists
  if (!fs.existsSync(assistantDir)) {
    throw new Error('.yap/ directory not found. Run "yap init" first.');
  }

  // Create conversation file if it doesn't exist
  if (!fs.existsSync(conversationPath)) {
    fs.writeFileSync(conversationPath, '');
  }

  // Check for markers
  const markers = parseMessageForMarkers(message);

  // Create the entry
  const entry: ConversationEntry = {
    timestamp: new Date().toISOString(),
    role: 'user',
    content: message,
  };

  // Append to conversation.jsonl
  fs.appendFileSync(conversationPath, JSON.stringify(entry) + '\n');

  if (markers.length > 0) {
    console.log(green(`✓ logged + ${markers.length} marker${markers.length === 1 ? '' : 's'}`));
  } else {
    console.log(dim('logged'));
  }

  // Run sync automatically
  await sync({ quiet: true });
}
