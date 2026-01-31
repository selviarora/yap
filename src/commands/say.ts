import fs from 'fs';
import { getConversationPath, getAssistantDir } from '../constants.js';
import { sync } from './sync.js';

export interface ConversationEntry {
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function say(message: string): Promise<void> {
  const assistantDir = getAssistantDir();
  const conversationPath = getConversationPath();

  // Check if .assistant directory exists
  if (!fs.existsSync(assistantDir)) {
    throw new Error(
      '.assistant/ directory not found. Run "tool init" first.'
    );
  }

  // Create conversation file if it doesn't exist
  if (!fs.existsSync(conversationPath)) {
    fs.writeFileSync(conversationPath, '');
  }

  // Create the entry
  const entry: ConversationEntry = {
    timestamp: new Date().toISOString(),
    role: 'user',
    content: message,
  };

  // Append to conversation.jsonl
  fs.appendFileSync(conversationPath, JSON.stringify(entry) + '\n');
  console.log(`Added message to conversation log`);

  // Run sync automatically
  await sync();
}
