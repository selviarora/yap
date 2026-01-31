export type MarkerType =
  | 'DECISION'
  | 'CONSTRAINT'
  | 'DOMAIN'
  | 'UX'
  | 'ACCEPTANCE'
  | 'QUESTION'
  | 'TODO'
  | 'DECISION-UPDATE'
  | 'DELETE'
  | 'DONE'
  | 'RESOLVED';

export interface ParsedMarker {
  type: MarkerType;
  content: string;
}

// Map marker types to section headers in truth.md
export const MARKER_TO_SECTION: Record<MarkerType, string> = {
  'DECISION': '## Decisions',
  'CONSTRAINT': '## Constraints',
  'DOMAIN': '## Domain',
  'UX': '## UX',
  'ACCEPTANCE': '## Acceptance Criteria',
  'QUESTION': '## Questions',
  'TODO': '## TODOs',
  'DECISION-UPDATE': '## Decisions',
  'DELETE': '', // Special handling
  'DONE': '## TODOs',
  'RESOLVED': '## Questions',
};

// Short forms mapping to full marker types
const SHORT_FORMS: Record<string, MarkerType> = {
  'D': 'DECISION',
  'C': 'CONSTRAINT',
  'DOM': 'DOMAIN',
  'UX': 'UX',
  'A': 'ACCEPTANCE',
  'Q': 'QUESTION',
  'T': 'TODO',
  'D!': 'DECISION-UPDATE',
  'DEL': 'DELETE',
  'X': 'DONE',        // X for "done" / checked
  'R': 'RESOLVED',
};

// Full forms
const FULL_FORMS: Record<string, MarkerType> = {
  'DECISION': 'DECISION',
  'CONSTRAINT': 'CONSTRAINT',
  'DOMAIN': 'DOMAIN',
  'UX': 'UX',
  'ACCEPTANCE': 'ACCEPTANCE',
  'QUESTION': 'QUESTION',
  'TODO': 'TODO',
  'DECISION-UPDATE': 'DECISION-UPDATE',
  'DELETE': 'DELETE',
  'DONE': 'DONE',
  'RESOLVED': 'RESOLVED',
};

// Combined pattern: matches both short and long forms
// Short: D:, C:, T:, Q:, A:, UX:, DOM:, D!:, DEL:, X:, R:
// Long: DECISION:, CONSTRAINT:, etc.
const ALL_MARKERS = { ...SHORT_FORMS, ...FULL_FORMS };
const MARKER_KEYS = Object.keys(ALL_MARKERS).sort((a, b) => b.length - a.length); // Longer first
const MARKER_PATTERN = new RegExp(
  `^(${MARKER_KEYS.map(k => k.replace('!', '\\!')).join('|')}):\\s*(.+)$`,
  'i'
);

/**
 * Parse a single line for markers
 */
export function parseLineForMarker(line: string): ParsedMarker | null {
  const trimmed = line.trim();
  const match = trimmed.match(MARKER_PATTERN);

  if (!match) {
    return null;
  }

  const rawType = match[1].toUpperCase();
  const content = match[2].trim();

  // Resolve short form to full type
  const type = ALL_MARKERS[rawType];
  if (!type) {
    return null;
  }

  return { type, content };
}

/**
 * Parse a message for all markers (multi-line support)
 */
export function parseMessageForMarkers(message: string): ParsedMarker[] {
  const lines = message.split('\n');
  const markers: ParsedMarker[] = [];

  for (const line of lines) {
    const marker = parseLineForMarker(line);
    if (marker) {
      markers.push(marker);
    }
  }

  return markers;
}

/**
 * Normalize a bullet point for comparison (removes leading - and whitespace, and checkbox)
 */
export function normalizeBullet(bullet: string): string {
  return bullet
    .replace(/^[-*]\s*/, '')
    .replace(/^\[[ x]\]\s*/i, '') // Remove checkbox
    .trim()
    .toLowerCase();
}

/**
 * Check if a bullet already exists in a list of bullets
 */
export function bulletExists(bullets: string[], newBullet: string): boolean {
  const normalizedNew = normalizeBullet(newBullet);
  return bullets.some(b => normalizeBullet(b) === normalizedNew);
}

/**
 * Find the best matching bullet for an update (improved matching)
 */
export function findMatchingBulletIndex(bullets: string[], updateContent: string): number {
  const updateLower = updateContent.toLowerCase();
  const updateWords = updateLower.split(/\s+/).filter(w => w.length > 2);

  let bestMatchIndex = -1;
  let bestMatchScore = 0;

  for (let i = 0; i < bullets.length; i++) {
    const bulletLower = normalizeBullet(bullets[i]);
    const bulletWords = bulletLower.split(/\s+/);

    // Exact substring match gets highest priority
    if (bulletLower.includes(updateLower) || updateLower.includes(bulletLower)) {
      return i;
    }

    // Count word overlaps
    let score = 0;
    for (const word of updateWords) {
      if (bulletWords.some(bw => bw.includes(word) || word.includes(bw))) {
        score++;
      }
    }

    // Require at least 2 matching words or 40% overlap
    const threshold = Math.max(2, Math.floor(updateWords.length * 0.4));
    if (score >= threshold && score > bestMatchScore) {
      bestMatchScore = score;
      bestMatchIndex = i;
    }
  }

  return bestMatchIndex;
}

/**
 * Find bullet index by content match (for DELETE, DONE, RESOLVED)
 */
