import fs from 'fs';
import { getTruthPath, getAssistantDir } from '../constants.js';

// ANSI colors
const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

interface SectionStats {
  total: number;
  done: number;
  items: string[];      // raw bullets
  pending: string[];    // cleaned, only pending items
}

export async function status(): Promise<void> {
  const assistantDir = getAssistantDir();
  const truthPath = getTruthPath();

  if (!fs.existsSync(assistantDir)) {
    console.log(colors.dim('No .yap/ folder. Run: yap init'));
    return;
  }

  if (!fs.existsSync(truthPath)) {
    console.log(colors.dim('No truth.md. Run: yap init'));
    return;
  }

  const content = fs.readFileSync(truthPath, 'utf-8');
  const sections = parseSections(content);

  console.log('');
  console.log(colors.bold('  yap status'));
  console.log('');

  // Decisions
  const decisions = sections.get('## Decisions');
  if (decisions && decisions.total > 0) {
    console.log(`  ${colors.green('●')} ${colors.bold(String(decisions.total))} decision${decisions.total === 1 ? '' : 's'}`);
    for (const item of decisions.items.slice(0, 3)) {
      console.log(`    ${colors.dim('→')} ${truncate(item, 50)}`);
    }
    if (decisions.total > 3) {
      console.log(`    ${colors.dim(`  +${decisions.total - 3} more`)}`);
    }
  }

  // TODOs
  const todos = sections.get('## TODOs');
  if (todos && todos.total > 0) {
    const pendingCount = todos.total - todos.done;
    const icon = pendingCount === 0 ? colors.green('✓') : colors.yellow('○');
    const doneStatus = todos.done > 0 ? ` ${colors.dim(`(${todos.done} done)`)}` : '';
    console.log(`  ${icon} ${colors.bold(String(pendingCount))} todo${pendingCount === 1 ? '' : 's'}${doneStatus}`);
    for (const item of todos.pending.slice(0, 3)) {
      console.log(`    ${colors.dim('→')} ${truncate(item, 50)}`);
    }
  }

  // Acceptance Criteria
  const acceptance = sections.get('## Acceptance Criteria');
  if (acceptance && acceptance.total > 0) {
    console.log(`  ${colors.blue('◆')} ${colors.bold(String(acceptance.total))} acceptance criteria`);
  }

  // Constraints
  const constraints = sections.get('## Constraints');
  if (constraints && constraints.total > 0) {
    console.log(`  ${colors.magenta('■')} ${colors.bold(String(constraints.total))} constraint${constraints.total === 1 ? '' : 's'}`);
  }

  // Questions
  const questions = sections.get('## Questions');
  if (questions && questions.total > 0) {
    const pendingCount = questions.total - questions.done;
    const icon = pendingCount === 0 ? colors.green('✓') : colors.cyan('?');
    const resolvedStatus = questions.done > 0 ? ` ${colors.dim(`(${questions.done} resolved)`)}` : '';
    console.log(`  ${icon} ${colors.bold(String(pendingCount))} question${pendingCount === 1 ? '' : 's'}${resolvedStatus}`);
    for (const item of questions.pending.slice(0, 2)) {
      console.log(`    ${colors.dim('→')} ${truncate(item, 50)}`);
    }
  }

  // Domain
  const domain = sections.get('## Domain');
  if (domain && domain.total > 0) {
    console.log(`  ${colors.dim('◇')} ${colors.bold(String(domain.total))} domain concept${domain.total === 1 ? '' : 's'}`);
  }

  // UX
  const ux = sections.get('## UX');
  if (ux && ux.total > 0) {
    console.log(`  ${colors.dim('◇')} ${colors.bold(String(ux.total))} UX requirement${ux.total === 1 ? '' : 's'}`);
  }

  const totalItems = Array.from(sections.values()).reduce((sum, s) => sum + s.total, 0);
  if (totalItems === 0) {
    console.log(colors.dim('  Empty. Start with: yap "D: Your first decision"'));
  }

  console.log('');
}

function parseSections(content: string): Map<string, SectionStats> {
  const sections = new Map<string, SectionStats>();
  const lines = content.split('\n');

  let currentSection: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      currentSection = trimmed;
      sections.set(currentSection, { total: 0, done: 0, items: [], pending: [] });
    } else if (currentSection && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
      const stats = sections.get(currentSection)!;
      stats.total++;
      const cleaned = cleanBullet(trimmed);
      stats.items.push(cleaned);
      if (trimmed.includes('[x]') || trimmed.includes('[X]')) {
        stats.done++;
      } else {
        stats.pending.push(cleaned);
      }
    }
  }

  return sections;
}

function cleanBullet(bullet: string): string {
  return bullet.replace(/^[-*]\s*/, '').replace(/^\[[ x]\]\s*/i, '').trim();
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + '...';
}
