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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <div className="fixed left-0 top-0 bottom-0 w-20 bg-slate-900 flex flex-col items-center py-6 z-50 shadow-xl">
        <div className="mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
            <Beaker className="text-white w-6 h-6" />
          </div>
        </div>

        <nav className="flex flex-col gap-6 w-full">
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
      <div className="ml-20 min-h-screen">
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
    className={`w-full flex flex-col items-center justify-center gap-1 py-3 transition-all
      ${active ? 'text-blue-400 border-r-2 border-blue-400 bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}
    `}
  >
    <div className={`w-6 h-6 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
