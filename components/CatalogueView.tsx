import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { CatalogueEntry } from '../types';
import { getCatalogue, saveCatalogue, addAuditLog } from '../services/catalogueService';
import { CatalogueEntryForm } from './CatalogueEntryForm';
import { Button } from './Button';
import { Plus, Upload, Download, Trash2, Edit } from 'lucide-react';
import { DEFAULT_CATALOGUE_HEADER } from '../constants';

export const CatalogueView: React.FC = () => {
  const [catalogue, setCatalogue] = useState<CatalogueEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CatalogueEntry | undefined>(undefined);

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

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(catalogue);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogue");
    XLSX.writeFile(wb, "lims_catalogue.xlsx");
    addAuditLog("EXPORT", "Exported catalogue to CSV/XLSX");
  };

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

      // Map incoming data to strict schema
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

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">LIMS Catalogue Master</h1>
          <p className="text-slate-500">Manage standard analysis definitions and codes</p>
        </div>
        <div className="flex gap-3">
          <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImport} />
          </label>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => { setEditingEntry(undefined); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Test Code</th>
                <th className="px-6 py-3">Analysis</th>
                <th className="px-6 py-3">Component</th>
                <th className="px-6 py-3">Units</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Places</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {catalogue.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-mono text-xs font-medium text-slate-600">{entry.testCode}</td>
                  <td className="px-6 py-3 font-medium text-slate-800">{entry.analysisName}</td>
                  <td className="px-6 py-3 text-slate-600">{entry.componentName}</td>
                  <td className="px-6 py-3 text-slate-600">{entry.units}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${entry.resultType === 'N' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {entry.resultType === 'N' ? 'NUM' : 'TXT'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{entry.places}</td>
                  <td className="px-6 py-3 text-right flex justify-end gap-2">
                    <button onClick={() => { setEditingEntry(entry); setIsFormOpen(true); }} className="text-blue-600 hover:text-blue-800 p-1">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {catalogue.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">No catalogue entries found. Import or add one.</td>
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
