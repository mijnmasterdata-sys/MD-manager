import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { STORAGE_KEYS } from '../constants';
import { Button } from './Button';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';

interface Props {
  onEdit: (product: Product) => void;
  onCreateNew: () => void;
}

export const ProductListView: React.FC<Props> = ({ onEdit, onCreateNew }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const json = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (json) setProducts(JSON.parse(json));
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this product spec?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Product Specifications</h1>
          <p className="text-slate-500 mt-1">Manage, edit, and export your LIMS product builds.</p>
        </div>
        <Button size="lg" onClick={onCreateNew} className="shadow-lg shadow-blue-500/20">
          <Plus className="w-5 h-5 mr-2" />
          Create New Spec
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">{product.name || 'Unnamed Product'}</h3>
            <div className="flex gap-2 text-sm text-slate-500 font-mono mb-4">
              <span className="bg-slate-100 px-2 py-0.5 rounded">{product.code || 'NO-CODE'}</span>
              <span>•</span>
              <span>{product.specs.length} Tests</span>
            </div>

            <div className="text-xs text-slate-400 border-t pt-4">
              Last Modified: {new Date(product.lastModified).toLocaleDateString()}
            </div>
          </div>
        ))}
        
        {products.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 text-lg">No products found.</p>
            <Button variant="outline" className="mt-4" onClick={onCreateNew}>Get Started</Button>
          </div>
        )}
      </div>
    </div>
  );
};
