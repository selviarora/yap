import path from 'path';

export const ASSISTANT_DIR = '.yap';
export const CONVERSATION_FILE = 'conversation.jsonl';
export const TRUTH_FILE = 'truth.md';
export const TRUTH_TEMPLATE_FILE = 'truth.template.md';
export const SHIP_INSTRUCTIONS_FILE = 'SHIP_INSTRUCTIONS.md';
export const SYNC_STATE_FILE = '.sync-state.json';
export const ARCHIVE_DIR = 'archive';

export function getAssistantDir(cwd: string = process.cwd()): string {
  return path.join(cwd, ASSISTANT_DIR);
}

export function getConversationPath(cwd: string = process.cwd()): string {
  return path.join(cwd, ASSISTANT_DIR, CONVERSATION_FILE);
}

export function getTruthPath(cwd: string = process.cwd()): string {
  return path.join(cwd, ASSISTANT_DIR, TRUTH_FILE);
}

export function getTruthTemplatePath(cwd: string = process.cwd()): string {
  return path.join(cwd, ASSISTANT_DIR, TRUTH_TEMPLATE_FILE);
}

export function getShipInstructionsPath(cwd: string = process.cwd()): string {
  return path.join(cwd, SHIP_INSTRUCTIONS_FILE);
}

export function getSyncStatePath(cwd: string = process.cwd()): string {
  return path.join(cwd, ASSISTANT_DIR, SYNC_STATE_FILE);
}

export function getArchiveDir(cwd: string = process.cwd()): string {
  return path.join(cwd, ASSISTANT_DIR, ARCHIVE_DIR);
}
