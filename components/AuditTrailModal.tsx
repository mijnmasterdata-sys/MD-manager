import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../services/catalogueService';
import { AuditLog } from '../types';
import { Button } from './Button';
import { X, History } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs(getAuditLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
             <div className="bg-slate-800 p-2 rounded-lg">
                <History className="w-5 h-5 text-blue-400" />
             </div>
             <h2 className="text-xl font-bold text-white">System Audit Log</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-950 sticky top-0 font-semibold tracking-wide border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-900/50">
                        {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {log.details}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    No logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};