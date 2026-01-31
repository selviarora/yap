#!/usr/bin/env node

import { getContext, getRepoRoot } from './context.js';
import {
  saveThought,
  getAllThoughts,
  getThoughtsToday,
  getThoughtsThisWeek,
  getThoughtsByRepo,
  Thought,
} from './store.js';

// ANSI colors
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'yesterday';
  }

  return date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
}

function formatThought(t: Thought, showContext: boolean = true): string {
  const time = dim(formatTime(t.timestamp));
  const text = `"${t.text}"`;
  const todo = t.todo ? yellow(' [todo]') : '';

  if (showContext && t.repo) {
    const context = dim(`${t.repo}${t.branch ? `:${t.branch}` : ''}`);
    return `  ${time}  ${text}${todo}\n         ${context}`;
  }

  return `  ${time}  ${text}${todo}`;
}

function groupByRepo(thoughts: Thought[]): Map<string, Thought[]> {
  const groups = new Map<string, Thought[]>();

  for (const t of thoughts) {
    const key = t.repo || 'no repo';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(t);
  }

  return groups;
}

function groupByDirectory(thoughts: Thought[]): Map<string, Thought[]> {
  const groups = new Map<string, Thought[]>();

  for (const t of thoughts) {
    // Get relative path from repo root if possible
    const key = t.directory.split('/').slice(-2).join('/');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(t);
  }

  return groups;
}

// Commands

function capture(text: string): void {
  const context = getContext();

  saveThought({
    text,
    repo: context.repo,
    branch: context.branch,
    directory: context.directory,
    timestamp: context.timestamp,
  });

  console.log(dim('captured'));
}

function showLog(filter?: string): void {
  let thoughts: Thought[];
  let label: string;

  if (filter === 'today') {
    thoughts = getThoughtsToday();
    label = 'today';
  } else if (filter === 'week' || filter === '--week') {
    thoughts = getThoughtsThisWeek();
    label = 'this week';
  } else {
    thoughts = getThoughtsThisWeek(); // default to week
    label = 'this week';
  }

  if (thoughts.length === 0) {
    console.log(dim(`no thoughts ${label}`));
    return;
  }

  // Sort by timestamp, newest first
  thoughts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  console.log('');
  console.log(bold(`  ${thoughts.length} thought${thoughts.length === 1 ? '' : 's'} ${label}`));
  console.log('');

  const grouped = groupByRepo(thoughts);

  for (const [repo, repoThoughts] of grouped) {
    console.log(`  ${cyan(repo)} ${dim(`(${repoThoughts.length})`)}`);
    for (const t of repoThoughts.slice(0, 10)) {
      console.log(formatThought(t, false));
    }
    if (repoThoughts.length > 10) {
      console.log(dim(`    +${repoThoughts.length - 10} more`));
    }
    console.log('');
  }
}

function showHere(): void {
  const context = getContext();

  if (!context.repo) {
    console.log(dim('not in a git repo'));
    return;
  }

  const thoughts = getThoughtsByRepo(context.repo);

  if (thoughts.length === 0) {
    console.log(dim(`no thoughts about ${context.repo}`));
    return;
  }

  // Sort by timestamp, newest first
  thoughts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group by relative directory
  const grouped = new Map<string, Thought[]>();
  const repoRoot = getRepoRoot() || context.directory;

  for (const t of thoughts) {
    // Get path relative to repo root
    let relPath = t.directory.replace(repoRoot, '').replace(/^\//, '') || '.';
    if (!grouped.has(relPath)) {
      grouped.set(relPath, []);
    }
    grouped.get(relPath)!.push(t);
  }

  console.log('');
  console.log(bold(`  ${thoughts.length} thought${thoughts.length === 1 ? '' : 's'} in ${context.repo}`));
  if (context.branch) {
    console.log(dim(`  branch: ${context.branch}`));
  }
  console.log('');

  for (const [dir, dirThoughts] of grouped) {
    console.log(`  ${cyan(dir || '.')} ${dim(`(${dirThoughts.length})`)}`);
    for (const t of dirThoughts.slice(0, 5)) {
      const time = dim(formatTime(t.timestamp));
      const todo = t.todo ? yellow(' [todo]') : '';
      console.log(`    ${time}  "${t.text}"${todo}`);
    }
    if (dirThoughts.length > 5) {
      console.log(dim(`      +${dirThoughts.length - 5} more`));
    }
    console.log('');
  }
}

function showHelp(): void {
  console.log(`
${bold('yap')} - capture developer thoughts

${bold('usage:')}
  yap "thought"       capture a thought
  yap                 capture (opens prompt)
  yap ?               thoughts about current repo
  yap log             recent thoughts (this week)
  yap log today       today's thoughts
  yap log --week      this week's thoughts

${bold('examples:')}
  yap "this retry logic feels wrong"
  yap "ask infra about rate limits"
  yap "come back to this after lunch"
`);
}

// Main

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No args - show help for now (later: quick capture mode)
    showHelp();
    return;
  }

  const command = args[0];

  // yap "thought" - capture
  if (command.startsWith('"') || command.startsWith("'") || (!['log', '?', 'help', '--help', '-h'].includes(command) && args.length === 1)) {
    // Join all args as the thought
    const thought = args.join(' ').replace(/^["']|["']$/g, '');
    capture(thought);
    return;
  }

  switch (command) {
    case '?':
      showHere();
      break;

    case 'log':
      showLog(args[1]);
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      // Treat as thought
      capture(args.join(' '));
      break;
  }
}

main().catch(console.error);
