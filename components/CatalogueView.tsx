import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { CatalogueEntry } from '../types';
import { getCatalogue, saveCatalogue, addAuditLog } from '../services/catalogueService';
import { CatalogueEntryForm } from './CatalogueEntryForm';
import { Button } from './Button';
import { Plus, Upload, Download, Trash2, Edit, FileSpreadsheet } from 'lucide-react';

export const CatalogueView: React.FC = () => {
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CatalogueEntry | undefined>(undefined);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setCatalogue(getCatalogue());
  }, []);

  const handleSave = (entry: CatalogueEntry) => {
    let newCatalogue;
    if (editingEntry) {
      newCatalogue = catalogue.map(c => c.id === entry.id ? entry : c);
    } else {
      newCatalogue = [...catalogue, entry];
    }
    setCatalogue(newCatalogue);
    saveCatalogue(newCatalogue);
    setIsFormOpen(false);
    setEditingEntry(undefined);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const newCatalogue = catalogue.filter(c => c.id !== id);
      setCatalogue(newCatalogue);
      saveCatalogue(newCatalogue);
    }
  };

  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(catalogue);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogue");
    XLSX.writeFile(wb, "lims_catalogue.xlsx");
    addAuditLog("EXPORT", "Exported catalogue to XLSX");
  };

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(catalogue);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "lims_catalogue.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    addAuditLog("EXPORT", "Exported catalogue to CSV");
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const imported: CatalogueEntry[] = data.map(row => ({
        id: crypto.randomUUID(),
        testCode: row.testCode || 'UNKNOWN',
        analysisName: row.analysisName || 'Unknown Analysis',
        componentName: row.componentName || 'Unknown Component',
        units: row.units || '',
        category: row.category || 'General',
        resultType: row.resultType === 'T' ? 'T' : 'N',
        defaultGrade: row.defaultGrade || '',
        places: parseInt(row.places) || 0,
        specRule: row.specRule || ''
      }));

      const merged = [...catalogue, ...imported];
      setCatalogue(merged);
      saveCatalogue(merged);
      addAuditLog("IMPORT", `Imported ${imported.length} entries from CSV`);
    };
    reader.readAsBinaryString(file);
  };

  const filteredCatalogue = catalogue.filter(c => 
    c.analysisName.toLowerCase().includes(search.toLowerCase()) || 
    c.testCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tight mb-2">
            Catalogue Master
          </h1>
          <p className="text-slate-400">Manage standard analysis definitions and codes</p>
        </div>
        <div className="flex gap-3">
           <input 
            type="text" 
            placeholder="Search catalogue..." 
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-600 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <label className="cursor-pointer inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Import
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImport} />
          </label>
          <div className="flex rounded-lg shadow-sm" role="group">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-l-lg hover:bg-slate-800 hover:text-white focus:z-10 focus:ring-2 focus:ring-blue-600"
            >
              CSV
            </button>
            <button
              onClick={handleExportXLSX}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-l-0 border-slate-700 rounded-r-lg hover:bg-slate-800 hover:text-white focus:z-10 focus:ring-2 focus:ring-blue-600"
            >
              XLSX
            </button>
          </div>
          <Button onClick={() => { setEditingEntry(undefined); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden ring-1 ring-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Test Code</th>
                <th className="px-6 py-4">Analysis</th>
                <th className="px-6 py-4">Component</th>
                <th className="px-6 py-4">Units</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Places</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredCatalogue.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-3 font-mono text-xs text-blue-400">{entry.testCode}</td>
                  <td className="px-6 py-3 font-medium text-white">{entry.analysisName}</td>
                  <td className="px-6 py-3 text-slate-400">{entry.componentName}</td>
                  <td className="px-6 py-3 text-slate-400">{entry.units}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${entry.resultType === 'N' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                      {entry.resultType === 'N' ? 'NUMERIC' : 'TEXT'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400">{entry.places}</td>
                  <td className="px-6 py-3 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingEntry(entry); setIsFormOpen(true); }} className="text-slate-400 hover:text-blue-400 p-1 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="text-slate-400 hover:text-red-400 p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCatalogue.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center">
                      <FileSpreadsheet className="w-10 h-10 mb-3 opacity-20" />
                      <p>No catalogue entries found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CatalogueEntryForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSave} 
        initialData={editingEntry} 
      />
    </div>
  );
};