export const STORAGE_KEYS = {
  CATALOGUE: 'LIMS_CATALOGUE',
  PRODUCTS: 'LIMS_PRODUCTS',
  MANUAL_MATCH: 'LIMS_MANUAL_MATCH',
  AUDIT: 'LIMS_AUDIT',
};

export const DEFAULT_CATALOGUE_HEADER = [
  'testCode', 'analysisName', 'componentName', 'units', 'category', 'resultType', 'defaultGrade', 'places', 'specRule'
];

export const PLACEHOLDER_IMG = "https://picsum.photos/200/300";

// Ensure we point to a valid worker for pdf.js
export const PDF_WORKER_URL = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
