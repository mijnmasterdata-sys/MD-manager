import React, { useState } from 'react';
import { CatalogueView } from './components/CatalogueView';
import { ProductListView } from './components/ProductListView';
import { ProductForm } from './components/ProductForm';
import { ImportDocumentModal } from './components/ImportDocumentModal';
import { AuditTrailModal } from './components/AuditTrailModal';
import { ExtractedData, Product } from './types';
import { Beaker, Database, FileText, History } from 'lucide-react';

type ViewState = 'PRODUCTS' | 'CATALOGUE' | 'PRODUCT_FORM';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('PRODUCTS');
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [extractedData, setExtractedData] = useState<ExtractedData | undefined>(undefined);
  const [showImport, setShowImport] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setExtractedData(undefined);
    setCurrentView('PRODUCT_FORM');
  };

  const handleCreateNew = () => {
    // Show import option first?
    if (confirm("Do you want to import from a PDF?")) {
      setShowImport(true);
    } else {
      setEditingProduct(undefined);
      setExtractedData(undefined);
      setCurrentView('PRODUCT_FORM');
    }
  };

  const handleExtractionComplete = (data: ExtractedData) => {
    setExtractedData(data);
    setEditingProduct(undefined);
    setCurrentView('PRODUCT_FORM');
  };

  const handleSaveProduct = () => {
    setCurrentView('PRODUCTS');
    setEditingProduct(undefined);
    setExtractedData(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 flex">
      {/* Sidebar Navigation */}
      <div className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 fixed h-full z-50">
        <div className="mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50 ring-1 ring-white/10">
            <Beaker className="text-white w-6 h-6" />
          </div>
        </div>

        <nav className="flex flex-col gap-4 w-full px-2">
          <NavItem 
            icon={<FileText />} 
            active={currentView === 'PRODUCTS' || currentView === 'PRODUCT_FORM'} 
            onClick={() => setCurrentView('PRODUCTS')} 
            label="Specs"
          />
          <NavItem 
            icon={<Database />} 
            active={currentView === 'CATALOGUE'} 
            onClick={() => setCurrentView('CATALOGUE')} 
            label="Catalogue"
          />
          <NavItem 
            icon={<History />} 
            active={showAudit} 
            onClick={() => setShowAudit(true)} 
            label="Audit"
          />
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="ml-20 flex-1 min-h-screen">
        {currentView === 'PRODUCTS' && (
          <ProductListView 
            onEdit={handleEditProduct} 
            onCreateNew={handleCreateNew} 
          />
        )}
        
        {currentView === 'CATALOGUE' && (
          <CatalogueView />
        )}

        {currentView === 'PRODUCT_FORM' && (
          <ProductForm 
            initialData={editingProduct} 
            extractedData={extractedData}
            onSave={handleSaveProduct}
            onCancel={() => setCurrentView('PRODUCTS')}
          />
        )}
      </div>

      <ImportDocumentModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        onDataExtracted={handleExtractionComplete} 
      />

      <AuditTrailModal 
        isOpen={showAudit} 
        onClose={() => setShowAudit(false)} 
      />
    </div>
  );
}

const NavItem = ({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg transition-all duration-200 group
      ${active 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'}
    `}
  >
    <div className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

export default App;