export function findBulletByContent(bullets: string[], searchContent: string): number {
  const searchLower = searchContent.toLowerCase().trim();

  // First try exact match
  for (let i = 0; i < bullets.length; i++) {
    if (normalizeBullet(bullets[i]) === searchLower) {
      return i;
    }
  }

  // Then try substring match
  for (let i = 0; i < bullets.length; i++) {
    const bulletNorm = normalizeBullet(bullets[i]);
    if (bulletNorm.includes(searchLower) || searchLower.includes(bulletNorm)) {
      return i;
    }
  }

  // Fall back to word matching
  return findMatchingBulletIndex(bullets, searchContent);
}

/**
 * Parse truth.md content into sections
 */
export function parseTruthDocument(content: string): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  const lines = content.split('\n');

  let currentSection: string | null = null;
  let currentBullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if this is a section header
    if (trimmed.startsWith('## ')) {
      // Save previous section if exists
      if (currentSection) {
        sections.set(currentSection, currentBullets);
      }
      currentSection = trimmed;
      currentBullets = [];
    } else if (currentSection && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
      // This is a bullet point in the current section
      currentBullets.push(trimmed);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    sections.set(currentSection, currentBullets);
  }

  return sections;
}

/**
 * Apply markers to sections (mutates sections map)
 */
export function applyMarkersToSections(
  sections: Map<string, string[]>,
  markers: ParsedMarker[]
): { deletions: string[]; updates: string[] } {
  const deletions: string[] = [];
  const updates: string[] = [];

  for (const marker of markers) {
    const section = MARKER_TO_SECTION[marker.type];

    if (marker.type === 'DELETE') {
      // Try to delete from any section
      for (const [sectionName, bullets] of sections) {
        const idx = findBulletByContent(bullets, marker.content);
        if (idx >= 0) {
          deletions.push(bullets[idx]);
          bullets.splice(idx, 1);
          break;
        }
      }
    } else if (marker.type === 'DONE') {
      // Mark a TODO as done (add checkbox)
      const bullets = sections.get('## TODOs') || [];
      const idx = findBulletByContent(bullets, marker.content);
      if (idx >= 0) {
        const oldBullet = bullets[idx];
        // Add [x] checkbox if not already there
        if (!oldBullet.includes('[x]') && !oldBullet.includes('[X]')) {
          bullets[idx] = oldBullet.replace(/^([-*]\s*)(\[[ ]\]\s*)?/, '$1[x] ');
          updates.push(`Marked done: ${marker.content}`);
        }
      }
    } else if (marker.type === 'RESOLVED') {
      // Mark a question as resolved (add checkbox or move)
      const bullets = sections.get('## Questions') || [];
      const idx = findBulletByContent(bullets, marker.content);
      if (idx >= 0) {
        const oldBullet = bullets[idx];
        if (!oldBullet.includes('[x]') && !oldBullet.includes('[X]')) {
          bullets[idx] = oldBullet.replace(/^([-*]\s*)(\[[ ]\]\s*)?/, '$1[x] ');
          updates.push(`Resolved: ${marker.content}`);
        }
      }
    } else if (marker.type === 'DECISION-UPDATE') {
      const bullets = sections.get(section) || [];
      const idx = findMatchingBulletIndex(bullets, marker.content);
      if (idx >= 0) {
        updates.push(`Updated: "${bullets[idx]}" → "${marker.content}"`);
        bullets[idx] = `- ${marker.content}`;
      } else {
        // No match found, add as new
        if (!bulletExists(bullets, marker.content)) {
          bullets.push(`- ${marker.content}`);
        }
      }
      sections.set(section, bullets);
    } else {
      // Regular add
      const bullets = sections.get(section) || [];
      if (!bulletExists(bullets, marker.content)) {
        bullets.push(`- ${marker.content}`);
      }
      sections.set(section, bullets);
    }
  }

  return { deletions, updates };
}

/**
 * Rebuild truth.md from sections
 */
export function rebuildTruthDocument(
  originalContent: string,
  sections: Map<string, string[]>
): string {
  const lines = originalContent.split('\n');
  const result: string[] = [];

  let currentSection: string | null = null;
  let skipBullets = false;
  let bulletsWritten = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      // Write pending bullets for previous section
      if (currentSection && !bulletsWritten) {
        const bullets = sections.get(currentSection) || [];
        for (const bullet of bullets) {
          result.push(bullet);
        }
        if (bullets.length > 0) {
          result.push('');
        }
      }

      currentSection = trimmed;
      skipBullets = false;
      bulletsWritten = false;
      result.push(line);
    } else if (currentSection && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
      // Skip original bullets, write our version once
      if (!bulletsWritten) {
        const bullets = sections.get(currentSection) || [];
        for (const bullet of bullets) {
          result.push(bullet);
        }
        bulletsWritten = true;
      }
      // Skip this original bullet line
    } else if (trimmed.startsWith('<!--') && currentSection && !bulletsWritten) {
      // Comment line - write bullets before it
      const bullets = sections.get(currentSection) || [];
      for (const bullet of bullets) {
        result.push(bullet);
      }
      bulletsWritten = true;
      result.push(line);
    } else {
      result.push(line);
    }
  }

  // Handle last section
  if (currentSection && !bulletsWritten) {
    const bullets = sections.get(currentSection) || [];
    for (const bullet of bullets) {
      result.push(bullet);
    }
  }

  return result.join('\n');
}

/**
 * Update truth.md content with new markers (simplified - uses applyMarkersToSections)
 */
export function updateTruthDocument(
  truthContent: string,
  markers: ParsedMarker[]
): string {
  const sections = parseTruthDocument(truthContent);
  applyMarkersToSections(sections, markers);
  return rebuildTruthDocument(truthContent, sections);
}
