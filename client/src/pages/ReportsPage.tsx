import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, X, Eye, Trash2, Clock, CheckCircle,
  AlertCircle, Brain, ChevronDown, ChevronUp, Scan, FileImage,
  FileArchive, ArrowLeftRight, Calendar
} from 'lucide-react';
import api from '../lib/api';
import { formatDate, formatFileSize, getRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Processing', color: 'badge-amber', icon: Clock },
  analyzed: { label: 'Analyzed', color: 'badge-green', icon: CheckCircle },
  error: { label: 'Error', color: 'badge-red', icon: AlertCircle },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'compare'>('list');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [reportType, setReportType] = useState('general');

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.reports || []);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('report', file);
    formData.append('report_type', reportType);

    try {
      await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Report uploaded! AI analysis in progress...');
      loadReports();
      // Poll for updates
      const interval = setInterval(async () => {
        const res = await api.get('/reports');
        const updated = res.data.reports || [];
        setReports(updated);
        const allDone = updated.every((r: any) => r.status !== 'pending');
        if (allDone) clearInterval(interval);
      }, 3000);
      setTimeout(() => clearInterval(interval), 30000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [reportType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const viewReport = async (id: string) => {
    try {
      const res = await api.get(`/reports/${id}`);
      setSelectedReport(res.data.report);
      setViewMode('list');
    } catch { toast.error('Failed to load report'); }
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
      toast.success('Report deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) {
        toast.error('Can only compare 2 reports at a time');
        return prev;
      }
      return [...prev, id];
    });
  };

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return FileText;
    if (type?.includes('image')) return FileImage;
    return FileArchive;
  };

  if (loading) return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-3xl" />)}
    </div>
  );

  const getCompareReports = () => reports.filter(r => compareIds.includes(r.id));

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Medical Reports</h1>
          <p className="section-subtitle">Upload and get AI-powered analysis of your medical documents</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
            List View
          </button>
          <button onClick={() => setViewMode('timeline')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
            Timeline
          </button>
          <button onClick={() => setViewMode('compare')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'compare' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
            Compare {compareIds.length > 0 && `(${compareIds.length})`}
          </button>
        </div>
      </div>

      {viewMode !== 'compare' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
              <Scan className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-900 dark:text-white">Smart Report Scanner</h2>
              <p className="text-slate-400 text-sm">AI-powered medical document analysis</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="input-field max-w-xs">
              {['general', 'blood_test', 'mri', 'xray', 'ecg', 'urine_test', 'biopsy', 'prescription'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-blue-600 dark:text-blue-400 font-semibold">Uploading & analyzing...</p>
                <p className="text-slate-400 text-sm">AI is processing your report</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  isDragActive ? 'bg-blue-100 dark:bg-blue-900/50 scale-110' : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {isDragActive ? 'Drop your file here!' : 'Drag & drop your report'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">or click to browse · PDF, Images, TXT · Max 10MB</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Views */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`grid gap-6 ${selectedReport ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Your Reports ({reports.length})</h2>
              {reports.length === 0 ? (
                <div className="card text-center py-16">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No reports uploaded yet</p>
                </div>
              ) : (
                reports.map((report, i) => {
                  const StatusIcon = STATUS_CONFIG[report.status]?.icon || Clock;
                  const FileIcon = getFileIcon(report.file_type);

                  return (
                    <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`card cursor-pointer transition-all group ${selectedReport?.id === report.id ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950/50 dark:to-blue-950/50 flex items-center justify-center flex-shrink-0">
                          <FileIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{report.original_name}</p>
                            <span className={`badge ${STATUS_CONFIG[report.status]?.color || 'badge-blue'}`}>
                              <StatusIcon className="w-3 h-3" /> {STATUS_CONFIG[report.status]?.label || 'Processing'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-slate-400">{report.report_type?.replace('_', ' ')}</p>
                            <p className="text-xs text-slate-400">{formatFileSize(report.file_size || 0)}</p>
                            <p className="text-xs text-slate-400">{getRelativeTime(report.uploaded_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); toggleCompare(report.id); }} className={`p-2 rounded-xl transition-colors ${compareIds.includes(report.id) ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <ArrowLeftRight className={`w-4 h-4 ${compareIds.includes(report.id) ? 'text-blue-600' : 'text-slate-400'}`} />
                          </button>
                          {report.status === 'analyzed' && (
                            <button onClick={() => viewReport(report.id)} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                          )}
                          <button onClick={() => deleteReport(report.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <AnimatePresence>
              {selectedReport && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">AI Analysis</h2>
                    <button onClick={() => setSelectedReport(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  <div className="card bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedReport.original_name}</p>
                        <p className="text-xs text-slate-500">{formatDate(selectedReport.uploaded_at, 'datetime')}</p>
                      </div>
                    </div>
                    {selectedReport.summary && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">Summary</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedReport.summary}</p>
                      </div>
                    )}
                    {selectedReport.key_findings && Array.isArray(selectedReport.key_findings) && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">Key Findings</h3>
                        <ul className="space-y-2">
                          {selectedReport.key_findings.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {viewMode === 'timeline' && (
          <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card">
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-8">Medical History Timeline</h2>
            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 md:ml-6 space-y-8 pb-8">
              {reports.map((report, index) => (
                <div key={report.id} className="relative pl-6 md:pl-8">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatDate(report.uploaded_at, 'full')}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{report.original_name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{report.report_type?.replace('_', ' ')}</p>
                    {report.summary && <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-3">{report.summary}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'compare' && (
          <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {compareIds.length < 2 ? (
              <div className="card text-center py-16">
                <ArrowLeftRight className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Select 2 reports to compare</p>
                <p className="text-slate-400 text-sm mt-1">Go back to List View and use the compare icon to select reports.</p>
                <button onClick={() => setViewMode('list')} className="mt-4 btn-primary py-2 px-4 text-sm">Back to List</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {getCompareReports().map((report, index) => {
                  let analysis = report.analysis;
                  if (typeof analysis === 'string') {
                    try { analysis = JSON.parse(analysis); } catch(e) {}
                  }
                  
                  return (
                  <div key={report.id} className="card bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-display font-bold text-lg text-blue-600 dark:text-blue-400">Report {index + 1}</h3>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{report.original_name}</p>
                        <p className="text-xs text-slate-500">{formatDate(report.uploaded_at, 'datetime')}</p>
                      </div>
                      <button onClick={() => toggleCompare(report.id)} className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">
                        <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Summary</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{report.summary || 'No summary available'}</p>
                      </div>
                      {analysis?.keyFindings && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">Key Findings</h4>
                          <ul className="list-disc pl-4 text-sm text-slate-700 dark:text-slate-300">
                            {analysis.keyFindings.map((f: string, i: number) => <li key={i}>{f}</li>)}
                          </ul>
                        </div>
                      )}
                      {analysis?.concerns?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">Concerns</h4>
                          <ul className="list-disc pl-4 text-sm text-slate-700 dark:text-slate-300">
                            {analysis.concerns.map((c: string, i: number) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
