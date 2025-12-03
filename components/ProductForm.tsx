import React, { useState, useEffect } from 'react';
import { Product, ProductSpecRow, ExtractedData, CatalogueEntry, ExtractedTest } from '../types';
import { getCatalogue, findBestMatches, saveCatalogue, addAuditLog } from '../services/catalogueService';
import { STORAGE_KEYS } from '../constants';
import { Button } from './Button';
import { ManualMatchModal } from './ManualMatchModal';
import { ExportToolModal } from './ExportToolModal';
import { Save, AlertTriangle, ArrowLeft, Wand2 } from 'lucide-react';

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
      const bestMatch = matches[0];
      const isConfident = bestMatch && (bestMatch.score >= 0.9 || bestMatch.reason === 'Manual Override');

      if (isConfident) {
        newSpecs.push(createSpecRow(test, bestMatch.entry, orderCounter));
      } else {
        newSpecs.push(createUnresolvedRow(test, orderCounter));
        unresolved.push(test);
      }
      orderCounter += 10;
    });

    setProduct(prev => ({ ...prev, specs: newSpecs }));
    setMatchingQueue(unresolved);
    
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
      description: catalogue.analysisName, 
      resultType: catalogue.resultType,
      rule: catalogue.specRule || 'MIN_MAX',
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
      resultType: 'N',
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
    setProduct(prev => ({
      ...prev,
      specs: prev.specs.map(s => {
        if (s.originalExtractedName === currentMatchingTest.name && s.isUnresolved) {
          return createSpecRow(currentMatchingTest, entry, s.order);
        }
        return s;
      })
    }));
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

  const inputCellBase = "w-full p-3 bg-transparent outline-none transition-all placeholder-opacity-30";

  return (
    <div className="flex flex-col h-[calc(100vh)] overflow-hidden bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-20 shadow-lg shadow-black/20">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex gap-4 items-baseline mb-1">
               <input 
                placeholder="Product Name" 
                value={product.name}
                onChange={e => setProduct({...product, name: e.target.value})}
                className="text-lg font-bold bg-transparent border-b-2 border-transparent hover:border-slate-600 focus:border-blue-500 outline-none text-white placeholder-slate-600 w-80 transition-colors"
              />
               <input 
                placeholder="Code" 
                value={product.code}
                onChange={e => setProduct({...product, code: e.target.value})}
                className="text-sm font-mono bg-slate-800/50 rounded px-2 py-0.5 border border-transparent focus:border-blue-500 outline-none text-blue-400 w-32 text-center"
              />
            </div>
            <p className="text-xs text-slate-500 flex gap-2">
              <span>Effective: {product.effectiveDate}</span>
              <span>•</span>
              <span>{product.specs.length} Tests</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {matchingQueue.length > 0 && (
            <Button variant="danger" onClick={() => setShowMatchModal(true)} className="animate-pulse">
              <Wand2 className="w-4 h-4 mr-2" />
              Resolve {matchingQueue.length} Issues
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowExportModal(true)}>Export Excel</Button>
          <Button onClick={saveProduct}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-slate-950 p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden min-w-[2000px] ring-1 ring-white/5">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-bold sticky top-0 z-10 shadow-lg border-b border-slate-800 uppercase tracking-wide">
              <tr>
                <th className="p-3 border-r border-slate-800 w-12 text-center">#</th>
                <th className="p-3 border-r border-slate-800 w-48">Analysis</th>
                <th className="p-3 border-r border-slate-800 w-48">Component</th>
                <th className="p-3 border-r border-slate-800 w-28">Test Code</th>
                <th className="p-3 border-r border-slate-800 w-48">Description</th>
                <th className="p-3 border-r border-slate-800 w-24">Rule</th>
                
                <th className="p-3 border-r border-slate-800 w-24 bg-blue-950/30 text-blue-300">Min</th>
                <th className="p-3 border-r border-slate-800 w-24 bg-blue-950/30 text-blue-300">Max</th>
                <th className="p-3 border-r border-slate-800 w-48 bg-blue-950/30 text-blue-300">Text</th>
                
                <th className="p-3 border-r border-slate-800 w-24 bg-yellow-900/10 text-yellow-500">Ovr Min</th>
                <th className="p-3 border-r border-slate-800 w-24 bg-yellow-900/10 text-yellow-500">Ovr Max</th>
                <th className="p-3 border-r border-slate-800 w-48 bg-yellow-900/10 text-yellow-500">Ovr Text</th>
                
                <th className="p-3 border-r border-slate-800 w-24">Units</th>
                <th className="p-3 border-r border-slate-800 w-24">Grade</th>
                <th className="p-3 border-r border-slate-800 w-24">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {product.specs.sort((a,b) => a.order - b.order).map(spec => (
                <tr key={spec.id} className={`group hover:bg-slate-800/50 transition-colors ${spec.isUnresolved ? 'bg-red-900/10' : ''}`}>
                  <td className="p-0 border-r border-slate-800">
                    <input 
                      type="number"
                      value={spec.order}
                      onChange={(e) => handleSpecChange(spec.id, 'order', parseInt(e.target.value))}
                      className={`${inputCellBase} text-center text-slate-500 font-mono focus:bg-slate-800`}
                    />
                  </td>
                  <td className="p-3 border-r border-slate-800 truncate font-medium text-white flex items-center gap-2" title={spec.analysis}>
                    {spec.isUnresolved && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0"/>}
                    {spec.analysis}
                  </td>
                  <td className="p-3 border-r border-slate-800 truncate text-slate-300" title={spec.component}>{spec.component}</td>
                  <td className="p-3 border-r border-slate-800 font-mono text-[10px] text-blue-400">{spec.testCode}</td>
                  <td className="p-3 border-r border-slate-800 truncate text-slate-400" title={spec.description}>{spec.description}</td>
                  <td className="p-0 border-r border-slate-800">
                    <input 
                      value={spec.rule}
                      onChange={(e) => handleSpecChange(spec.id, 'rule', e.target.value)}
                      className={`${inputCellBase} text-slate-300 focus:bg-slate-800 focus:text-white`}
                    />
                  </td>
                  
                  {/* Extracted/Default Values */}
                  <td className="p-0 border-r border-slate-800 bg-blue-900/5 group-hover:bg-blue-900/10 transition-colors">
                    <input 
                      value={spec.min}
                      onChange={(e) => handleSpecChange(spec.id, 'min', e.target.value)}
                      className={`${inputCellBase} text-blue-200 placeholder-blue-900/50 focus:bg-blue-500/10 focus:ring-1 focus:ring-inset focus:ring-blue-500/50`}
                      placeholder="-"
                    />
                  </td>
                  <td className="p-0 border-r border-slate-800 bg-blue-900/5 group-hover:bg-blue-900/10 transition-colors">
                     <input 
                      value={spec.max}
                      onChange={(e) => handleSpecChange(spec.id, 'max', e.target.value)}
                      className={`${inputCellBase} text-blue-200 placeholder-blue-900/50 focus:bg-blue-500/10 focus:ring-1 focus:ring-inset focus:ring-blue-500/50`}
                      placeholder="-"
                    />
                  </td>
                  <td className="p-0 border-r border-slate-800 bg-blue-900/5 group-hover:bg-blue-900/10 transition-colors">
                     <input 
                      value={spec.textSpec}
                      onChange={(e) => handleSpecChange(spec.id, 'textSpec', e.target.value)}
                      className={`${inputCellBase} text-blue-200 placeholder-blue-900/50 focus:bg-blue-500/10 focus:ring-1 focus:ring-inset focus:ring-blue-500/50`}
                      placeholder="-"
                    />
                  </td>

                  {/* Override Values */}
                  <td className="p-0 border-r border-slate-800 bg-yellow-900/5 group-hover:bg-yellow-900/10 transition-colors">
                    <input 
                      value={spec.overrideMin}
                      onChange={(e) => handleSpecChange(spec.id, 'overrideMin', e.target.value)}
                      className={`${inputCellBase} font-medium text-yellow-400 placeholder-yellow-900/30 focus:bg-yellow-500/10 focus:ring-1 focus:ring-inset focus:ring-yellow-500/50`}
                      placeholder="Override"
                    />
                  </td>
                  <td className="p-0 border-r border-slate-800 bg-yellow-900/5 group-hover:bg-yellow-900/10 transition-colors">
                     <input 
                      value={spec.overrideMax}
                      onChange={(e) => handleSpecChange(spec.id, 'overrideMax', e.target.value)}
                      className={`${inputCellBase} font-medium text-yellow-400 placeholder-yellow-900/30 focus:bg-yellow-500/10 focus:ring-1 focus:ring-inset focus:ring-yellow-500/50`}
                      placeholder="Override"
                    />
                  </td>
                  <td className="p-0 border-r border-slate-800 bg-yellow-900/5 group-hover:bg-yellow-900/10 transition-colors">
                     <input 
                      value={spec.overrideText}
                      onChange={(e) => handleSpecChange(spec.id, 'overrideText', e.target.value)}
                      className={`${inputCellBase} font-medium text-yellow-400 placeholder-yellow-900/30 focus:bg-yellow-500/10 focus:ring-1 focus:ring-inset focus:ring-yellow-500/50`}
                      placeholder="Override"
                    />
                  </td>

                  <td className="p-3 border-r border-slate-800 text-slate-400">{spec.units}</td>
                  <td className="p-0 border-r border-slate-800">
                     <input 
                      value={spec.grade}
                      onChange={(e) => handleSpecChange(spec.id, 'grade', e.target.value)}
                      className={`${inputCellBase} text-slate-300 focus:bg-slate-800 focus:text-white`}
                    />
                  </td>
                  <td className="p-0 border-r border-slate-800">
                     <input 
                      value={spec.litRef}
                      onChange={(e) => handleSpecChange(spec.id, 'litRef', e.target.value)}
                      className={`${inputCellBase} text-slate-300 focus:bg-slate-800 focus:text-white`}
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