import React, { useState, useEffect } from 'react';
import { CatalogueEntry } from '../types';
import { Button } from './Button';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialData?: CatalogueEntry;
  onClose: () => void;
  onSave: (entry: CatalogueEntry) => void;
}

const DEFAULT_ENTRY: CatalogueEntry = {
  id: '',
  testCode: '',
  analysisName: '',
  componentName: '',
  units: '',
  category: '',
  resultType: 'N',
  defaultGrade: '',
  places: 2,
  specRule: ''
};

export const CatalogueEntryForm: React.FC<Props> = ({ isOpen, initialData, onClose, onSave }) => {
  const [formData, setFormData] = useState<CatalogueEntry>(DEFAULT_ENTRY);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ? { ...initialData } : { ...DEFAULT_ENTRY, id: crypto.randomUUID() });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'places' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClass = "w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className={labelClass}>Test Code</label>
            <input required name="testCode" value={formData.testCode} onChange={handleChange} className={inputClass} placeholder="e.g. T-100" />
          </div>
          <div className="col-span-1">
            <label className={labelClass}>Category</label>
            <input name="category" value={formData.category} onChange={handleChange} className={inputClass} placeholder="General" />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Analysis Name</label>
            <input required name="analysisName" value={formData.analysisName} onChange={handleChange} className={inputClass} placeholder="e.g. Appearance" />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>Component Name</label>
            <input required name="componentName" value={formData.componentName} onChange={handleChange} className={inputClass} placeholder="e.g. Description" />
          </div>

          <div className="col-span-1">
            <label className={labelClass}>Units</label>
            <input name="units" value={formData.units} onChange={handleChange} className={inputClass} placeholder="e.g. % w/w" />
          </div>
          <div className="col-span-1">
             <label className={labelClass}>Result Type</label>
             <select name="resultType" value={formData.resultType} onChange={handleChange} className={inputClass}>
               <option value="N">Numeric</option>
               <option value="T">Text</option>
             </select>
          </div>

          <div className="col-span-1">
            <label className={labelClass}>Decimals</label>
            <input type="number" name="places" value={formData.places} onChange={handleChange} className={inputClass} />
          </div>
          <div className="col-span-1">
            <label className={labelClass}>Default Grade</label>
            <input name="defaultGrade" value={formData.defaultGrade} onChange={handleChange} className={inputClass} />
          </div>
          
          <div className="col-span-2">
            <label className={labelClass}>Spec Rule</label>
            <input name="specRule" value={formData.specRule} onChange={handleChange} className={inputClass} placeholder="e.g. MIN_MAX" />
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-4 pt-6 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Entry</Button>
          </div>
        </form>
      </div>
    </div>
  );
};