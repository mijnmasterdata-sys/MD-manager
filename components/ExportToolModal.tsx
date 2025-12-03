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
      GRADE: 'RELEASE', // Default
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
    // Must sort by order first
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

    // Download
    XLSX.writeFile(wb, `${product.code}_Spec_Load.xlsx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Export to Excel</h2>
          <p className="text-slate-500 mb-6 text-sm">
            This will generate a LabWare-compatible XLSX file with 4 tabs for Product, Grade, Stage, and Spec definitions.
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">Download .xlsx</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
