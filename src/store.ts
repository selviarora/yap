import fs from 'fs';
import path from 'path';
import os from 'os';

export interface Thought {
  id: string;
  text: string;
  repo: string | null;
  branch: string | null;
  directory: string;
  timestamp: string;
  tags?: string[];
  todo?: boolean;
}

const YAP_DIR = path.join(os.homedir(), '.yap');
const THOUGHTS_FILE = path.join(YAP_DIR, 'thoughts.jsonl');

function ensureDir(): void {
  if (!fs.existsSync(YAP_DIR)) {
    fs.mkdirSync(YAP_DIR, { recursive: true });
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function saveThought(thought: Omit<Thought, 'id'>): Thought {
  ensureDir();
  const withId: Thought = { id: generateId(), ...thought };
  fs.appendFileSync(THOUGHTS_FILE, JSON.stringify(withId) + '\n');
  return withId;
}

export function getAllThoughts(): Thought[] {
  if (!fs.existsSync(THOUGHTS_FILE)) {
    return [];
  }

  const content = fs.readFileSync(THOUGHTS_FILE, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  return lines.map(line => {
    try {
      return JSON.parse(line) as Thought;
    } catch {
      return null;
    }
  }).filter((t): t is Thought => t !== null);
}

export function getThoughtsByRepo(repo: string): Thought[] {
  return getAllThoughts().filter(t => t.repo === repo);
}

export function getThoughtsByDirectory(dir: string): Thought[] {
  return getAllThoughts().filter(t => t.directory.startsWith(dir));
}

export function getRecentThoughts(days: number = 7): Thought[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return getAllThoughts().filter(t => new Date(t.timestamp) >= cutoff);
}

export function getThoughtsToday(): Thought[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getAllThoughts().filter(t => new Date(t.timestamp) >= today);
}

export function getThoughtsThisWeek(): Thought[] {
  return getRecentThoughts(7);
}

export function updateThought(id: string, updates: Partial<Thought>): boolean {
  const thoughts = getAllThoughts();
  const index = thoughts.findIndex(t => t.id === id);

  if (index === -1) return false;

  thoughts[index] = { ...thoughts[index], ...updates };

  ensureDir();
  fs.writeFileSync(THOUGHTS_FILE, thoughts.map(t => JSON.stringify(t)).join('\n') + '\n');
  return true;
}
