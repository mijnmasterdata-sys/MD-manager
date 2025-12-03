import React, { useState, useEffect } from 'react';
import { CatalogueEntry, MatchCandidate, ExtractedTest } from '../types';
import { getCatalogue, findBestMatches, saveManualMatch } from '../services/catalogueService';
import { Button } from './Button';
import { X, Search, Check } from 'lucide-react';

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
      
      // Get AI suggested matches
      const matches = findBestMatches(unresolvedTest.name, allEntries);
      setCandidates(matches);
      
      // Initial search filter is empty
      setSearchTerm('');
      setFilteredCatalogue(allEntries.slice(0, 50)); // Show initial batch
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
    // Save preference
    saveManualMatch({
      extractedName: unresolvedTest.name,
      catalogueId: entry.id
    });
    onMatchConfirmed(entry);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b bg-red-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-red-700">Unresolved Test Detected</h2>
              <p className="text-red-600 mt-1">
                The extracted test <span className="font-bold bg-white px-1 rounded border border-red-200">"{unresolvedTest.name}"</span> could not be automatically matched with high confidence.
              </p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Top Candidates Section */}
          {candidates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">AI Suggested Matches</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {candidates.map((cand, idx) => (
                  <div 
                    key={cand.entry.id} 
                    onClick={() => handleSelect(cand.entry)}
                    className="cursor-pointer border-2 border-blue-100 hover:border-blue-500 bg-blue-50/30 p-4 rounded-lg transition-all hover:shadow-md group"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        {Math.round(cand.score * 100)}% Match
                      </span>
                      <Check className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100" />
                    </div>
                    <div className="font-bold text-slate-800">{cand.entry.analysisName}</div>
                    <div className="text-sm text-slate-600">{cand.entry.componentName}</div>
                    <div className="text-xs text-slate-400 mt-2">{cand.entry.testCode}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Search Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Search Full Catalogue</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search analysis, component, or code..." 
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Test Code</th>
                    <th className="px-4 py-2">Analysis</th>
                    <th className="px-4 py-2">Component</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogue.map(entry => (
                    <tr key={entry.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-xs">{entry.testCode}</td>
                      <td className="px-4 py-2">{entry.analysisName}</td>
                      <td className="px-4 py-2">{entry.componentName}</td>
                      <td className="px-4 py-2">
                        <Button size="sm" variant="outline" onClick={() => handleSelect(entry)}>Select</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel Matching</Button>
        </div>
      </div>
    </div>
  );
};
