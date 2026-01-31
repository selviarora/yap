#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
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

function capture(text: string, isTodo: boolean = false): void {
  const context = getContext();

  saveThought({
    text,
    repo: context.repo,
    branch: context.branch,
    directory: context.directory,
    timestamp: context.timestamp,
    todo: isTodo || undefined,
  });

  console.log(dim(isTodo ? 'captured (todo)' : 'captured'));
}

async function interactiveCapture(): Promise<void> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(dim('yap: '), (answer) => {
      rl.close();
      if (answer.trim()) {
        capture(answer.trim());
      }
      resolve();
    });
  });
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

function syncToClaude(): void {
  const context = getContext();
  const repoRoot = getRepoRoot();

  if (!repoRoot) {
    console.log(dim('not in a git repo'));
    return;
  }

  const thoughts = getThoughtsByRepo(context.repo!);

  if (thoughts.length === 0) {
    console.log(dim('no thoughts to sync'));
    return;
  }

  // Sort by timestamp, newest first
  thoughts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Format thoughts for CLAUDE.md
  const YAP_START = '<!-- yap:start -->';
  const YAP_END = '<!-- yap:end -->';

  const thoughtLines = thoughts.slice(0, 20).map(t => {
    const date = new Date(t.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const todo = t.todo ? ' [todo]' : '';
    return `- ${t.text}${todo} _(${date})_`;
  });

  const yapSection = `${YAP_START}
## Developer Thoughts

These are thoughts captured while working on this codebase (via [yap](https://github.com/selviarora/yap)):

${thoughtLines.join('\n')}
${YAP_END}`;

  const claudePath = path.join(repoRoot, 'CLAUDE.md');

  if (fs.existsSync(claudePath)) {
    let content = fs.readFileSync(claudePath, 'utf-8');

    // Check if yap section exists
    const startIdx = content.indexOf(YAP_START);
    const endIdx = content.indexOf(YAP_END);

    if (startIdx !== -1 && endIdx !== -1) {
      // Replace existing section
      content = content.slice(0, startIdx) + yapSection + content.slice(endIdx + YAP_END.length);
    } else {
      // Append to end
      content = content.trimEnd() + '\n\n' + yapSection + '\n';
    }

    fs.writeFileSync(claudePath, content);
  } else {
    // Create new CLAUDE.md
    fs.writeFileSync(claudePath, yapSection + '\n');
  }

  console.log(green(`synced ${thoughts.length} thought${thoughts.length === 1 ? '' : 's'} to CLAUDE.md`));
}

function showHelp(): void {
  console.log(`
${bold('yap')} - capture thoughts before they disappear

${bold('capture:')}
  yap "thought"         save a thought
  yap                   quick capture
  yap todo "thought"    mark as actionable

${bold('recall:')}
  yap here              thoughts about this repo
  yap log               this week
  yap log today         just today

${bold('claude code:')}
  yap sync              push thoughts to CLAUDE.md

${bold('examples:')}
  yap "this retry logic smells off"
  yap todo "ask infra about rate limits"
  yap sync
`);
}

// Main

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await interactiveCapture();
    return;
  }

  const command = args[0];

  switch (command) {
    case '?':
    case 'here':
      showHere();
      break;

    case 'log':
      showLog(args[1]);
      break;

    case 'todo':
      if (args.length > 1) {
        const thought = args.slice(1).join(' ').replace(/^["']|["']$/g, '');
        capture(thought, true);
      } else {
        console.log(dim('usage: yap todo "thought"'));
      }
      break;

    case 'sync':
      syncToClaude();
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      // Treat as thought
      const thought = args.join(' ').replace(/^["']|["']$/g, '');
      capture(thought);
      break;
  }
}

main().catch(console.error);
