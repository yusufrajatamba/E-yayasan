import React, { useState } from 'react';
import { ChurchAsset } from '../types';
import { 
  Package, 
  Plus, 
  Trash2, 
  Pencil,
  X,
  Check, 
  Tag, 
  Warehouse, 
  CheckCircle, 
  AlertTriangle, 
  Award,
  Sliders,
  Filter,
  Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ManajemenAsetViewProps {
  assets: ChurchAsset[];
  onAddAsset: (asset: Omit<ChurchAsset, 'id'>) => void;
  onEditAsset: (asset: ChurchAsset) => void;
  onDeleteAsset: (id: string) => void;
}

export default function ManajemenAsetView({ assets, onAddAsset, onEditAsset, onDeleteAsset }: ManajemenAsetViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterKondisi, setFilterKondisi] = useState<string>('Semua');
  const [editingAsset, setEditingAsset] = useState<ChurchAsset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [namaBarang, setNamaBarang] = useState('');
  const [jumlah, setJumlah] = useState<number>(1);
  const [kondisi, setKondisi] = useState<'Baik' | 'Perlu Perbaikan' | 'Rusak'>('Baik');
  const [lokasi, setLokasi] = useState('');
  const [tanggalPerolehan, setTanggalPerolehan] = useState('2026-06-04');

  const handleOpenEditForm = (asset: ChurchAsset) => {
    setEditingAsset(asset);
    setNamaBarang(asset.namaBarang);
    setJumlah(asset.jumlah);
    setKondisi(asset.kondisi);
    setLokasi(asset.lokasi);
    setTanggalPerolehan(asset.tanggalPerolehan);
    setIsFormOpen(true);
  };

  const handleCancelSubmit = () => {
    setEditingAsset(null);
    setNamaBarang('');
    setJumlah(1);
    setLokasi('');
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim() || !lokasi.trim()) {
      return alert('Nama barang dan lokasi wajib diisi!');
    }

    if (editingAsset) {
      onEditAsset({
        ...editingAsset,
        namaBarang,
        jumlah: Number(jumlah),
        kondisi,
        lokasi,
        tanggalPerolehan
      });
      setEditingAsset(null);
    } else {
      onAddAsset({
        namaBarang,
        jumlah: Number(jumlah),
        kondisi,
        lokasi,
        tanggalPerolehan
      });
    }

    // Reset
    setNamaBarang('');
    setJumlah(1);
    setLokasi('');
    setIsFormOpen(false);
  };

  const filteredAssets = assets.filter(asset => filterKondisi === 'Semua' || asset.kondisi === filterKondisi);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(18, 66, 127);
    doc.text("GEREJA GLORIA JEMAAT CENTER", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("LAPORAN DAFTAR INTEGRASI MANAJEMEN ASET & INVENTARIS GEREJA", 14, 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Waktu Cetak: 2026-06-04 | Filter Kondisi: ${filterKondisi} | Total Aset Terhitung: ${filteredAssets.length} Item`, 14, 33);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    const checkList = filteredAssets.map((a, index) => [
      index + 1,
      a.namaBarang,
      a.jumlah || 1,
      a.kondisi || "Baik",
      a.lokasi || "-",
      a.tanggalPerolehan || "-"
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["No", "Nama Barang / Aset", "Jumlah (Unit)", "Kondisi", "Lokasi Penempatan", "Tanggal Perolehan"]],
      body: checkList,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 66, 127] },
      columnStyles: {
        2: { halign: 'center' }
      }
    });

    doc.save("Laporan-Aset-Inventaris-Gereja.pdf");
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto print:p-0">
      {/* Printed Header Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-850 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight uppercase">MANAJEMEN ASET &amp; INVENTARIS GEREJA</h1>
        <p className="text-xs font-semibold text-slate-700">Gereja Gloria Jemaat Center &bull; Layanan: Enterprise System</p>
        <p className="text-[10px] text-slate-500 mt-1">Dicetak pada tanggal: 2026-06-04 &bull; Total Inventaris Registered: {assets.length} Item</p>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-[#3875d7]" />
            <span>Manajemen Aset &amp; Inventaris Gereja</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi dan pendataan aset fisik gedung utama, ruang ibadah, panggung pemusik, instalasi audio, pendingin udara, dan kursi jemaat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-cetak-aset"
            onClick={exportToPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Ekspor PDF</span>
          </button>
          <button
            id="btn-tambah-aset"
            onClick={() => {
              if (isFormOpen && editingAsset) {
                handleCancelSubmit();
              } else {
                setIsFormOpen(!isFormOpen);
              }
            }}
            className="bg-[#3875d7] hover:bg-[#1a5cb8] text-white py-2 px-4 rounded text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            {isFormOpen && editingAsset ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isFormOpen && editingAsset ? 'Batal Ubah' : 'Tambah Aset Inventaris'}</span>
          </button>
        </div>
      </div>

      {/* Condtion Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Aset Kondisi Baik</div>
            <div className="text-xl font-bold text-emerald-950 mt-1">
              {assets.filter(a => a.kondisi === 'Baik').reduce((sum, a) => sum + a.jumlah, 0)} Pcs
            </div>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Perlu Perbaikan</div>
            <div className="text-xl font-bold text-amber-950 mt-1">
              {assets.filter(a => a.kondisi === 'Perlu Perbaikan').reduce((sum, a) => sum + a.jumlah, 0)} Pcs
            </div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500/30" />
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Mengalami Kerusakan</div>
            <div className="text-xl font-bold text-rose-950 mt-1">
              {assets.filter(a => a.kondisi === 'Rusak').reduce((sum, a) => sum + a.jumlah, 0)} Pcs
            </div>
          </div>
          <Sliders className="w-8 h-8 text-rose-500/30" />
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3.5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Saring Kondisi Barang:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {['Semua', 'Baik', 'Perlu Perbaikan', 'Rusak'].map((cond) => (
            <button
              key={cond}
              onClick={() => setFilterKondisi(cond)}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                filterKondisi === cond
                  ? 'bg-[#12427f] text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:text-slate-800'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* ASSET TABLE LIST */}
        <div className="xl:col-span-2 print:col-span-3 w-full border border-slate-200 rounded-sm bg-white overflow-hidden shadow-xs">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Daftar Perlengkapan Perlengkapan ({filteredAssets.length} item)</span>
            <span className="text-[10px] text-slate-500 font-mono">Modul Logistik</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Nama Inventaris / Barang</th>
                  <th className="py-2.5 px-3 font-bold">Jumlah</th>
                  <th className="py-2.5 px-3 font-bold">Lokasi Penempatan</th>
                  <th className="py-2.5 px-3 font-bold">Tgl Perolehan</th>
                  <th className="py-2.5 px-3 font-bold">Status Kondisi</th>
                  <th className="py-2.5 px-3 text-center font-bold print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className={`hover:bg-slate-50/70 transition-colors ${editingAsset?.id === asset.id ? 'bg-amber-50/65' : ''}`}>
                      <td className="py-3 px-4 font-semibold text-slate-850">
                        {asset.namaBarang}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {asset.jumlah} unit
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-slate-600 font-medium font-sans">
                          <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                          {asset.lokasi}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {asset.tanggalPerolehan}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          asset.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-800' :
                          asset.kondisi === 'Perlu Perbaikan' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {asset.kondisi}
                        </span>
                      </td>
                      <td className="py-3 px-3 print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditForm(asset)}
                            className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 p-1 rounded transition-colors cursor-pointer"
                            title="Ubah Aset"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmId(asset.id);
                            }}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                            title="Hapus Aset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                      Tidak ada aset inventaris yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILS OR ADD FORM */}
        <div className="border border-slate-200 rounded bg-slate-50 p-4 print:hidden">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2.5 mb-4">
            {editingAsset ? 'Form Ubah Aset Inventaris' : 'Form Registrasi Aset Baru'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Nama Barang / Alat Utama *
              </label>
              <input
                id="form-asset-name"
                type="text"
                required
                placeholder="Contoh: AC Split LG Dual Inverter 1.5 PK"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Jumlah Satuan *
                </label>
                <input
                  id="form-asset-qt"
                  type="number"
                  required
                  min={1}
                  value={jumlah}
                  onChange={(e) => setJumlah(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Kondisi Saat Ini
                </label>
                <select
                  id="form-asset-condition"
                  value={kondisi}
                  onChange={(e) => setKondisi(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 font-bold cursor-pointer focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden"
                >
                  <option value="Baik">Kondisi Baik</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  <option value="Rusak">Rusak</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Lokasi Penempatan / Ruangan *
              </label>
              <input
                id="form-asset-loc"
                type="text"
                required
                placeholder="Contoh: Ruang Kantor Utama / Altar Depan"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-[#12427f] font-semibold focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Tanggal Perolehan Belanja
              </label>
              <input
                id="form-asset-date"
                type="date"
                required
                value={tanggalPerolehan}
                onChange={(e) => setTanggalPerolehan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
              />
            </div>

            <div className="flex gap-2">
              {editingAsset && (
                <button
                  type="button"
                  onClick={handleCancelSubmit}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded text-xs transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
              )}
              <button
                id="form-submit-asset"
                type="submit"
                className="flex-1 bg-[#12427f] hover:bg-[#1a559e] text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingAsset ? 'Simpan Perubahan' : 'Simpan Aset Baru'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-sm w-full shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 rounded-full text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950 font-sans tracking-tight">
                  Konfirmasi Hapus Aset
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data aset <strong>{assets.find(a => a.id === deleteConfirmId)?.namaBarang}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteAsset(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
