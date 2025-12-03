import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { STORAGE_KEYS } from '../constants';
import { Button } from './Button';
import { Plus, Edit, Trash2, FileText, Search } from 'lucide-react';

interface Props {
  onEdit: (product: Product) => void;
  onCreateNew: () => void;
}

export const ProductListView: React.FC<Props> = ({ onEdit, onCreateNew }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('');

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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    p.code.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tight mb-2">
            Specifications
          </h1>
          <p className="text-slate-400">Manage, edit, and export your LIMS product builds.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search products..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 transition-all placeholder-slate-600"
            />
          </div>
          <Button size="md" onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Specification
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
               <button onClick={() => onEdit(product)} className="p-2 bg-slate-800 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors shadow-lg">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(product.id)} className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors shadow-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors border border-slate-700/50 group-hover:border-blue-500/20">
                <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0 pr-16">
                 <h3 className="text-lg font-bold text-white truncate mb-1">{product.name || 'Unnamed Product'}</h3>
                 <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-950 text-slate-300 border border-slate-800">
                   {product.code || 'NO-CODE'}
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/50 mt-2">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                {product.specs.length} Tests
              </span>
              <span>Updated {new Date(product.lastModified).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        
        {products.length === 0 && (
          <div className="col-span-full py-24 text-center bg-slate-900/30 rounded-xl border border-dashed border-slate-800 flex flex-col items-center">
            <div className="bg-slate-800/50 p-4 rounded-full mb-4">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No specifications found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Get started by creating a new specification manually or import one from a PDF document.</p>
            <Button variant="outline" onClick={onCreateNew}>Create First Spec</Button>
          </div>
        )}
      </div>
    </div>
  );
};