import React, { useState } from 'react';
import { Bill } from '../types';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Pencil,
  X,
  CheckCircle2, 
  XCircle, 
  User, 
  Check, 
  MapPin,
  Calendar,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DaftarBillViewProps {
  bills: Bill[];
  onAddBill: (bill: Omit<Bill, 'id'>) => void;
  onEditBill: (bill: Bill) => void;
  onToggleBillStatus: (id: string) => void;
  onDeleteBill: (id: string) => void;
}

export default function DaftarBillView({ bills, onAddBill, onEditBill, onToggleBillStatus, onDeleteBill }: DaftarBillViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [namaTagihan, setNamaTagihan] = useState('');
  const [untukSektor, setUntukSektor] = useState('Semua Sektor');
  const [jumlahTagihan, setJumlahTagihan] = useState('');
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('2026-06-25');

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleOpenEditForm = (bill: Bill) => {
    setEditingBill(bill);
    setNamaTagihan(bill.namaTagihan);
    setUntukSektor(bill.untukSektor);
    setJumlahTagihan(String(bill.jumlahTagihan));
    setTanggalJatuhTempo(bill.tanggalJatuhTempo);
    setIsFormOpen(true);
  };

  const handleCancelSubmit = () => {
    setEditingBill(null);
    setNamaTagihan('');
    setJumlahTagihan('');
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(jumlahTagihan.replace(/[^0-9.-]+/g, ''));
    if (!namaTagihan.trim() || isNaN(cleanAmount) || cleanAmount <= 0) {
      return alert('Isi nama tagihan dan nominal tagihan dengan benar!');
    }

    if (editingBill) {
      onEditBill({
        ...editingBill,
        namaTagihan,
        untukSektor,
        jumlahTagihan: cleanAmount,
        tanggalJatuhTempo
      });
      setEditingBill(null);
    } else {
      onAddBill({
        namaTagihan,
        untukSektor,
        jumlahTagihan: cleanAmount,
        tanggalJatuhTempo,
        status: 'Belum Lunas'
      });
    }

    setNamaTagihan('');
    setJumlahTagihan('');
    setIsFormOpen(false);
  };

  const totalBelumLunas = bills.filter(b => b.status === 'Belum Lunas').reduce((sum, b) => sum + b.jumlahTagihan, 0);
  const totalLunas = bills.filter(b => b.status === 'Lunas').reduce((sum, b) => sum + b.jumlahTagihan, 0);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(18, 66, 127);
    doc.text("GEREJA GLORIA JEMAAT CENTER", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("LAPORAN DAFTAR BILL & LEMBAR TAGIHAN SEKTOR", 14, 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Waktu Cetak: 2026-06-04 | Total Bill Terdaftar: ${bills.length} Lembar`, 14, 33);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    // Summary Card Stats
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Lunas: ${formatRupiah(totalLunas)}`, 14, 44);
    doc.text(`Total Belum Lunas (Tunggakan): ${formatRupiah(totalBelumLunas)}`, 14, 50);

    const bodyRows = bills.map((b, index) => [
      index + 1,
      b.namaTagihan,
      b.untukSektor || "Semua Sektor",
      b.tanggalJatuhTempo || "-",
      formatRupiah(b.jumlahTagihan),
      b.status
    ]);

    autoTable(doc, {
      startY: 56,
      head: [["No", "Nama Tagihan Sektor", "Peruntukan Wilayah", "Jatuh Tempo", "Nominal", "Status"]],
      body: bodyRows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 66, 127] },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'center' }
      }
    });

    doc.save("Daftar-Tagihan-Sektor-Gereja.pdf");
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto print:p-0 font-sans">
      {/* Printed Header Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-850 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight uppercase">DAFTAR BILL &amp; TAGIHAN KEUANGAN GEREJA</h1>
        <p className="text-xs font-semibold text-slate-700">Gereja Gloria Jemaat Center &bull; Enterprise Bill Ledger</p>
        <p className="text-[10px] text-slate-500 mt-1">Dicetak pada tanggal: 2026-06-04 &bull; Total Dokumen Tagihan: {bills.length} Records</p>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#3875d7]" />
            <span>Daftar Bill &amp; Tagihan Sektor</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penghitungan iuran tahunan jemaat, iuran pembangunan gereja, kontribusi distrik, subsidi sinode, dan status pembayaran kolektif sektor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-cetak-bill"
            onClick={exportToPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Ekspor PDF</span>
          </button>
          <button
            id="btn-tambah-bill"
            onClick={() => {
              if (isFormOpen && editingBill) {
                handleCancelSubmit();
              } else {
                setIsFormOpen(!isFormOpen);
              }
            }}
            className="bg-[#3875d7] hover:bg-[#1a5cb8] text-white py-2 px-4 rounded text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            {isFormOpen && editingBill ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isFormOpen && editingBill ? 'Batal Ubah' : 'Buat Lembar Tagihan'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Total Teralokasi Lunas</div>
            <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">{formatRupiah(totalLunas)}</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-60" />
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Tunggakan Belum Terbayar</div>
            <div className="text-2xl font-black text-rose-900 mt-1 font-mono">{formatRupiah(totalBelumLunas)}</div>
          </div>
          <XCircle className="w-8 h-8 text-rose-400 opacity-60" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* BILL TABLE LIST */}
        <div className="xl:col-span-2 print:col-span-3 w-full border border-slate-200 rounded overflow-hidden shadow-xs bg-white">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700">
            Daftar Tagihan Iuran Sektor Aktif ({bills.length} lembar)
          </div>

          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-800 uppercase text-[10px] border-b border-slate-200 tracking-wider font-bold">
              <tr>
                <th className="py-2.5 px-4 font-bold">Nama Tagihan / Kontribusi</th>
                <th className="py-2.5 px-3 font-bold">Ditujukan Sektor</th>
                <th className="py-2.5 px-3 font-bold">Jatuh Tempo</th>
                <th className="py-2.5 px-3 text-right font-bold w-32">Nominal</th>
                <th className="py-2.5 px-3 text-center font-bold">Status</th>
                <th className="py-2.5 px-3 text-center font-bold print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.map((bill) => (
                <tr key={bill.id} className={`hover:bg-slate-50/50 transition-colors ${editingBill?.id === bill.id ? 'bg-amber-50/65' : ''}`}>
                  <td className="py-3 px-4 font-semibold text-slate-800">{bill.namaTagihan}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded font-bold text-slate-600">
                      <MapPin className="w-3 h-3 text-[#3875d7]" />
                      {bill.untukSektor}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">{bill.tanggalJatuhTempo}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800 font-mono">{formatRupiah(bill.jumlahTagihan)}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onToggleBillStatus(bill.id)}
                      className={`inline-block px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full cursor-pointer transition-colors shadow-xs ${
                        bill.status === 'Lunas' 
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-150' 
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-150'
                      }`}
                      title="Klik untuk ubah status pembayaran"
                    >
                      {bill.status}
                    </button>
                  </td>
                  <td className="py-3 px-3 print:hidden">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditForm(bill)}
                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 p-1 rounded transition-colors cursor-pointer"
                        title="Ubah Tagihan"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmId(bill.id);
                        }}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer"
                        title="Hapus Tagihan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DETAILS OR ADD FORM */}
        <div className="border border-slate-200 rounded bg-slate-50 p-4 print:hidden">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2.5 mb-4">
            {editingBill ? 'Form Ubah Iuran / Tagihan Sektor' : 'Form Penerbitan Iuran / Tagihan Sektor'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Keterangan / Nama Tagihan *
              </label>
              <input
                id="form-bill-name"
                type="text"
                required
                placeholder="Contoh: Iuran Tahunan Pembangunan Altar Baru"
                value={namaTagihan}
                onChange={(e) => setNamaTagihan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Nominal Dues *
                </label>
                <input
                  id="form-bill-amount"
                  type="text"
                  required
                  placeholder="Contoh: 1500000"
                  value={jumlahTagihan}
                  onChange={(e) => setJumlahTagihan(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Untuk Sektor
                </label>
                <select
                  id="form-bill-sektor"
                  value={untukSektor}
                  onChange={(e) => setUntukSektor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 font-semibold cursor-pointer focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden"
                >
                  <option value="Semua Sektor">Semua Sektor (I - IV)</option>
                  <option value="Sektor I">Sektor I (Baitel)</option>
                  <option value="Sektor II">Sektor II (Efrata)</option>
                  <option value="Sektor III">Sektor III (Gideon)</option>
                  <option value="Sektor IV">Sektor IV (Sion)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Tanggal Batas Jatuh Tempo (Due Date)
              </label>
              <input
                id="form-bill-date"
                type="date"
                required
                value={tanggalJatuhTempo}
                onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
              />
            </div>

            <div className="flex gap-2">
              {editingBill && (
                <button
                  type="button"
                  onClick={handleCancelSubmit}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded text-xs transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
              )}
              <button
                id="form-submit-bill"
                type="submit"
                className="flex-1 bg-[#12427f] hover:bg-[#1a559e] text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{editingBill ? 'Simpan Perubahan' : 'Penerbitan Iuran'}</span>
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
                  Konfirmasi Hapus Tagihan
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus lembar tagihan/iuran <strong>{bills.find(b => b.id === deleteConfirmId)?.namaTagihan}</strong>? Tindakan ini tidak dapat dibatalkan.
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
                  onDeleteBill(deleteConfirmId);
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
