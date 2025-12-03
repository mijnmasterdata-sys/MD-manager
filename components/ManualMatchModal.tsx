import React, { useState, useEffect } from 'react';
import { CatalogueEntry, MatchCandidate, ExtractedTest } from '../types';
import { getCatalogue, findBestMatches, saveManualMatch } from '../services/catalogueService';
import { Button } from './Button';
import { X, Search, Check, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  unresolvedTest: ExtractedTest | null;
  onClose: () => void;
  onMatchConfirmed: (catalogueEntry: CatalogueEntry) => void;
}

export const ManualMatchModal: React.FC<Props> = ({ isOpen, unresolvedTest, onClose, onMatchConfirmed }) => {
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  const [filteredCatalogue, setFilteredCatalogue] = useState<CatalogueEntry[]>([]);

  useEffect(() => {
    if (isOpen && unresolvedTest) {
      const allEntries = getCatalogue();
      setCatalogue(allEntries);
      const matches = findBestMatches(unresolvedTest.name, allEntries);
      setCandidates(matches);
      setSearchTerm('');
      setFilteredCatalogue(allEntries.slice(0, 50)); 
    }
  }, [isOpen, unresolvedTest]);

  useEffect(() => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      setFilteredCatalogue(
        catalogue.filter(c => 
          c.analysisName.toLowerCase().includes(lower) || 
          c.componentName.toLowerCase().includes(lower) ||
          c.testCode.toLowerCase().includes(lower)
        ).slice(0, 20)
      );
    } else {
      setFilteredCatalogue(catalogue.slice(0, 50));
    }
  }, [searchTerm, catalogue]);

  if (!isOpen || !unresolvedTest) return null;

  const handleSelect = (entry: CatalogueEntry) => {
    saveManualMatch({
      extractedName: unresolvedTest.name,
      catalogueId: entry.id
    });
    onMatchConfirmed(entry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-red-900/30 bg-red-950/10">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
               <div className="p-2 bg-red-500/10 rounded-lg">
                 <AlertTriangle className="w-6 h-6 text-red-500" />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-white">Unresolved Test Detected</h2>
                  <p className="text-slate-400 mt-1">
                    Extracted text: <span className="font-mono text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30">"{unresolvedTest.name}"</span>
                  </p>
               </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-900">
          
          {candidates.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">AI Suggested Matches</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {candidates.map((cand, idx) => (
                  <div 
                    key={cand.entry.id} 
                    onClick={() => handleSelect(cand.entry)}
                    className="cursor-pointer border border-slate-700 bg-slate-800/50 p-5 rounded-xl transition-all hover:border-blue-500 hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-900/20 group relative"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-950/50 border border-blue-900 px-2 py-1 rounded-full uppercase tracking-wide">
                        {Math.round(cand.score * 100)}% Match
                      </span>
                      <Check className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="font-bold text-slate-100 mb-1">{cand.entry.analysisName}</div>
                    <div className="text-sm text-slate-400">{cand.entry.componentName}</div>
                    <div className="text-xs font-mono text-slate-500 mt-3 pt-3 border-t border-slate-700">{cand.entry.testCode}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Search Full Catalogue</h3>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search analysis, component, or code..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="border border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-slate-950/50">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900 sticky top-0 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3 border-b border-slate-700">Test Code</th>
                    <th className="px-5 py-3 border-b border-slate-700">Analysis</th>
                    <th className="px-5 py-3 border-b border-slate-700">Component</th>
                    <th className="px-5 py-3 border-b border-slate-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredCatalogue.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-blue-400">{entry.testCode}</td>
                      <td className="px-5 py-3 text-slate-200">{entry.analysisName}</td>
                      <td className="px-5 py-3 text-slate-400">{entry.componentName}</td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="secondary" onClick={() => handleSelect(entry)}>Select</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Skip Matching</Button>
        </div>
      </div>
    </div>
  );
};