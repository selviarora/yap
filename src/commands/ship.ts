import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import { getTruthPath, getShipInstructionsPath } from '../constants.js';

export async function ship(): Promise<void> {
  const truthPath = getTruthPath();
  const shipInstructionsPath = getShipInstructionsPath();

  // Verify truth.md exists
  if (!fs.existsSync(truthPath)) {
    throw new Error('truth.md not found. Run "tool init" first.');
  }

  // Read truth.md
  const truthContent = fs.readFileSync(truthPath, 'utf-8');

  // Extract relevant sections for the plan
  const plan = extractPlan(truthContent);

  console.log('\n=== SHIP PLAN ===\n');
  console.log(plan);
  console.log('\n=================\n');

  // Create short prompt for Claude
  const prompt = `Implement the project according to the truth document at ${truthPath}. Only do what is explicitly specified. Ask questions if unclear.`;

  // Create full instructions file for reference
  const fullInstructions = `${prompt}

${plan}

--- FULL TRUTH.MD CONTENT ---

${truthContent}`;

  fs.writeFileSync(shipInstructionsPath, fullInstructions);
  console.log(`Created ${path.basename(shipInstructionsPath)}\n`);

  // Check if claude command exists
  const claudeExists = await checkCommandExists('claude');

  if (claudeExists) {
    console.log('Launching Claude Code...\n');

    // Spawn claude with the prompt as argument
    const claude = spawn('claude', [prompt], {
      stdio: 'inherit',
      shell: false,
    });

    claude.on('error', (err) => {
      console.error(`Failed to start Claude Code: ${err.message}`);
      printManualInstructions();
    });

    claude.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`\nClaude Code exited with code ${code}`);
      }
    });
  } else {
    printManualInstructions();
  }
}

function printManualInstructions() {
  console.log('--- MANUAL INSTRUCTIONS ---\n');
  console.log('Claude Code CLI not found. Install from:');
  console.log('  https://github.com/anthropics/claude-code\n');
  console.log('Then run:');
  console.log('  claude\n');
  console.log('And paste:');
  console.log('  Implement the project according to SHIP_INSTRUCTIONS.md\n');
}

function extractPlan(truthContent: string): string {
  const lines = truthContent.split('\n');
  const sections: Record<string, string[]> = {
    'Acceptance Criteria': [],
    'TODOs': [],
    'Decisions': [],
    'Constraints': [],
  };

  let currentSection: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      const sectionName = trimmed.replace('## ', '');
      currentSection = sectionName;
    } else if (currentSection && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
      // Skip completed items (checkbox checked)
      if (trimmed.includes('[x]') || trimmed.includes('[X]')) {
        continue;
      }
      if (sections[currentSection]) {
        sections[currentSection].push(trimmed);
      }
    }
  }

  let plan = '';

  if (sections['TODOs'].length > 0) {
    plan += 'NEXT ACTIONS:\n';
    for (const item of sections['TODOs']) {
      plan += `  ${item}\n`;
    }
    plan += '\n';
  }

  if (sections['Acceptance Criteria'].length > 0) {
    plan += 'ACCEPTANCE CRITERIA:\n';
    for (const item of sections['Acceptance Criteria']) {
      plan += `  ${item}\n`;
    }
    plan += '\n';
  }

  if (sections['Decisions'].length > 0) {
    plan += 'KEY DECISIONS:\n';
    for (const item of sections['Decisions']) {
      plan += `  ${item}\n`;
    }
    plan += '\n';
  }

  if (sections['Constraints'].length > 0) {
    plan += 'CONSTRAINTS:\n';
    for (const item of sections['Constraints']) {
      plan += `  ${item}\n`;
    }
  }

  return plan || '(No specific actions or criteria found in truth.md)';
}

async function checkCommandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`which ${command}`, (error) => {
      resolve(!error);
    });
  });
}
