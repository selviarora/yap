import {
  parseLineForMarker,
  parseMessageForMarkers,
  bulletExists,
  normalizeBullet,
  findMatchingBulletIndex,
  findBulletByContent,
  parseTruthDocument,
  updateTruthDocument,
  applyMarkersToSections,
} from './parser';

describe('parseLineForMarker', () => {
  it('parses DECISION marker (full form)', () => {
    const result = parseLineForMarker('DECISION: Use PostgreSQL');
    expect(result).toEqual({ type: 'DECISION', content: 'Use PostgreSQL' });
  });

  it('parses D: marker (short form)', () => {
    const result = parseLineForMarker('D: Use PostgreSQL');
    expect(result).toEqual({ type: 'DECISION', content: 'Use PostgreSQL' });
  });

  it('parses T: marker (short form for TODO)', () => {
    const result = parseLineForMarker('T: Write tests');
    expect(result).toEqual({ type: 'TODO', content: 'Write tests' });
  });

  it('parses C: marker (short form for CONSTRAINT)', () => {
    const result = parseLineForMarker('C: Must run on Node 18+');
    expect(result).toEqual({ type: 'CONSTRAINT', content: 'Must run on Node 18+' });
  });

  it('parses Q: marker (short form for QUESTION)', () => {
    const result = parseLineForMarker('Q: Should we use Redis?');
    expect(result).toEqual({ type: 'QUESTION', content: 'Should we use Redis?' });
  });

  it('parses A: marker (short form for ACCEPTANCE)', () => {
    const result = parseLineForMarker('A: User can log in');
    expect(result).toEqual({ type: 'ACCEPTANCE', content: 'User can log in' });
  });

  it('parses D!: marker (short form for DECISION-UPDATE)', () => {
    const result = parseLineForMarker('D!: Use MySQL instead');
    expect(result).toEqual({ type: 'DECISION-UPDATE', content: 'Use MySQL instead' });
  });

  it('parses DEL: marker (short form for DELETE)', () => {
    const result = parseLineForMarker('DEL: Remove old feature');
    expect(result).toEqual({ type: 'DELETE', content: 'Remove old feature' });
  });

  it('parses X: marker (short form for DONE)', () => {
    const result = parseLineForMarker('X: Write tests');
    expect(result).toEqual({ type: 'DONE', content: 'Write tests' });
  });

  it('parses R: marker (short form for RESOLVED)', () => {
    const result = parseLineForMarker('R: Redis question');
    expect(result).toEqual({ type: 'RESOLVED', content: 'Redis question' });
  });

  it('is case-insensitive', () => {
    expect(parseLineForMarker('d: lowercase works')).toEqual({ type: 'DECISION', content: 'lowercase works' });
    expect(parseLineForMarker('decision: also works')).toEqual({ type: 'DECISION', content: 'also works' });
  });

  it('returns null for non-marker lines', () => {
    expect(parseLineForMarker('Just a regular line')).toBeNull();
    expect(parseLineForMarker('')).toBeNull();
    expect(parseLineForMarker('INVALID: not a marker')).toBeNull();
  });

  it('handles extra whitespace', () => {
    const result = parseLineForMarker('  D:   Extra spaces   ');
    expect(result).toEqual({ type: 'DECISION', content: 'Extra spaces' });
  });
});

describe('parseMessageForMarkers', () => {
  it('parses multiple markers from a message (mixed short/long form)', () => {
    const message = `Let me think about this...
D: Use React for the frontend
Some other text
C: Budget is $5000
T: Set up project`;

    const result = parseMessageForMarkers(message);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'DECISION', content: 'Use React for the frontend' });
    expect(result[1]).toEqual({ type: 'CONSTRAINT', content: 'Budget is $5000' });
    expect(result[2]).toEqual({ type: 'TODO', content: 'Set up project' });
  });

  it('returns empty array for message with no markers', () => {
    const result = parseMessageForMarkers('Just chatting about stuff');
    expect(result).toEqual([]);
  });
});

describe('bulletExists (duplicate detection)', () => {
  it('detects exact duplicates', () => {
    const bullets = ['- Use PostgreSQL', '- Use React'];
    expect(bulletExists(bullets, 'Use PostgreSQL')).toBe(true);
  });

  it('detects duplicates with different bullet style', () => {
    const bullets = ['* Use PostgreSQL'];
    expect(bulletExists(bullets, 'Use PostgreSQL')).toBe(true);
  });

  it('is case-insensitive', () => {
    const bullets = ['- Use PostgreSQL'];
    expect(bulletExists(bullets, 'use postgresql')).toBe(true);
  });

  it('returns false for non-duplicates', () => {
    const bullets = ['- Use PostgreSQL'];
    expect(bulletExists(bullets, 'Use MySQL')).toBe(false);
  });

  it('handles checkboxes in bullets', () => {
    const bullets = ['- [x] Completed task'];
    expect(bulletExists(bullets, 'Completed task')).toBe(true);
  });
});

