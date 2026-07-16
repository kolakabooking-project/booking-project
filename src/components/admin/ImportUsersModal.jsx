import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { toast } from 'sonner';
import { superadminApi } from '../../lib/api';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ImportUsersModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith('.csv')) {
      toast.error('Gunakan file berformat CSV (.csv)');
      return;
    }
    setFile(selected);
    setPreviewData(null);
  };

  const handleDownloadTemplate = () => {
    const templateContent = `NIP PENDEK, NAMA, NIP PANJANG, JABATAN
060123456, Budi Santoso S.Kom, 198001012005011001, Kepala Seksi PKD
060999888, Siti Rahmawati SE, 199001012015022001, Pelaksana Seksi Pelayanan`;
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_pegawai.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Pilih file CSV terlebih dahulu');
      return;
    }
    setLoadingPreview(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await superadminApi.previewImportUsers(formData);
      if (res?.data) {
        setPreviewData(res.data);
        toast.success(`Berhasil membaca ${res.data.totalParsed || 0} baris data`);
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memparsing file CSV');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData) return;
    setSubmitting(true);
    try {
      const res = await superadminApi.commitImportUsers({
        newRows: previewData.newRows || [],
        updateRows: previewData.updateRows || []
      });
      const data = res?.data || {};
      toast.success(`Import Berhasil: ${data.createdCount || 0} baru, ${data.updatedCount || 0} diupdate`);
      if (data.errors && data.errors.length > 0) {
        toast.error(`Ada beberapa kendala: ${data.errors[0]}`);
      }
      setFile(null);
      setPreviewData(null);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data pegawai');
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetState} title="Import & Overwrite Data Pegawai (CSV)" size="lg">
      <div className="space-y-5">
        {/* Header Template Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-[color:var(--color-surface-muted)]" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="text-djp-blue flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-heading font-bold text-[color:var(--color-heading)]">Format File CSV</p>
              <p className="text-xs text-[color:var(--color-text-soft)]">
                Urutan kolom: <code className="font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">NIP PENDEK, NAMA, NIP PANJANG, JABATAN</code>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="flex items-center gap-2 text-xs self-start sm:self-center">
            <Download size={14} />
            Unduh Template
          </Button>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed rounded-2xl p-6 text-center transition-colors hover:border-djp-blue" style={{ borderColor: file ? 'var(--color-primary)' : 'var(--color-border)' }}>
          <Upload className="mx-auto text-[color:var(--color-text-soft)] mb-2" size={28} />
          <p className="text-sm font-semibold text-[color:var(--color-heading)]">
            {file ? file.name : 'Pilih atau letakkan file CSV di sini'}
          </p>
          <p className="text-xs text-[color:var(--color-text-soft)] mt-1">
            {file ? `Ukuran: ${(file.size / 1024).toFixed(1)} KB` : 'File comma-delimited (.csv)'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <label className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5">
              <span>Pilih File CSV</span>
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>
            {file && !previewData && (
              <Button onClick={handlePreview} loading={loadingPreview} className="text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                Analisa & Preview
              </Button>
            )}
          </div>
        </div>

        {/* Preview Results */}
        {previewData && (
          <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Data Baru</p>
                <p className="text-lg font-heading font-bold text-emerald-700 dark:text-emerald-300">{previewData.newRows?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/20 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Data Update</p>
                <p className="text-lg font-heading font-bold text-amber-700 dark:text-amber-300">{previewData.updateRows?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl border bg-gray-500/10 border-gray-500/20 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-text-soft)]">Tanpa Perubahan</p>
                <p className="text-lg font-heading font-bold text-[color:var(--color-heading)]">{previewData.unchangedCount || 0}</p>
              </div>
            </div>

            {/* Notification Safety Note */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-blue-500/10 border-blue-500/20 text-xs text-[color:var(--color-heading)]">
              <ShieldCheck className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold">Jaminan Keamanan Data Relasional & Password Default</p>
                <p className="text-[color:var(--color-text-soft)] mt-0.5">
                  Pegawai baru otomatis mendapatkan password default <strong>Kolaka2026!</strong>. Untuk pegawai eksisting yang diupdate, seluruh data peminjaman dan histori dipastikan <strong>100% aman & tidak terhapus</strong>.
                </p>
              </div>
            </div>

            {/* Preview Table Before vs After */}
            <div className="max-h-64 overflow-y-auto rounded-xl border text-xs" style={{ borderColor: 'var(--color-border)' }}>
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[color:var(--color-surface-muted)] border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <tr>
                    <th className="p-2.5 font-bold uppercase">Status</th>
                    <th className="p-2.5 font-bold uppercase">NIP</th>
                    <th className="p-2.5 font-bold uppercase">Nama (Before ➔ After)</th>
                    <th className="p-2.5 font-bold uppercase">NIP Panjang</th>
                    <th className="p-2.5 font-bold uppercase">Jabatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: 'var(--color-border)' }}>
                  {(previewData.newRows?.length === 0 && previewData.updateRows?.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[color:var(--color-text-soft)]">
                        Semua baris CSV sudah cocok dengan data di database (Tanpa Perubahan).
                      </td>
                    </tr>
                  ) : (
                    <>
                      {previewData.newRows?.map((row, idx) => (
                        <tr key={`new-${idx}`} className="bg-emerald-500/5">
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600">BARU</span>
                          </td>
                          <td className="p-2.5 font-mono font-semibold">{row.nipPendek}</td>
                          <td className="p-2.5 font-semibold text-emerald-600 dark:text-emerald-400">{row.nama}</td>
                          <td className="p-2.5 font-mono">{row.nipPanjang || '-'}</td>
                          <td className="p-2.5 text-[color:var(--color-text-soft)]">{row.jabatan || '-'}</td>
                        </tr>
                      ))}
                      {previewData.updateRows?.map((row, idx) => (
                        <tr key={`update-${idx}`} className="bg-amber-500/5">
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-600">UPDATE</span>
                          </td>
                          <td className="p-2.5 font-mono font-semibold">{row.nipPendek}</td>
                          <td className="p-2.5">
                            {row.before?.name !== row.after?.name ? (
                              <div className="flex items-center gap-1.5">
                                <span className="line-through opacity-70">{row.before?.name}</span>
                                <ArrowRight size={12} className="text-amber-500 flex-shrink-0" />
                                <span className="font-bold text-amber-600 dark:text-amber-400">{row.after?.name}</span>
                              </div>
                            ) : (
                              <span>{row.after?.name}</span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono">
                            {row.before?.nipPanjang !== row.after?.nipPanjang ? (
                              <div className="flex items-center gap-1">
                                <span className="line-through opacity-70">{row.before?.nipPanjang}</span>
                                <ArrowRight size={12} className="text-amber-500 flex-shrink-0" />
                                <span className="font-bold text-amber-600 dark:text-amber-400">{row.after?.nipPanjang}</span>
                              </div>
                            ) : (
                              <span>{row.after?.nipPanjang}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-[color:var(--color-text-soft)]">
                            {row.before?.jabatan !== row.after?.jabatan ? (
                              <div className="flex items-center gap-1">
                                <span className="line-through opacity-70 truncate max-w-[120px]">{row.before?.jabatan}</span>
                                <ArrowRight size={12} className="text-amber-500 flex-shrink-0" />
                                <span className="font-bold text-amber-600 dark:text-amber-400 truncate max-w-[150px]">{row.after?.jabatan}</span>
                              </div>
                            ) : (
                              <span className="truncate max-w-[150px] inline-block">{row.after?.jabatan}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer actions */}
        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <Button type="button" variant="ghost" onClick={resetState}>Batal</Button>
          {previewData && (previewData.newRows?.length > 0 || previewData.updateRows?.length > 0) && (
            <Button onClick={handleCommit} loading={submitting} className="flex items-center gap-2 bg-djp-blue hover:bg-djp-blue/90 text-white">
              <CheckCircle2 size={16} />
              Konfirmasi & Simpan ({previewData.newRows?.length + previewData.updateRows?.length} Data)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
