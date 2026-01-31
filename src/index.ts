#!/usr/bin/env node

import * as readline from 'readline';
import { init } from './commands/init.js';
import { say } from './commands/say.js';
import { sync } from './commands/sync.js';
import { ship } from './commands/ship.js';
import { archive } from './commands/archive.js';

const COMMANDS = ['init', 'sync', 'ship', 'archive', 'help', '--help', '-h', 'repl'];

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    // No args = REPL mode
    if (!command) {
      await replMode();
      return;
    }

    // Known command
    if (COMMANDS.includes(command)) {
      switch (command) {
        case 'init':
          await init();
          break;
        case 'say':
          // Still support explicit "say" for backwards compat
          const explicitMsg = args.slice(1).join(' ');
          if (!explicitMsg) {
            console.error('Error: Please provide a message.');
            process.exit(1);
          }
          await say(explicitMsg);
          break;
        case 'sync':
          const fullSync = args.includes('--full');
          await sync({ full: fullSync });
          break;
        case 'ship':
          await ship();
          break;
        case 'archive':
          await archive();
          break;
        case 'repl':
          await replMode();
          break;
        case 'help':
        case '--help':
        case '-h':
          printHelp();
          break;
      }
    } else {
      // Not a command = treat entire args as a message
      const message = args.join(' ');
      await say(message);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}

async function replMode() {
  console.log('yap REPL - type messages, "ship" when ready, "q" to quit\n');
  console.log('Shortcuts: D: decision, T: todo, C: constraint, Q: question, A: acceptance');
  console.log('           X: done, DEL: delete, D!: update decision\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question('> ', async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed === 'quit' || trimmed === 'exit' || trimmed === 'q') {
        rl.close();
        return;
      }

      if (trimmed === 'ship') {
        try {
          await ship();
        } catch (e) {
          console.error(e instanceof Error ? e.message : 'Error');
        }
        prompt();
        return;
      }

      if (trimmed === 'sync') {
        try {
          await sync();
        } catch (e) {
          console.error(e instanceof Error ? e.message : 'Error');
        }
        prompt();
        return;
      }

      if (trimmed === 'help') {
        printReplHelp();
        prompt();
        return;
      }

      try {
        await say(trimmed);
      } catch (e) {
        console.error(e instanceof Error ? e.message : 'Error');
      }

      prompt();
    });
  };

  prompt();
}

function printReplHelp() {
  console.log(`
REPL COMMANDS:
  ship      Generate Claude Code instructions
  sync      Re-sync markers to truth.md
  quit      Exit REPL (or q, exit)
  help      Show this help

MARKERS (prefix your message):
  D:   or DECISION:      Add a decision
  C:   or CONSTRAINT:    Add a constraint
  T:   or TODO:          Add a todo
  Q:   or QUESTION:      Add a question
  A:   or ACCEPTANCE:    Add acceptance criteria
  UX:                    Add UX requirement
  DOM: or DOMAIN:        Add domain concept

  D!:  or DECISION-UPDATE:  Replace matching decision
  DEL: or DELETE:           Remove an item
  X:   or DONE:             Mark todo complete
  R:   or RESOLVED:         Mark question resolved

EXAMPLES:
  > D: Use PostgreSQL for storage
  > T: Write unit tests
  > X: Write unit tests
  > D!: Use MySQL instead of PostgreSQL
`);
}

function printHelp() {
  console.log(`
yap - Yap until you're ready to ship

USAGE:
  yap                     Start REPL mode (interactive)
  yap "<message>"         Add message and sync (no "say" needed)
  yap <command>           Run a specific command

COMMANDS:
  init          Initialize .yap/ folder
  sync          Re-sync markers to truth.md (--full to reprocess all)
  ship          Generate Claude Code instructions
  archive       Archive old messages
  help          Show this help

EXAMPLES:
  yap init
  yap "D: Use PostgreSQL"
  yap "T: Write tests"
  yap ship

  # Or use REPL mode:
  yap
  > D: Use React for frontend
  > T: Set up build
  > ship

MARKERS (short form):
  D:   decision       C:   constraint     T:   todo
  Q:   question       A:   acceptance     UX:  ux requirement
  DOM: domain         D!:  update decision
  DEL: delete item    X:   mark done      R:   resolve question
`);
}

main();