describe('findMatchingBulletIndex (DECISION-UPDATE)', () => {
  it('finds matching bullet by keyword overlap', () => {
    const bullets = [
      '- Use PostgreSQL for the database',
      '- Use React for frontend',
      '- Deploy to AWS',
    ];
    const index = findMatchingBulletIndex(bullets, 'Use MySQL for the database');
    expect(index).toBe(0);
  });

  it('returns -1 when no match found', () => {
    const bullets = ['- Use PostgreSQL', '- Use React'];
    const index = findMatchingBulletIndex(bullets, 'Deploy to Azure');
    expect(index).toBe(-1);
  });

  it('finds best match among multiple candidates', () => {
    const bullets = [
      '- Use PostgreSQL for database storage',
      '- Use React for the frontend framework',
      '- Use Node.js for the backend',
    ];
    const index = findMatchingBulletIndex(bullets, 'Use Vue.js for the frontend framework');
    expect(index).toBe(1);
  });
});

describe('findBulletByContent', () => {
  it('finds exact match', () => {
    const bullets = ['- Write tests', '- Deploy app'];
    expect(findBulletByContent(bullets, 'Write tests')).toBe(0);
  });

  it('finds substring match', () => {
    const bullets = ['- Write unit tests for parser', '- Deploy app'];
    expect(findBulletByContent(bullets, 'unit tests')).toBe(0);
  });

  it('returns -1 for no match', () => {
    const bullets = ['- Write tests'];
    expect(findBulletByContent(bullets, 'completely different')).toBe(-1);
  });
});

describe('parseTruthDocument', () => {
  it('parses sections and their bullets', () => {
    const content = `# Truth Document

## Decisions

- Use PostgreSQL
- Use React

## Constraints

- Budget is $5000

## TODOs

`;
    const sections = parseTruthDocument(content);
    expect(sections.get('## Decisions')).toEqual(['- Use PostgreSQL', '- Use React']);
    expect(sections.get('## Constraints')).toEqual(['- Budget is $5000']);
    expect(sections.get('## TODOs')).toEqual([]);
  });
});

describe('updateTruthDocument', () => {
  const baseTemplate = `# Truth Document

## Domain

## Decisions

## Constraints

## TODOs

`;

  it('adds new bullets to correct sections', () => {
    const markers = [
      { type: 'DECISION' as const, content: 'Use PostgreSQL' },
      { type: 'CONSTRAINT' as const, content: 'Budget is $5000' },
    ];
    const result = updateTruthDocument(baseTemplate, markers);

    expect(result).toContain('- Use PostgreSQL');
    expect(result).toContain('- Budget is $5000');
  });

  it('does not add duplicate bullets', () => {
    const existing = `# Truth Document

## Decisions

- Use PostgreSQL

## Constraints

`;
    const markers = [
      { type: 'DECISION' as const, content: 'Use PostgreSQL' },
      { type: 'DECISION' as const, content: 'Use React' },
    ];
    const result = updateTruthDocument(existing, markers);

    const matches = result.match(/Use PostgreSQL/g);
    expect(matches).toHaveLength(1);
    expect(result).toContain('- Use React');
  });

  it('handles DECISION-UPDATE by replacing matching bullet', () => {
    const existing = `# Truth Document

## Decisions

- Use PostgreSQL for the database
- Use React for frontend

`;
    const markers = [
      { type: 'DECISION-UPDATE' as const, content: 'Use MySQL for the database' },
    ];
    const result = updateTruthDocument(existing, markers);

    expect(result).not.toContain('PostgreSQL');
    expect(result).toContain('- Use MySQL for the database');
    expect(result).toContain('- Use React for frontend');
  });

  it('adds DECISION-UPDATE as new bullet when no match found', () => {
    const existing = `# Truth Document

## Decisions

- Use React for frontend

`;
    const markers = [
      { type: 'DECISION-UPDATE' as const, content: 'Deploy to AWS' },
    ];
    const result = updateTruthDocument(existing, markers);

    expect(result).toContain('- Deploy to AWS');
    expect(result).toContain('- Use React for frontend');
  });
});

describe('applyMarkersToSections', () => {
  it('handles DELETE marker', () => {
    const sections = new Map([
      ['## Decisions', ['- Use PostgreSQL', '- Use React']],
      ['## TODOs', ['- Write tests']],
    ]);

    const markers = [{ type: 'DELETE' as const, content: 'Use PostgreSQL' }];
    const { deletions } = applyMarkersToSections(sections, markers);

    expect(deletions).toHaveLength(1);
    expect(sections.get('## Decisions')).toEqual(['- Use React']);
  });

  it('handles DONE marker (marks TODO complete)', () => {
    const sections = new Map([
      ['## TODOs', ['- Write tests', '- Deploy app']],
    ]);

    const markers = [{ type: 'DONE' as const, content: 'Write tests' }];
    const { updates } = applyMarkersToSections(sections, markers);

    expect(updates.length).toBeGreaterThan(0);
    expect(sections.get('## TODOs')![0]).toContain('[x]');
  });

  it('handles RESOLVED marker (marks question resolved)', () => {
    const sections = new Map([
      ['## Questions', ['- Should we use Redis?', '- What about caching?']],
    ]);

    const markers = [{ type: 'RESOLVED' as const, content: 'Redis' }];
    const { updates } = applyMarkersToSections(sections, markers);

    expect(updates.length).toBeGreaterThan(0);
    expect(sections.get('## Questions')![0]).toContain('[x]');
  });
});
