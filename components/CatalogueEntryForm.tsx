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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Catalogue Entry' : 'New Catalogue Entry'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Test Code</label>
            <input required name="testCode" value={formData.testCode} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <input name="category" value={formData.category} onChange={handleChange} className="w-full border rounded p-2" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Analysis Name</label>
            <input required name="analysisName" value={formData.analysisName} onChange={handleChange} className="w-full border rounded p-2" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Component Name</label>
            <input required name="componentName" value={formData.componentName} onChange={handleChange} className="w-full border rounded p-2" />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Units</label>
            <input name="units" value={formData.units} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="col-span-1">
             <label className="block text-sm font-medium text-slate-700 mb-1">Result Type</label>
             <select name="resultType" value={formData.resultType} onChange={handleChange} className="w-full border rounded p-2">
               <option value="N">Numeric</option>
               <option value="T">Text</option>
             </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Decimal Places</label>
            <input type="number" name="places" value={formData.places} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Default Grade</label>
            <input name="defaultGrade" value={formData.defaultGrade} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Spec Rule (Default)</label>
            <input name="specRule" value={formData.specRule} onChange={handleChange} className="w-full border rounded p-2" placeholder="e.g. MIN_MAX" />
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Entry</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
