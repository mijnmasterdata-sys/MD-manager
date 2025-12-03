export interface CatalogueEntry {
  id: string;
  testCode: string;
  analysisName: string;
  componentName: string;
  units: string;
  category: string;
  resultType: 'N' | 'T'; // Numeric or Text
  defaultGrade: string;
  places: number;
  specRule: string;
}

export interface ManualMatch {
  extractedName: string;
  catalogueId: string;
}

export interface ExtractedTest {
  name: string;
  text: string | null;
  min: number | null;
  max: number | null;
  unit: string | null;
  originalName?: string; // For keeping track
}

export interface ExtractedData {
  productName: string | null;
  productCode: string | null;
  effectiveDate: string | null;
  extractedTests: ExtractedTest[];
}

export interface ProductSpecRow {
  id: string;
  order: number;
  catalogueId: string | null; // null if unresolved
  analysis: string; // from Catalogue or Extracted
  component: string; // from Catalogue or Extracted
  testCode: string;
  description: string;
  resultType: string;
  rule: string;
  min: string; // Stored as string to allow empty
  max: string; // Stored as string to allow empty
  textSpec: string;
  overrideMin: string;
  overrideMax: string;
  overrideText: string;
  units: string;
  category: string;
  grade: string;
  litRef: string;
  isUnresolved: boolean;
  originalExtractedName?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  effectiveDate: string;
  specs: ProductSpecRow[];
  lastModified: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  action: string;
  details: string;
}

export interface MatchCandidate {
  entry: CatalogueEntry;
  score: number; // 0 to 1
  reason: string;
}