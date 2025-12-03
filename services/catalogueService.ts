import { CatalogueEntry, ManualMatch, MatchCandidate, AuditLog } from '../types';
import { STORAGE_KEYS } from '../constants';

// Helper: Levenshtein Distance
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

// Helper: Normalization
export const normalizeString = (str: string): string => {
  if (!str) return '';
  return str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

// --- CRUD ---

export const getCatalogue = (): CatalogueEntry[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.CATALOGUE);
  return stored ? JSON.parse(stored) : [];
};

export const saveCatalogue = (catalogue: CatalogueEntry[]) => {
  localStorage.setItem(STORAGE_KEYS.CATALOGUE, JSON.stringify(catalogue));
  addAuditLog('CATALOGUE_UPDATE', `Saved ${catalogue.length} entries`);
};

export const getManualMatches = (): ManualMatch[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.MANUAL_MATCH);
  return stored ? JSON.parse(stored) : [];
};

export const saveManualMatch = (match: ManualMatch) => {
  const matches = getManualMatches();
  // Remove existing match for this extraction if any
  const filtered = matches.filter(m => m.extractedName !== match.extractedName);
  filtered.push(match);
  localStorage.setItem(STORAGE_KEYS.MANUAL_MATCH, JSON.stringify(filtered));
  addAuditLog('MANUAL_MATCH', `Mapped "${match.extractedName}" to ${match.catalogueId}`);
};

export const addAuditLog = (action: string, details: string) => {
  const stored = localStorage.getItem(STORAGE_KEYS.AUDIT);
  const logs: AuditLog[] = stored ? JSON.parse(stored) : [];
  const newLog: AuditLog = {
    id: Date.now().toString() + Math.random().toString(),
    timestamp: Date.now(),
    action,
    details
  };
  logs.unshift(newLog); // Prepend
  // Limit to last 1000 logs
  if (logs.length > 1000) logs.pop();
  localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
};

export const getAuditLogs = (): AuditLog[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.AUDIT);
  return stored ? JSON.parse(stored) : [];
};

// --- MATCHING ENGINE ---

export const findBestMatches = (extractedName: string, catalogue: CatalogueEntry[]): MatchCandidate[] => {
  const candidates: MatchCandidate[] = [];
  const normalizedQuery = normalizeString(extractedName);
  
  if (!normalizedQuery) return [];

  // 1. Check Manual Matches first
  const manualMatches = getManualMatches();
  const manual = manualMatches.find(m => m.extractedName === extractedName);
  if (manual) {
    const entry = catalogue.find(c => c.id === manual.catalogueId);
    if (entry) {
      return [{ entry, score: 1, reason: 'Manual Override' }];
    }
  }

  // 2. Fuzzy Matching
  for (const entry of catalogue) {
    const entryName = entry.analysisName + ' ' + entry.componentName;
    const normalizedEntry = normalizeString(entryName);
    const normalizedCode = normalizeString(entry.testCode);

    let score = 0;
    let reason = '';

    // Exact Match
    if (normalizedQuery === normalizedEntry || normalizedQuery === normalizedCode) {
      score = 1.0;
      reason = 'Exact Match';
    } 
    // Contains
    else if (normalizedEntry.includes(normalizedQuery) || normalizedQuery.includes(normalizedEntry)) {
      score = 0.8;
      reason = 'Substring Match';
    } 
    // Levenshtein
    else {
      const dist = levenshteinDistance(normalizedQuery, normalizedEntry);
      const maxLen = Math.max(normalizedQuery.length, normalizedEntry.length);
      const sim = 1 - (dist / maxLen);
      
      if (sim > 0.4) { // Threshold
        score = sim;
        reason = `Fuzzy (${(sim * 100).toFixed(0)}%)`;
      }
    }

    if (score > 0) {
      candidates.push({ entry, score, reason });
    }
  }

  // Sort by score descending
  return candidates.sort((a, b) => b.score - a.score).slice(0, 3);
};
