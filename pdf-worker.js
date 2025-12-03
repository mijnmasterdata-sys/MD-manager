import * as pdfjs from 'pdfjs-dist';
import { PDF_WORKER_URL } from './constants';

// Set up the worker source globally
// Note: In a real Vite app, you might use 'pdfjs-dist/build/pdf.worker.mjs?url'
// But for this portability, we use the CDN URL defined in constants.
pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

export default pdfjs;
