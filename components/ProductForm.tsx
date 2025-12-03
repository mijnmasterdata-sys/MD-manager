import React, { useState, useEffect } from 'react';
import { Product, ProductSpecRow, ExtractedData, CatalogueEntry, ExtractedTest } from '../types';
import { getCatalogue, findBestMatches, saveCatalogue, addAuditLog } from '../services/catalogueService';
import { STORAGE_KEYS } from '../constants';
import { Button } from './Button';
import { ManualMatchModal } from './ManualMatchModal';
import { ExportToolModal } from './ExportToolModal';
import { Save, AlertTriangle, ArrowLeft } from 'lucide-react';

interface Props {
  initialData?: Product;
  extractedData?: ExtractedData;
  onSave: () => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<Props> = ({ initialData, extractedData, onSave, onCancel }) => {
  const [product, setProduct] = useState<Product>({
    id: crypto.randomUUID(),
    name: '',
    code: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    specs: [],
    lastModified: Date.now()
  });

  // Matching Queue for Extracted Data
  const [matchingQueue, setMatchingQueue] = useState<ExtractedTest[]>([]);
  const [currentMatchingTest, setCurrentMatchingTest] = useState<ExtractedTest | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (initialData) {
      setProduct(initialData);
    } else if (extractedData) {
      initializeFromExtraction(extractedData);
    }
  }, [initialData, extractedData]);

  const initializeFromExtraction = (data: ExtractedData) => {
    setProduct(prev => ({
      ...prev,
      name: data.productName || '',
      code: data.productCode || '',
      effectiveDate: data.effectiveDate || prev.effectiveDate
    }));

    const catalogue = getCatalogue();
    const newSpecs: ProductSpecRow[] = [];
    const unresolved: ExtractedTest[] = [];

    let orderCounter = 10;

    data.extractedTests.forEach(test => {
      const matches = findBestMatches(test.name, catalogue);
      
      // Auto-match if top score is very high (e.g. > 0.95 or exact match from manual map)
      const bestMatch = matches[0];
      const isConfident = bestMatch && (bestMatch.score >= 0.9 || bestMatch.reason === 'Manual Override');

      if (isConfident) {
        newSpecs.push(createSpecRow(test, bestMatch.entry, orderCounter));
      } else {
        // Add placeholder unresolved row
        newSpecs.push(createUnresolvedRow(test, orderCounter));
        unresolved.push(test);
      }
      orderCounter += 10;
    });

    setProduct(prev => ({ ...prev, specs: newSpecs }));
    setMatchingQueue(unresolved);
    
    // Start matching process if there are unresolved items
    if (unresolved.length > 0) {
      setCurrentMatchingTest(unresolved[0]);
      setShowMatchModal(true);
    }
  };

  const createSpecRow = (extracted: ExtractedTest, catalogue: CatalogueEntry, order: number): ProductSpecRow => {
    return {
      id: crypto.randomUUID(),
      order,
      catalogueId: catalogue.id,
      analysis: catalogue.analysisName,
      component: catalogue.componentName,
      testCode: catalogue.testCode,
      description: catalogue.analysisName, // Default description
      resultType: catalogue.resultType,
      rule: catalogue.specRule || 'MIN_MAX', // Default rule
      min: extracted.min?.toString() || '',
      max: extracted.max?.toString() || '',
      textSpec: extracted.text || '',
      overrideMin: '',
      overrideMax: '',
      overrideText: '',
      units: extracted.unit || catalogue.units,
      category: catalogue.category,
      grade: catalogue.defaultGrade,
      litRef: '',
      isUnresolved: false,
      originalExtractedName: extracted.name
    };
  };

  const createUnresolvedRow = (extracted: ExtractedTest, order: number): ProductSpecRow => {
    return {
      id: crypto.randomUUID(),
      order,
      catalogueId: null,
      analysis: 'UNRESOLVED',
      component: extracted.name,
      testCode: '???',
      description: extracted.name,
      resultType: 'N', // Assumption
      rule: '',
      min: extracted.min?.toString() || '',
      max: extracted.max?.toString() || '',
      textSpec: extracted.text || '',
      overrideMin: '',
      overrideMax: '',
      overrideText: '',
      units: extracted.unit || '',
      category: '',
      grade: '',
      litRef: '',
      isUnresolved: true,
      originalExtractedName: extracted.name
    };
  };

  const handleManualMatchConfirmed = (entry: CatalogueEntry) => {
    if (!currentMatchingTest) return;

    // Update the spec list
    setProduct(prev => ({
      ...prev,
      specs: prev.specs.map(s => {
        if (s.originalExtractedName === currentMatchingTest.name && s.isUnresolved) {
          return createSpecRow(currentMatchingTest, entry, s.order);
        }
        return s;
      })
    }));

    // Process next in queue
    const nextQueue = matchingQueue.slice(1);
    setMatchingQueue(nextQueue);
    
    if (nextQueue.length > 0) {
      setCurrentMatchingTest(nextQueue[0]);
    } else {
      setShowMatchModal(false);
      setCurrentMatchingTest(null);
    }
  };

  const handleSpecChange = (id: string, field: keyof ProductSpecRow, value: string | number) => {
    setProduct(prev => ({
      ...prev,
      specs: prev.specs.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const saveProduct = () => {
    const productsJson = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    let products: Product[] = productsJson ? JSON.parse(productsJson) : [];
    
    if (initialData) {
      products = products.map(p => p.id === product.id ? product : p);
    } else {
      products.push(product);
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    addAuditLog('SAVE_PRODUCT', `Saved product ${product.code}`);
    onSave();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {initialData ? 'Edit Product Specification' : 'New Specification Build'}
            </h2>
            <div className="flex gap-4 mt-1">
              <input 
                placeholder="Product Name" 
                value={product.name}
                onChange={e => setProduct({...product, name: e.target.value})}
                className="text-sm border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-1 font-medium text-slate-700 w-64"
              />
              <input 
                placeholder="Code" 
                value={product.code}
                onChange={e => setProduct({...product, code: e.target.value})}
                className="text-sm border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-1 font-mono text-slate-600 w-32"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {matchingQueue.length > 0 && (
            <Button variant="danger" onClick={() => setShowMatchModal(true)}>
              Resolve {matchingQueue.length} Issues
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowExportModal(true)}>Export Excel</Button>
          <Button onClick={saveProduct}>
            <Save className="w-4 h-4 mr-2" />
            Save Product
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4">
        <div className="bg-white border rounded shadow-sm overflow-hidden min-w-[1600px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-2 border w-12">Ord</th>
                <th className="p-2 border w-24">Test Code</th>
                <th className="p-2 border w-32">Analysis</th>
                <th className="p-2 border w-32">Component</th>
                <th className="p-2 border w-20">Rule</th>
                
                <th className="p-2 border w-20 bg-blue-50">Min</th>
                <th className="p-2 border w-20 bg-blue-50">Max</th>
                <th className="p-2 border w-32 bg-blue-50">Text</th>
                
                <th className="p-2 border w-20 bg-yellow-50">Ovr Min</th>
                <th className="p-2 border w-20 bg-yellow-50">Ovr Max</th>
                <th className="p-2 border w-32 bg-yellow-50">Ovr Text</th>
                
                <th className="p-2 border w-16">Units</th>
                <th className="p-2 border w-16">Grade</th>
                <th className="p-2 border w-24">Lit Ref</th>
              </tr>
            </thead>
            <tbody>
              {product.specs.sort((a,b) => a.order - b.order).map(spec => (
                <tr key={spec.id} className={`hover:bg-blue-50/50 ${spec.isUnresolved ? 'bg-red-50' : ''}`}>
                  <td className="p-0 border">
                    <input 
                      type="number"
                      value={spec.order}
                      onChange={(e) => handleSpecChange(spec.id, 'order', parseInt(e.target.value))}
                      className="w-full p-2 bg-transparent outline-none text-center"
                    />
                  </td>
                  <td className="p-2 border font-mono text-[10px]">{spec.testCode}</td>
                  <td className="p-2 border truncate" title={spec.analysis}>
                    {spec.isUnresolved && <AlertTriangle className="w-3 h-3 text-red-500 inline mr-1"/>}
                    {spec.analysis}
                  </td>
                  <td className="p-2 border truncate" title={spec.component}>{spec.component}</td>
                  <td className="p-0 border">
                    <input 
                      value={spec.rule}
                      onChange={(e) => handleSpecChange(spec.id, 'rule', e.target.value)}
                      className="w-full p-2 bg-transparent outline-none"
                    />
                  </td>
                  
                  {/* Extracted/Default Values */}
                  <td className="p-0 border bg-blue-50/20">
                    <input 
                      value={spec.min}
                      onChange={(e) => handleSpecChange(spec.id, 'min', e.target.value)}
                      className="w-full p-2 bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-0 border bg-blue-50/20">
                     <input 
                      value={spec.max}
                      onChange={(e) => handleSpecChange(spec.id, 'max', e.target.value)}
                      className="w-full p-2 bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-0 border bg-blue-50/20">
                     <input 
                      value={spec.textSpec}
                      onChange={(e) => handleSpecChange(spec.id, 'textSpec', e.target.value)}
                      className="w-full p-2 bg-transparent outline-none"
                    />
                  </td>

                  {/* Override Values */}
                  <td className="p-0 border bg-yellow-50/20">
                    <input 
                      value={spec.overrideMin}
                      onChange={(e) => handleSpecChange(spec.id, 'overrideMin', e.target.value)}
                      className="w-full p-2 bg-transparent outline-none"
                      placeholder="-"
                    />
                  </td>
                  <td className="p-0 border bg-yellow-50/20">
                     <input 
                      value={spec.overrideMax}
                      onChange={(e) => handleSpecChange(spec.id, 'overrideMax', e.target.value)}
                      className="w-full p-2 bg-transparent outline-none"
                      placeholder="-"
                    />
                  </td>
                  <td className="p-0 border bg-yellow-50/20">
                     <input 
                      value={spec.overrideText}
                      onChange={(e) => handleSpecChange(spec.id, 'overrideText', e.target.value)}
                      className="w-full p-2 bg-transparent outline-none"
                      placeholder="-"
                    />
                  </td>

                  <td className="p-2 border">{spec.units}</td>
                  <td className="p-0 border">
                     <input 
                      value={spec.grade}
                      onChange={(e) => handleSpecChange(spec.id, 'grade', e.target.value)}
                      className="w-full p-2 bg-transparent outline-none"
                    />
                  </td>
                  <td className="p-0 border">
                     <input 
                      value={spec.litRef}
                      onChange={(e) => handleSpecChange(spec.id, 'litRef', e.target.value)}
                      className="w-full p-2 bg-transparent outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ManualMatchModal 
        isOpen={showMatchModal}
        unresolvedTest={currentMatchingTest}
        onClose={() => setShowMatchModal(false)}
        onMatchConfirmed={handleManualMatchConfirmed}
      />

      <ExportToolModal
        isOpen={showExportModal}
        product={product}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};