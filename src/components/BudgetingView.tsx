import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Printer, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  PiggyBank, 
  Briefcase, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BudgetItem } from '../types';
import { fetchBudgets, addBudget, deleteBudget } from '../services/db';

interface BudgetingViewProps {
  budgets?: BudgetItem[];
  setBudgets?: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
}

export default function BudgetingView({ budgets: propBudgets, setBudgets: propSetBudgets }: BudgetingViewProps) {
  const [localBudgets, setLocalBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Pelayanan Yayasan');
  const [alokasi, setAlokasi] = useState('');
  const [terpakai, setTerpakai] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Determine if using global/prop state (SPA Single-source-of-truth) or fallback local state
  const isGlobalUsed = propBudgets !== undefined && propSetBudgets !== undefined;
  const budgets = isGlobalUsed ? propBudgets! : localBudgets;

  useEffect(() => {
    if (isGlobalUsed) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchBudgets()
      .then((data) => {
        if (active) {
          setLocalBudgets(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data anggaran:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isGlobalUsed, propBudgets]);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !alokasi) return;

    const rawBudget: Omit<BudgetItem, 'id'> = {
      nama,
      kategori,
      alokasi: Number(alokasi),
      terpakai: Number(terpakai) || 0,
      keterangan
    };

    try {
      setLoading(true);
      const savedBudget = await addBudget(rawBudget);
      if (isGlobalUsed) {
        propSetBudgets!((prev) => [...prev, savedBudget]);
      } else {
        setLocalBudgets((prev) => [...prev, savedBudget]);
      }
      setIsFormOpen(false);
      
      // Reset form
      setNama('');
      setAlokasi('');
      setTerpakai('');
      setKeterangan('');
    } catch (err) {
      alert('Gagal menambahkan rencana anggaran ke database.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus rencana anggaran ini?')) {
      try {
         setLoading(true);
         await deleteBudget(id);
         if (isGlobalUsed) {
           propSetBudgets!((prev) => prev.filter(b => b.id !== id));
         } else {
           setLocalBudgets((prev) => prev.filter(b => b.id !== id));
         }
      } catch (err) {
         alert('Gagal menghapus rencana anggaran dari database.');
      } finally {
         setLoading(false);
      }
    }
  };

  const totalAlokasi = budgets.reduce((sum, b) => sum + b.alokasi, 0);
  const totalTerpakai = budgets.reduce((sum, b) => sum + b.terpakai, 0);
  const sisaAnggaran = totalAlokasi - totalTerpakai;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(18, 66, 127);
    doc.text("YAYASAN KRISTEN GLORIA", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("RENCANA ANGGARAN BELANJA (RAB) OPERASIONAL & BANTUAN SOSIAL", 14, 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Waktu Cetak: 2026-06-04 | Total Alokasi: ${formatRupiah(totalAlokasi)} | Realisasi Penyerapan: ${formatRupiah(totalTerpakai)}`, 14, 33);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    // Summary Box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Alokasi Rencana Belanja: ${formatRupiah(totalAlokasi)}`, 14, 44);
    doc.text(`Penyerapan Dana Riil: ${formatRupiah(totalTerpakai)}`, 14, 50);
    doc.text(`Sisa Anggaran Belum Terpakai: ${formatRupiah(sisaAnggaran)}`, 14, 56);

    const bodyRows = budgets.map((b, index) => {
      const rasio = b.alokasi > 0 ? Math.round((b.terpakai / b.alokasi) * 100) : 0;
      return [
        index + 1,
        b.nama,
        b.kategori,
        formatRupiah(b.alokasi),
        formatRupiah(b.terpakai),
        `${rasio}%`,
        formatRupiah(b.alokasi - b.terpakai)
      ];
    });

    autoTable(doc, {
      startY: 62,
      head: [["No", "Nama Rencana Anggaran (Pos)", "Kategori Pembagian", "Alokasi Maksimum", "Realisasi Terpakai", "Rasio Penyerapan", "Sisa Dana Tersedia"]],
      body: bodyRows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 66, 127] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center' },
        6: { halign: 'right' }
      }
    });

    doc.save("Laporan-Anggaran-RAB_Yayasan.pdf");
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto print:p-0">
      {/* Printed Header Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-850 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight uppercase">RENCANA ANGGARAN BELANJA (RAB) YAYASAN OK</h1>
        <p className="text-xs font-semibold text-slate-700">Yayasan Kristen Gloria center &bull; Sistem Akuntansi Terpadu</p>
        <p className="text-[10px] text-slate-500 mt-1">Status Penyerapan: REAL-TIME &bull; Saldo Sisa: {formatRupiah(sisaAnggaran)}</p>
      </div>

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#3875d7]" />
            <span>Rencana Anggaran Belanja (RAB) Yayasan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen alokasi peruntukan program pelayanan yayasan, beasiswa pendidikan, donasi sosial/kemanusiaan, logistik komsel, serta pemeliharaan aset fisik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-cetak-budget"
            onClick={exportToPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Ekspor PDF</span>
          </button>
          <button
            id="btn-tambah-budget"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-[#3875d7] hover:bg-[#1a5cb8] text-white py-2 px-4 rounded text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isFormOpen ? 'Batal' : 'Buat Anggaran Baru'}</span>
          </button>
        </div>
      </div>

      {/* Main Budget Stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="border border-slate-200 rounded p-4 bg-slate-50/70">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Alokasi Rencana Belanja</span>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1.5 font-mono">{formatRupiah(totalAlokasi)}</div>
        </div>

        <div className="border border-slate-200 rounded p-4 bg-slate-50/70">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <PiggyBank className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Anggaran Terpakai</span>
          </div>
          <div className="text-2xl font-black text-[#12427f] mt-1.5 font-mono">{formatRupiah(totalTerpakai)}</div>
        </div>

        <div className="border border-emerald-200 rounded p-4 bg-emerald-50/40">
          <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sisa Anggaran Tersedia</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1.5 font-mono">{formatRupiah(sisaAnggaran)}</div>
        </div>
      </div>

      {/* Budget main flex layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* BUDGET LIST TABLE */}
        <div className="xl:col-span-2 print:col-span-3 w-full border border-slate-200 rounded overflow-hidden shadow-xs bg-white">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-indigo-750" />
            <span>Daftar Pembagian Pos Anggaran Yayasan ({budgets.length} pos)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-800 uppercase text-[10px] border-b border-slate-100 tracking-wider font-bold">
                <tr>
                  <th className="py-2.5 px-3">Nama Anggaran (Pos)</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Alokasi</th>
                  <th className="py-2.5 px-3 text-right">Direalisasi</th>
                  <th className="py-2.5 px-3 text-center">Persentase</th>
                  <th className="py-2.5 px-3 text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && budgets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 border-2 border-t-transparent border-[#3875d7] rounded-full animate-spin"></div>
                        <span>Memuat Anggaran dari database...</span>
                      </div>
                    </td>
                  </tr>
                ) : budgets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      Belum ada pos anggaran. Silakan buat pos anggaran baru.
                    </td>
                  </tr>
                ) : (
                  budgets.map((b) => {
                    const percent = b.alokasi > 0 ? Math.round((b.terpakai / b.alokasi) * 100) : 0;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{b.nama}</div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-xs truncate">{b.keterangan || 'Tidak ada catatan'}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {b.kategori}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-700">{formatRupiah(b.alokasi)}</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-[#3875d7]">{formatRupiah(b.terpakai)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col items-center gap-1 max-w-[80px] mx-auto">
                            <span className="font-mono text-[10px] font-bold text-slate-600">{percent}%</span>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${percent > 90 ? 'bg-rose-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center print:hidden">
                          <button
                            onClick={() => handleDeleteBudget(b.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Hapus pos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILS OR ADD FORM */}
        <div className={`border border-slate-200 rounded bg-slate-50 p-4 print:hidden ${isFormOpen ? 'block' : 'hidden xl:block'}`}>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2.5 mb-4 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-[#3875d7]" />
            <span>Form Rencana Anggaran Yayasan</span>
          </h3>

          <form onSubmit={handleAddBudget} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Nama Anggaran (Pos Kerja Yayasan) *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Beasiswa Pendidikan Anak Asuh"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3c9ecc] focus:outline-hidden bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Kategori Pembagian
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 bg-white cursor-pointer font-medium"
                >
                  <option value="Pelayanan Yayasan">Pelayanan Yayasan &amp; Ibadah</option>
                  <option value="Operasional Kerja">Operasional Kerja &amp; Sekre</option>
                  <option value="Dana Diakonia">Dana Diakonia &amp; Sosial Yayasan</option>
                  <option value="Program Beasiswa">Program Beasiswa &amp; Kependidikan</option>
                  <option value="Pembangunan Fisik">Penerbitan Media / Pembangunan Fisik</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Alokasi Dana (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Jumlah alokasi"
                  value={alokasi}
                  onChange={(e) => setAlokasi(e.target.value)}
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3c9ecc] focus:outline-hidden bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Dana Terpakai (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0 jika belum ditarik"
                  value={terpakai}
                  onChange={(e) => setTerpakai(e.target.value)}
                  className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3c9ecc] focus:outline-hidden bg-white font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Keterangan Memo Program / Target
              </label>
              <textarea
                rows={3}
                placeholder="Deskripsi target pelaksanaan program..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3c9ecc] focus:outline-hidden bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Pos Anggaran</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
