import fs from 'fs';
import path from 'path';
import {
  getAssistantDir,
  getConversationPath,
  getTruthPath,
  getTruthTemplatePath,
} from '../constants.js';

const DEFAULT_TEMPLATE = `# Truth Document

This is the single source of truth for the project.

## Domain

<!-- Core domain concepts and definitions -->

## Decisions

<!-- Architectural and design decisions -->

## Constraints

<!-- Technical and business constraints -->

## UX

<!-- User experience requirements -->

## Acceptance Criteria

<!-- What "done" looks like -->

## Questions

<!-- Open questions to resolve -->

## TODOs

<!-- Action items -->
`;

export async function init(): Promise<void> {
  const assistantDir = getAssistantDir();
  const conversationPath = getConversationPath();
  const truthPath = getTruthPath();
  const templatePath = getTruthTemplatePath();

  // Create .assistant directory if it doesn't exist
  if (!fs.existsSync(assistantDir)) {
    fs.mkdirSync(assistantDir, { recursive: true });
    console.log(`Created ${assistantDir}/`);
  } else {
    console.log(`${assistantDir}/ already exists`);
  }

  // Create conversation.jsonl if it doesn't exist
  if (!fs.existsSync(conversationPath)) {
    fs.writeFileSync(conversationPath, '');
    console.log(`Created ${path.basename(conversationPath)}`);
  } else {
    console.log(`${path.basename(conversationPath)} already exists`);
  }

  // Create truth.template.md if it doesn't exist
  if (!fs.existsSync(templatePath)) {
    fs.writeFileSync(templatePath, DEFAULT_TEMPLATE);
    console.log(`Created ${path.basename(templatePath)}`);
  } else {
    console.log(`${path.basename(templatePath)} already exists`);
  }

  // Create truth.md from template if it doesn't exist
  if (!fs.existsSync(truthPath)) {
    const template = fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath, 'utf-8')
      : DEFAULT_TEMPLATE;
    fs.writeFileSync(truthPath, template);
    console.log(`Created ${path.basename(truthPath)} from template`);
  } else {
    console.log(`${path.basename(truthPath)} already exists`);
  }

  console.log('\nInitialization complete! Start with:');
  console.log('  yap "DECISION: Your first decision here"');
}
