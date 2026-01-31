import fs from 'fs';
import {
  getConversationPath,
  getTruthPath,
  getAssistantDir,
  getSyncStatePath,
} from '../constants.js';
import {
  parseMessageForMarkers,
  parseTruthDocument,
  applyMarkersToSections,
  rebuildTruthDocument,
  ParsedMarker,
} from '../parser.js';
import type { ConversationEntry } from './say.js';

interface SyncState {
  lastProcessedLine: number;
  lastProcessedTimestamp: string | null;
}

function loadSyncState(statePath: string): SyncState {
  if (fs.existsSync(statePath)) {
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    } catch {
      return { lastProcessedLine: 0, lastProcessedTimestamp: null };
    }
  }
  return { lastProcessedLine: 0, lastProcessedTimestamp: null };
}

function saveSyncState(statePath: string, state: SyncState): void {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export async function sync(options: { full?: boolean; quiet?: boolean } = {}): Promise<void> {
  const assistantDir = getAssistantDir();
  const conversationPath = getConversationPath();
  const truthPath = getTruthPath();
  const statePath = getSyncStatePath();
  const log = options.quiet ? () => {} : console.log;

  // Check if .yap directory exists
  if (!fs.existsSync(assistantDir)) {
    throw new Error('.yap/ directory not found. Run "yap init" first.');
  }

  // Check if conversation file exists
  if (!fs.existsSync(conversationPath)) {
    log('No conversation log found. Nothing to sync.');
    return;
  }

  // Check if truth.md exists
  if (!fs.existsSync(truthPath)) {
    throw new Error('truth.md not found. Run "yap init" first.');
  }

  // Read conversation log
  const conversationContent = fs.readFileSync(conversationPath, 'utf-8');
  const allLines = conversationContent.split('\n').filter(line => line.trim());

  if (allLines.length === 0) {
    log('Conversation log is empty. Nothing to sync.');
    return;
  }

  // Load sync state (track what we've already processed)
  const state = options.full
    ? { lastProcessedLine: 0, lastProcessedTimestamp: null }
    : loadSyncState(statePath);

  // Only process new lines
  const newLines = allLines.slice(state.lastProcessedLine);

  if (newLines.length === 0) {
    log('No new messages to sync.');
    return;
  }

  // Parse new messages for markers
  const newMarkers: ParsedMarker[] = [];
  let lastTimestamp: string | null = state.lastProcessedTimestamp;

  for (const line of newLines) {
    try {
      const entry: ConversationEntry = JSON.parse(line);
      lastTimestamp = entry.timestamp;
      if (entry.role === 'user') {
        const markers = parseMessageForMarkers(entry.content);
        newMarkers.push(...markers);
      }
    } catch (e) {
      if (!options.quiet) {
        console.warn('Skipping invalid line in conversation log');
      }
    }
  }

  // Read current truth.md (which may have been manually edited)
  const truthContent = fs.readFileSync(truthPath, 'utf-8');

  if (newMarkers.length === 0) {
    // Update state even if no markers
    saveSyncState(statePath, {
      lastProcessedLine: allLines.length,
      lastProcessedTimestamp: lastTimestamp,
    });
    return;
  }

  // Parse current truth.md and apply only new markers
  const sections = parseTruthDocument(truthContent);
  const { deletions, updates } = applyMarkersToSections(sections, newMarkers);
  const updatedContent = rebuildTruthDocument(truthContent, sections);

  // Log what happened
  if (deletions.length > 0) {
    log(`Deleted ${deletions.length} item(s)`);
  }
  if (updates.length > 0) {
    for (const u of updates) {
      log(`  ${u}`);
    }
  }

  // Write back if changed
  if (updatedContent !== truthContent) {
    fs.writeFileSync(truthPath, updatedContent);
  }

  // Save sync state
  saveSyncState(statePath, {
    lastProcessedLine: allLines.length,
    lastProcessedTimestamp: lastTimestamp,
  });
}
