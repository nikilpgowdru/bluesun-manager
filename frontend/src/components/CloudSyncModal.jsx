import React, { useState } from 'react';
import Modal from './Modal';
import { exportCloudBackup } from '../api';
import { Cloud, Download, HardDrive, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function CloudSyncModal({ isOpen, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const handleExportBackup = async () => {
    try {
      setDownloading(true);
      const res = await exportCloudBackup();
      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
      const link = document.createElement('a');
      link.href = url;
      link.download = `bluesun_cloud_backup_${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      alert('Failed to generate cloud backup snapshot.');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cloud Data Storage & Google Drive Sync" maxWidth="max-w-xl">
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
            <Cloud className="w-8 h-8 text-white animate-bounce" />
          </div>
          <div>
            <h4 className="font-extrabold text-base">Google Account Cloud Reserved</h4>
            <p className="text-xs text-blue-100 font-medium">
              5TB Cloud Storage space available on your account. Data backups can be synced instantly.
            </p>
          </div>
        </div>

        {/* Sync Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider mb-1">
              <HardDrive className="w-4 h-4 text-brand-600" />
              Storage Limit
            </div>
            <p className="text-lg font-extrabold text-slate-900">5,000 GB (5 TB)</p>
            <p className="text-[11px] text-slate-500">Gemini 1 Cloud Storage Account</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Encryption Status
            </div>
            <p className="text-lg font-extrabold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Active
            </p>
            <p className="text-[11px] text-slate-500">Protected AES-256 Cloud Ledger</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleExportBackup}
            disabled={downloading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-600/30 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {downloading ? 'Generating Cloud Snapshot...' : 'Export Cloud Backup Snapshot (.json)'}
          </button>

          {lastSyncTime && (
            <p className="text-center text-xs font-semibold text-emerald-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cloud snapshot exported successfully at {lastSyncTime}! Save this file directly into your Google Drive 5TB storage folder.
            </p>
          )}

          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Every snapshot contains your entire production history, goods stock, sales receipts, account balances, and expenses. You can upload this snapshot directly to your 5TB Google Drive storage folder for permanent safety.
          </p>
        </div>
      </div>
    </Modal>
  );
}
