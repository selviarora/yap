import fs from 'fs';
import path from 'path';
import {
  getConversationPath,
  getArchiveDir,
  getSyncStatePath,
  getAssistantDir,
} from '../constants.js';

export async function archive(): Promise<void> {
  const assistantDir = getAssistantDir();
  const conversationPath = getConversationPath();
  const archiveDir = getArchiveDir();
  const statePath = getSyncStatePath();

  if (!fs.existsSync(assistantDir)) {
    throw new Error('.assistant/ directory not found. Run "tool init" first.');
  }

  if (!fs.existsSync(conversationPath)) {
    console.log('No conversation log to archive.');
    return;
  }

  const content = fs.readFileSync(conversationPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  if (lines.length === 0) {
    console.log('Conversation log is empty. Nothing to archive.');
    return;
  }

  // Create archive directory if needed
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  // Archive filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveFile = path.join(archiveDir, `conversation-${timestamp}.jsonl`);

  // Move current conversation to archive
  fs.writeFileSync(archiveFile, content);

  // Clear current conversation
  fs.writeFileSync(conversationPath, '');

  // Reset sync state
  if (fs.existsSync(statePath)) {
    fs.unlinkSync(statePath);
  }

  console.log(`Archived ${lines.length} messages to ${path.basename(archiveFile)}`);
  console.log('Conversation log cleared. truth.md preserved.');
}
