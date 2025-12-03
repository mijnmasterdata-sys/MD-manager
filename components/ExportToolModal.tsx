import React from 'react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import { Button } from './Button';
import { X, FileSpreadsheet } from 'lucide-react';

interface Props {
  isOpen: boolean;
  product: Product;
  onClose: () => void;
}

export const ExportToolModal: React.FC<Props> = ({ isOpen, product, onClose }) => {
  if (!isOpen) return null;

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // 1. PRODUCT Tab
    const productData = [{
      NAME: product.name,
      DESCRIPTION: product.name,
      PRODUCT_CODE: product.code,
      GROUP_NAME: 'PHARMA',
      ACTIVE_FL: 'T',
      LOCKED_FL: 'F'
    }];
    const wsProduct = XLSX.utils.json_to_sheet(productData);
    XLSX.utils.book_append_sheet(wb, wsProduct, "PRODUCT");

    // 2. PRODUCT_GRADE Tab
    const gradeData = [{
      PRODUCT_CODE: product.code,
      GRADE: 'RELEASE', 
      DESCRIPTION: 'Release Grade',
      SAMPLING_PLAN: 'STD'
    }];
    const wsGrade = XLSX.utils.json_to_sheet(gradeData);
    XLSX.utils.book_append_sheet(wb, wsGrade, "PRODUCT_GRADE");

    // 3. PRODUCT_GRADE_STAGE Tab
    const stageData = [{
      PRODUCT_CODE: product.code,
      GRADE: 'RELEASE',
      STAGE: 'RELEASE',
      DESCRIPTION: 'Finished Product Release'
    }];
    const wsStage = XLSX.utils.json_to_sheet(stageData);
    XLSX.utils.book_append_sheet(wb, wsStage, "PRODUCT_GRADE_STAGE");

    // 4. PRODUCT_SPEC Tab
    const sortedSpecs = [...product.specs].sort((a, b) => a.order - b.order);
    const specData = sortedSpecs.map(spec => ({
      PRODUCT_CODE: product.code,
      GRADE: spec.grade || 'RELEASE',
      STAGE: 'RELEASE',
      ANALYSIS: spec.analysis,
      COMPONENT: spec.component,
      TEST_CODE: spec.testCode,
      DISPLAY_ORDER: spec.order,
      UNITS: spec.units,
      MIN_LIMIT: spec.min,
      MAX_LIMIT: spec.max,
      TEXT_SPEC: spec.textSpec,
      RULE_NAME: spec.rule
    }));
    const wsSpec = XLSX.utils.json_to_sheet(specData);
    XLSX.utils.book_append_sheet(wb, wsSpec, "PRODUCT_SPEC");

    XLSX.writeFile(wb, `${product.code}_Spec_Load.xlsx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="bg-green-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/20">
            <FileSpreadsheet className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Export to Excel</h2>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            Generate a LabWare-compatible XLSX file with Product, Grade, Stage, and Spec definitions.
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-500 text-white border-none shadow-lg shadow-green-900/20">Download .xlsx</Button>
          </div>
        </div>
      </div>
    </div>
  );
};