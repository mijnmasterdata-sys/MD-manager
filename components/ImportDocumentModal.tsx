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
      
      // Limit pages to avoid huge extraction times/costs if doc is massive
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">Import Specification</h2>
          <button onClick={onClose} disabled={isLoading} className="text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors"
            >
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-slate-600 font-medium">Click to upload PDF</p>
              <p className="text-slate-400 text-sm mt-1">Supports standard PDF documents</p>
            </div>
          ) : (
            <div className="bg-slate-50 border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded shadow-sm">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} disabled={isLoading} className="text-slate-400 hover:text-red-500">
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
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={processFile} disabled={!file || isLoading} className="w-32">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isLoading ? 'Processing' : 'Process with Gemini'}
          </Button>
        </div>
      </div>
    </div>
  );
};
