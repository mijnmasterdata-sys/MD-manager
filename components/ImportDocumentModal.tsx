import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { X, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import pdfjs from '../pdf-worker';
import { parsePDFText } from '../services/geminiService';
import { ExtractedData } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted: (data: ExtractedData) => void;
}

export const ImportDocumentModal: React.FC<Props> = ({ isOpen, onClose, onDataExtracted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Read File
      const arrayBuffer = await file.arrayBuffer();
      
      // 2. Extract Text via PDF.js
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      const maxPages = Math.min(pdf.numPages, 10); 
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      if (!fullText.trim()) {
        throw new Error("Could not extract text from PDF. It might be scanned/image-only.");
      }

      // 3. Send to Gemini
      const extractedData = await parsePDFText(fullText);
      
      onDataExtracted(extractedData);
      onClose();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process document");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-white">Import Specification</h2>
            <p className="text-sm text-slate-400">Extract data from a PDF document</p>
          </div>
          <button onClick={onClose} disabled={isLoading} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 hover:border-blue-500 transition-all group"
            >
              <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
              </div>
              <p className="text-slate-300 font-medium group-hover:text-blue-400">Click to upload PDF</p>
              <p className="text-slate-500 text-sm mt-1">Supports standard PDF documents</p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-slate-800 p-3 rounded-lg shadow-sm">
                  <FileText className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-white truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} disabled={isLoading} className="text-slate-500 hover:text-red-400 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".pdf" 
            className="hidden" 
            onChange={handleFileChange}
          />

          {error && (
            <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={processFile} disabled={!file || isLoading} className="w-40">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isLoading ? 'Processing...' : 'Start Extraction'}
          </Button>
        </div>
      </div>
    </div>
  );
};