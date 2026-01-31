import { execSync } from 'child_process';
import path from 'path';

export interface ThoughtContext {
  repo: string | null;
  branch: string | null;
  directory: string;
  timestamp: string;
}

function exec(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

export function getContext(): ThoughtContext {
  const cwd = process.cwd();

  // Get git repo name
  const repoPath = exec('git rev-parse --show-toplevel');
  const repo = repoPath ? path.basename(repoPath) : null;

  // Get current branch
  const branch = exec('git rev-parse --abbrev-ref HEAD');

  return {
    repo,
    branch,
    directory: cwd,
    timestamp: new Date().toISOString(),
  };
}

export function getRepoRoot(): string | null {
  return exec('git rev-parse --show-toplevel');
}
