import React, { useState } from 'react';
import { TransactionType, BudgetItem } from '../types';
import { 
  ArrowLeftRight, 
  Plus, 
  Trash2, 
  Pencil,
  X,
  TrendingUp, 
  Calendar, 
  Coins, 
  ChevronRight,
  Filter,
  Check,
  Tag,
  AlertTriangle,
  Printer,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Bookmark
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransaksiViewProps {
  transactions: TransactionType[];
  budgets?: BudgetItem[];
  onAddTransaction: (transaction: Omit<TransactionType, 'id'>) => void;
  onEditTransaction: (transaction: TransactionType) => void;
  onDeleteTransaction: (id: string) => void;
  initialFormOpen?: boolean;
}

export default function TransaksiView({ 
  transactions, 
  budgets = [],
  onAddTransaction, 
  onEditTransaction,
  onDeleteTransaction,
  initialFormOpen = false
}: TransaksiViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(initialFormOpen);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [editingTrx, setEditingTrx] = useState<TransactionType | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [trxType, setTrxType] = useState<'Pemasukan' | 'Pengeluaran'>('Pemasukan');
  const [category, setCategory] = useState<string>('Ibadah Umum');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('2026-06-04');
  const [keterangan, setKeterangan] = useState<string>('');
  const [donor, setDonor] = useState<string>('');
  const [anggaranId, setAnggaranId] = useState<string>('');

  const formatRupiah = (num: number) => {
    const absVal = Math.abs(num);
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(absVal);
    
    return num < 0 ? `-${formatted}` : formatted;
  };

  const handleOpenEditForm = (trx: TransactionType) => {
    setEditingTrx(trx);
    setCategory(trx.category);
    setAmount(String(Math.abs(trx.amount)));
    setTrxType(trx.amount < 0 ? 'Pengeluaran' : 'Pemasukan');
    setDate(trx.date);
    setKeterangan(trx.keterangan || '');
    setDonor(trx.donor || '');
    setAnggaranId(trx.anggaranId || '');
    setIsFormOpen(true);
  };

  const handleCancelSubmit = () => {
    setEditingTrx(null);
    setAmount('');
    setKeterangan('');
    setDonor('');
    setAnggaranId('');
    setIsFormOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return alert('Jumlah nominal transaksi harus bernilai positif!');
    }

    const signedAmount = trxType === 'Pengeluaran' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

    if (editingTrx) {
      onEditTransaction({
        ...editingTrx,
        category,
        amount: signedAmount,
        date,
        keterangan: keterangan || `${trxType} ${category}`,
        donor: donor || (trxType === 'Pemasukan' ? 'Donatur Yayasan' : 'Pengeluaran Program'),
        anggaranId: trxType === 'Pengeluaran' ? (anggaranId || undefined) : undefined
      });
      setEditingTrx(null);
    } else {
      onAddTransaction({
        category,
        amount: signedAmount,
        date,
        keterangan: keterangan || `${trxType} ${category}`,
        donor: donor || (trxType === 'Pemasukan' ? 'Donatur Yayasan' : 'Pengeluaran Program'),
        anggaranId: trxType === 'Pengeluaran' ? (anggaranId || undefined) : undefined
      });
    }

    // Reset Form
    setAmount('');
    setKeterangan('');
    setDonor('');
    setAnggaranId('');
    setIsFormOpen(false);
  };

  // Calculations
  const activeTransactions = transactions.filter(t => selectedCategory === 'Semua' || t.category === selectedCategory);
  
  // Total of all filtered transactions (signed)
  const totalAmount = activeTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Calculate separate total incomes and expenses
  const totalIncomes = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const currentNetCash = totalIncomes - totalExpenses;

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(18, 66, 127);
    doc.text("YAYASAN KRISTEN GLORIA", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("LAPORAN ARUS KAS MASUK DAN PENGELUARAN DANA YAYASAN", 14, 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Waktu Cetak: 2026-06-04 | Saringan: ${selectedCategory} | Total Kas Bersih Yayasan: ${formatRupiah(currentNetCash)}`, 14, 33);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    const checkList = activeTransactions.map((t, index) => [
      index + 1,
      t.donor || "-",
      t.category || "-",
      t.date || "-",
      t.keterangan || "-",
      t.amount < 0 ? "Pengeluaran" : "Pemasukan",
      formatRupiah(t.amount)
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["No", "Donatur / Penerima", "Kategori Pos", "Tanggal Input", "Catatan Keterangan", "Tipe", "Nominal"]],
      body: checkList,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 66, 127] },
      columnStyles: {
        6: { halign: 'right' }
      }
    });

    doc.save(`Laporan-Keuangan-Yayasan-${selectedCategory.replace(/\s+/g, '-')}.pdf`);
  };

  // List of dynamic categorisation
  const categoryOptions = [
    'Ibadah Umum', 
    'Ucapan Syukur', 
    'Persepuluhan', 
    'Sektor', 
    'Donasi Sosial',
    'Kemitraan Yayasan',
    'Dana Sponsor',
    'Pengeluaran Operasional',
    'Pengeluaran Kegiatan'
  ];

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto print:p-0">
      {/* Printed Header Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-850 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight uppercase">BUKU LEDGER LAPORAN KAS &amp; TRANSAKSI YAYASAN</h1>
        <p className="text-xs font-semibold text-slate-700">Yayasan Kristen Gloria &bull; Sistem Akuntansi Terpadu</p>
        <p className="text-[10px] text-slate-500 mt-1">Dicetak pada: 2026-06-04 &bull; Sisa Saldo Bersih: {formatRupiah(currentNetCash)}</p>
      </div>

      {/* Main Title Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-[#3875d7]" />
            <span>Kas &amp; Keuangan Yayasan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Modul akuntansi komparatif untuk mencatat donasi masuk, persepuluhan, sumbangan kemitraan, beasiswa, serta pengeluaran yang terintegrasi dengan Rencana Anggaran Belanja (RAB).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportToPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap Kas</span>
          </button>
          <button
            onClick={() => {
              setEditingTrx(null);
              setAmount('');
              setKeterangan('');
              setDonor('');
              setAnggaranId('');
              setTrxType('Pemasukan');
              setIsFormOpen(true);
            }}
            className="bg-[#3875d7] hover:bg-[#1a5cb8] text-white py-2 px-4 rounded text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Input Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Financial Stats Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
        <div className="bg-emerald-50 border border-emerald-200 rounded p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Total Pemasukan (Donasi / Kas Masuk)</div>
            <div className="text-2xl font-mono font-bold text-emerald-800 mt-1">{formatRupiah(totalIncomes)}</div>
          </div>
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
            <ArrowUpRight className="w-5 h-5 font-bold" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Total Pengeluaran (Belanja Program / Sosial)</div>
            <div className="text-2xl font-mono font-bold text-rose-800 mt-1">{formatRupiah(totalExpenses)}</div>
          </div>
          <div className="p-2 bg-rose-100 text-rose-600 rounded-full">
            <ArrowDownRight className="w-5 h-5 font-bold" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded p-4 flex items-center justify-between col-span-1 md:col-span-1">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sisa Saldo Kas Bersih (Yayasan NET Cash)</div>
            <div className="text-2xl font-mono font-bold text-slate-800 mt-1">{formatRupiah(currentNetCash)}</div>
          </div>
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sifting/Filtering row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2 mb-2 print:hidden">
            <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Saring Kategori:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory('Semua')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'Semua'
                    ? 'bg-[#12427f] text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-600 hover:text-slate-800'
                }`}
              >
                Semua Kategori (Pemasukan &amp; Pengeluaran)
              </button>
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#12427f] text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-xs">
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Arus Transaksi Berjalan ({activeTransactions.length} baris)</span>
              <span className="font-mono text-slate-950 bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                Akumulasi Laci: {formatRupiah(totalAmount)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-850 font-bold uppercase text-[10px] border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4 animate-pulse">Nama / Penyumbang</th>
                    <th className="py-2.5 px-3">Kategori Pos</th>
                    <th className="py-2.5 px-3">Tanggal Input</th>
                    <th className="py-2.5 px-3">Keterangan Catatan</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTransactions.length > 0 ? (
                    activeTransactions.map((trx) => (
                      <tr key={trx.id} className={`hover:bg-slate-50/70 transition-colors ${editingTrx?.id === trx.id ? 'bg-amber-50/65' : ''}`}>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          <div>{trx.donor || 'Umum Yayasan'}</div>
                          {trx.anggaranId && budgets.length > 0 && (
                            <div className="text-[9.5px] text-indigo-700 flex items-center gap-0.5 mt-0.5 font-bold">
                              <Bookmark className="w-3 h-3 text-indigo-500" />
                              <span>RAB: {budgets.find(b => b.id === trx.anggaranId)?.nama || 'Anggaran Linked'}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            trx.amount < 0 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {trx.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{trx.date}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={trx.keterangan}>{trx.keterangan}</td>
                        <td className={`py-2.5 px-3 font-bold text-right font-mono ${
                          trx.amount < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {formatRupiah(trx.amount)}
                        </td>
                        <td className="py-2.5 px-3 print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditForm(trx)}
                              className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 p-1.5 rounded transition-all cursor-pointer"
                              title="Ubah Transaksi"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmId(trx.id);
                              }}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-all cursor-pointer"
                              title="Hapus Transaksi"
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
                        Tidak ada transaksi keuangan terdaftar pada kategori ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TRANSACTION ADD FORM */}
        <div className="border border-slate-200 rounded bg-slate-50 p-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#3875d7]" />
              <span>{editingTrx ? 'Ubah Catatan Keuangan' : 'Registrasi Kas Baru'}</span>
            </h3>
            {isFormOpen && (
              <button 
                onClick={handleCancelSubmit}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* INFLOW vs OUTFLOW TOGGLE */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Jenis Aliran Transaksi
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    setTrxType('Pemasukan');
                    setCategory('Ibadah Umum');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    trxType === 'Pemasukan' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Kas Masuk</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrxType('Pengeluaran');
                    setCategory('Pengeluaran Operasional');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    trxType === 'Pengeluaran' 
                      ? 'bg-rose-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Pengeluaran</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Kategori Pos Keuangan *
              </label>
              <select
                id="form-trx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-bold cursor-pointer"
              >
                {trxType === 'Pemasukan' ? (
                  <>
                    <option value="Ibadah Umum">Persembahan Kebaktian Umum</option>
                    <option value="Ucapan Syukur">Ucapan Syukur &amp; Persepuluhan</option>
                    <option value="Persepuluhan">Kas Persepuluhan Anggota</option>
                    <option value="Sektor">Kas Sektor Wilayah</option>
                    <option value="Donasi Sosial">Donasi Sosial Khusus</option>
                    <option value="Kemitraan Yayasan">Dana Kemitraan Sinode / CSR</option>
                    <option value="Dana Sponsor">Sponsor Pembangunan Core-Team</option>
                  </>
                ) : (
                  <>
                    <option value="Pengeluaran Operasional">Pengeluaran Operasional Kantor</option>
                    <option value="Pengeluaran Kegiatan">Pengeluaran Roster / Program Kegiatan</option>
                    <option value="Donasi Sosial">Penyaluran Santunan Sosial / Diakonia</option>
                    <option value="Beasiswa Pendidikan">Penyaluran Program Beasiswa Anak Asuh</option>
                  </>
                )}
              </select>
            </div>

            {/* INTEGRATED BUDGET LIST LINKER */}
            {trxType === 'Pengeluaran' && budgets.length > 0 && (
              <div className="bg-[#f0f4f9] p-3 rounded-md border border-indigo-100">
                <label className="block text-[10px] font-extrabold text-indigo-900 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Alokasikan ke Rencana Anggaran (RAB)</span>
                </label>
                <select
                  value={anggaranId}
                  onChange={(e) => setAnggaranId(e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded px-2 py-1.5 text-xs text-indigo-950 focus:ring-1 focus:ring-indigo-650 cursor-pointer font-semibold"
                >
                  <option value="">-- Bebas (Tanpa Potong Anggaran) --</option>
                  {budgets.map(b => {
                    const sisa = b.alokasi - b.terpakai;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.nama} (Sisa: {formatRupiah(sisa)})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[9px] text-indigo-500 mt-1.5">
                  Menghubungkan pengeluaran ini langsung memperbarui penyerapan pos RAB real-time.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Jumlah Nominal (Rupiah) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  id="form-trx-amount"
                  type="text"
                  required
                  placeholder="Contoh: 1500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded pl-9 pr-3 py-2 text-xs text-slate-800 font-bold focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Hanya masukkan angka saja, simbol titik atau koma otomatis diatur.</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Tanggal Aliran Dana
              </label>
              <input
                id="form-trx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                {trxType === 'Pemasukan' ? 'Nama Donatur / Member' : 'Nama Penerima Kas / Pemotong'}
              </label>
              <input
                id="form-trx-donor"
                type="text"
                placeholder={trxType === 'Pemasukan' ? 'Contoh: Ronald Purba, M.Sc' : 'Contoh: Vendor Media, Konsumsi, Sekre'}
                value={donor}
                onChange={(e) => setDonor(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                Keterangan Catatan Tambahan
              </label>
              <textarea
                id="form-trx-desc"
                placeholder="Deskripsikan tujuan penerimaan/penggunaan dana ini secara rinci..."
                value={keterangan}
                rows={2}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden resize-none font-medium"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                id="form-submit-trx"
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{editingTrx ? 'Simpan Perubahan' : 'Masukkan Pembukuan'}</span>
              </button>
              
              {editingTrx && (
                <button
                  type="button"
                  onClick={handleCancelSubmit}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* CONFIRM DELETE DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-sm w-full shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 rounded-full text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950 font-sans tracking-tight">
                  Konfirmasi Hapus Transaksi
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus catatan transaksi senilai <strong>{formatRupiah(transactions.find(t => t.id === deleteConfirmId)?.amount || 0)}</strong> ini? Tindakan ini dapat merubah saldo pembukuan bersih.
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
                  onDeleteTransaction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition-colors cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
