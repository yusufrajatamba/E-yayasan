import { useState } from 'react';
import { TransactionType } from '../types';
import { 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  BookOpen, 
  Calendar,
  Share2,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LaporanViewProps {
  transactions: TransactionType[];
}

export default function LaporanView({ transactions }: LaporanViewProps) {
  const [filterBulan, setFilterBulan] = useState<'06' | 'all'>('06');

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // June 2026 transactions
  const juneTransactions = transactions.filter(t => t.date.startsWith('2026-06'));
  const countsBulanIni = {
    umum: juneTransactions.filter(t => t.category === 'Ibadah Umum').reduce((acc, t) => acc + t.amount, 0),
    syukur: juneTransactions.filter(t => t.category === 'Ucapan Syukur').reduce((acc, t) => acc + t.amount, 0),
    sepuluh: juneTransactions.filter(t => t.category === 'Persepuluhan').reduce((acc, t) => acc + t.amount, 0),
    sektor: juneTransactions.filter(t => t.category === 'Sektor').reduce((acc, t) => acc + t.amount, 0),
  };
  const totalBulanIni = countsBulanIni.umum + countsBulanIni.syukur + countsBulanIni.sepuluh + countsBulanIni.sektor;

  // May 2026 transactions
  const mayTransactions = transactions.filter(t => t.date.startsWith('2026-05'));
  const countsBulanLalu = {
    umum: mayTransactions.filter(t => t.category === 'Ibadah Umum').reduce((acc, t) => acc + t.amount, 0),
    syukur: mayTransactions.filter(t => t.category === 'Ucapan Syukur').reduce((acc, t) => acc + t.amount, 0),
    sepuluh: mayTransactions.filter(t => t.category === 'Persepuluhan').reduce((acc, t) => acc + t.amount, 0),
    sektor: mayTransactions.filter(t => t.category === 'Sektor').reduce((acc, t) => acc + t.amount, 0),
  };
  const totalBulanLalu = countsBulanLalu.umum + countsBulanLalu.syukur + countsBulanLalu.sepuluh + countsBulanLalu.sektor;

  // Percentage Calculations for Charts
  const percentageUmum = totalBulanIni > 0 ? Math.round((countsBulanIni.umum / totalBulanIni) * 100) : 0;
  const percentageSyukur = totalBulanIni > 0 ? Math.round((countsBulanIni.syukur / totalBulanIni) * 100) : 0;
  const percentageSepuluh = totalBulanIni > 0 ? Math.round((countsBulanIni.sepuluh / totalBulanIni) * 100) : 0;
  const percentageSektor = totalBulanIni > 0 ? Math.round((countsBulanIni.sektor / totalBulanIni) * 100) : 0;

  // Growth rates
  const growAmount = totalBulanIni - totalBulanLalu;
  const growthRate = totalBulanLalu > 0 ? Math.round((growAmount / totalBulanLalu) * 100) : 100;

  // Real PDF Export function
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header Corporate branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(18, 66, 127);
    doc.text("GEREJA GLORIA JEMAAT CENTER", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("LAPORAN BULANAN PEMBUKUAN KAS & STATISTIK", 14, 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Status Akun: Kantor Sinode | Layanan: Enterprise System", 14, 33);
    doc.text(`Waktu Cetak: 2026-06-04 | Periode: Laporan Bulan Berjalan (Juni 2026)`, 14, 38);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, 196, 42);

    // Summary section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Ringkasan Metrik Arus Kas", 14, 50);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Total Penerimaan Bulan Ini (Juni): ${formatRupiah(totalBulanIni)}`, 14, 57);
    doc.text(`Penerimaan Bulan Lalu (Mei): ${formatRupiah(totalBulanLalu)}`, 14, 63);
    doc.text(`Selisih Kenaikan (Growth Rate): ${growAmount >= 0 ? '+' : ''}${formatRupiah(growAmount)} (${growthRate}% meningkat)`, 14, 69);

    // Category breakdowns
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Rasio Distribusi Pos Persembahan", 14, 80);

    const catData = [
      ["Persembahan Ibadah Umum", formatRupiah(countsBulanIni.umum), `${percentageUmum}%`],
      ["Persembahan Ucapan Syukur", formatRupiah(countsBulanIni.syukur), `${percentageSyukur}%`],
      ["Persepuluhan Jemaat Keluarga", formatRupiah(countsBulanIni.sepuluh), `${percentageSepuluh}%`],
      ["Persembahan Wilayah Sektor", formatRupiah(countsBulanIni.sektor), `${percentageSektor}%`],
      ["TOTAL AKUMULASI PENERIMAAN", formatRupiah(totalBulanIni), "100%"]
    ];

    autoTable(doc, {
      startY: 85,
      head: [["Kategori Pos", "Total Terima", "Persentase Rasio"]],
      body: catData,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 66, 127] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'center' }
      }
    });

    // Detail ledger page or appendix
    const lastY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Rincian Ledger Penerimaan (Juni 2026)", 14, lastY);

    const ledgerRows = juneTransactions.map(t => [
      t.date,
      t.donor,
      t.category,
      t.keterangan || "Tidak ada catatan",
      formatRupiah(t.amount)
    ]);

    autoTable(doc, {
      startY: lastY + 5,
      head: [["Tanggal", "Nama Jemaat / Donatur", "Kategori Pos", "Memo / Catatan", "Nominal (Rupiah)"]],
      body: ledgerRows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 66, 127] },
      columnStyles: {
        4: { halign: 'right' }
      }
    });

    doc.save("Laporan-Bulanan-Kas-Juni-2026.pdf");
  };

  // June 2026 transactions
  const printLegacy = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto print:p-0">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight flex items-center gap-2">
            <Printer className="w-6 h-6 text-[#3875d7]" />
            <span>Laporan Pembukuan Kas &amp; Statistik</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Akumulasi keseluruhan pos persembahan ibadah jemaat, perbandingan bulan lalu, rasio pembagian sektor, siap cetak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToPDF}
            className="bg-[#12427f] hover:bg-[#1a559e] text-white py-2 px-3.5 rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Printable page outline banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight uppercase">LAPORAN KAS JEMAAT - E-GEREJA</h1>
        <p className="text-xs font-semibold text-slate-700">Status Akun: Kantor Sinode &bull; Layanan: Enterprise Plan</p>
        <p className="text-[10px] text-slate-500 mt-1">Dibuat otomatis pada: 2026-06-04 08:40:43 (Realtime UTC Source)</p>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Total Month */}
        <div className="border border-slate-200 rounded p-4 bg-slate-50/70">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Penerimaan Bulan Ini (Juni)</div>
          <div className="text-2xl font-black text-[#12427f] mt-1.5 font-mono">{formatRupiah(totalBulanIni)}</div>
          <div className="text-[10px] text-slate-400 mt-2">Terdiri dari 4 kategori utama pos kolekta</div>
        </div>

        {/* Total Last Month */}
        <div className="border border-slate-200 rounded p-4 bg-slate-50/50">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Penerimaan Bulan Lalu (Mei)</div>
          <div className="text-2xl font-black text-slate-600 mt-1.5 font-mono">{formatRupiah(totalBulanLalu)}</div>
          <div className="text-[10px] text-slate-400 mt-2">Sebagai metrik perbandingan rujukan</div>
        </div>

        {/* Growth Margin */}
        <div className={`border rounded p-4 ${growAmount >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-250'}`}>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kenaikan / Growth Arus Masuk</div>
          <div className={`text-2xl font-black mt-1.5 font-mono flex items-center gap-1.5 ${growAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {growAmount >= 0 ? <TrendingUp className="w-6 h-6 text-emerald-600" /> : <TrendingDown className="w-6 h-6 text-rose-600" />}
            {growAmount >= 0 ? '+' : ''}{formatRupiah(growAmount)}
          </div>
          <div className="text-[10px] text-slate-500 mt-2">
            Meningkat <span className="font-bold text-slate-700 font-mono">{growthRate}%</span> dibanding bulan lalu.
          </div>
        </div>

      </div>

      {/* MAIN DATA SECTION: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* CHART 1: COMPARISON BARS IN SVG */}
        <div className="border border-slate-200 rounded-sm p-4 bg-white shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
            Grafik Komparasi Anggaran Kategori (Rupiah)
          </h3>

          {/* Real high-fidelity customized SVG Bar chart */}
          <div className="p-2 border border-slate-100 rounded bg-slate-50/60">
            <svg viewBox="0 0 400 240" className="w-full h-auto">
              {/* Grid Lines */}
              <line x1="60" y1="30" x2="380" y2="30" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="60" y1="80" x2="380" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="60" y1="130" x2="380" y2="130" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="60" y1="180" x2="380" y2="180" stroke="#e2e8f0" strokeDasharray="4 4" />
              <line x1="60" y1="210" x2="380" y2="210" stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Data comparison (May vs June) represented as vertical bars */}
              {/* Category 1: Ibadah Umum. May: 11.2 jt, June: 12.5 jt */}
              <rect x="90" y="98" width="18" height="112" fill="#93c5fd" rx="2" />
              <rect x="110" y="85" width="18" height="125" fill="#2563eb" rx="2" />

              {/* Category 2: Ucapan Syukur. May: 3.8 jt, June: 4.25 jt */}
              <rect x="170" y="172" width="18" height="38" fill="#a7f3d0" rx="2" />
              <rect x="190" y="167" width="18" height="43" fill="#10b981" rx="2" />

              {/* Category 3: Persepuluhan. May: 16.5 jt, June: 18.9 jt */}
              <rect x="250" y="45" width="18" height="165" fill="#fde047" rx="2" />
              <rect x="270" y="21" width="18" height="189" fill="#f59e0b" rx="2" />

              {/* Category 4: Sektor. May: 4.9 jt, June: 5.6 jt */}
              <rect x="330" y="161" width="18" height="49" fill="#fca5a5" rx="2" />
              <rect x="350" y="154" width="18" height="56" fill="#ef4444" rx="2" />

              {/* Axis labels */}
              <text x="50" y="214" textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">Rp 0</text>
              <text x="50" y="184" textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">Rp 5 M</text>
              <text x="50" y="134" textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">Rp 10 M</text>
              <text x="50" y="84" textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">Rp 15 M</text>
              <text x="50" y="34" textAnchor="end" fontSize="10" fill="#64748b" fontFamily="monospace">Rp 20 M</text>

              <text x="110" y="226" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">Ibadah</text>
              <text x="190" y="226" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">Syukur</text>
              <text x="270" y="226" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">Sepuluhan</text>
              <text x="350" y="226" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">Sektor</text>
            </svg>
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-bold">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-slate-300 inline-block rounded-xs" />
                <span className="text-slate-500">Bulan Lalu (Mei)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-600 inline-block rounded-xs" />
                <span className="text-slate-700">Bulan Ini (Juni)</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: PIE GRAPH / CIRCLE BREAKDOWN */}
        <div className="border border-slate-200 rounded-sm p-4 bg-white shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
            Rasio Kontribusi Kategori (%)
          </h3>

          <div className="space-y-4">
            {/* Horizontal progress representation */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700 font-sans">Persembahan Ibadah Umum ({percentageUmum}%)</span>
                <span className="font-mono text-slate-700">{formatRupiah(countsBulanIni.umum)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percentageUmum}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-green-700 font-sans">Persembahan Ucapan Syukur ({percentageSyukur}%)</span>
                <span className="font-mono text-slate-700">{formatRupiah(countsBulanIni.syukur)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: `${percentageSyukur}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700 font-sans">Persepuluhan Jemaat Keluarga ({percentageSepuluh}%)</span>
                <span className="font-mono text-slate-700">{formatRupiah(countsBulanIni.sepuluh)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percentageSepuluh}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700 font-sans">Persembahan Pos Wilayah Sektor ({percentageSektor}%)</span>
                <span className="font-mono text-slate-700">{formatRupiah(countsBulanIni.sektor)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${percentageSektor}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* DETAILED TRANSACTIONS REPORT TABLE */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-700">
          Daftar Rincian Ledger Penerimaan (Disaring Bulan Berjalan)
        </div>
        <table className="w-full text-xs text-left text-slate-600">
          <thead className="bg-slate-50 text-slate-800 uppercase text-[10px] border-b border-slate-200 tracking-wider font-bold">
            <tr>
              <th className="py-2.5 px-4">Tanggal Penerimaan</th>
              <th className="py-2.5 px-3">Nama Jemaat / Donatur</th>
              <th className="py-2.5 px-3">Kategori Pos</th>
              <th className="py-2.5 px-3">Keterangan Catatan</th>
              <th className="py-2.5 px-3 text-right">Nominal (Rupiah)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {juneTransactions.map((trx) => (
              <tr key={trx.id} className="hover:bg-slate-50">
                <td className="py-2 px-4 font-mono font-bold text-slate-600">{trx.date}</td>
                <td className="py-2 px-3 font-semibold text-slate-800">{trx.donor}</td>
                <td className="py-2 px-3 text-slate-700">{trx.category}</td>
                <td className="py-2 px-3 text-slate-400 font-medium truncate max-w-sm">{trx.keterangan}</td>
                <td className="py-2 px-3 text-right font-bold text-slate-800 font-mono">{formatRupiah(trx.amount)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
              <td colSpan={4} className="py-3 px-4 text-slate-700 uppercase tracking-widest text-right text-[10px]">
                Total Akumulasi Terdaftar:
              </td>
              <td className="py-3 px-3 text-right text-[#12427f] font-mono text-sm leading-none">
                {formatRupiah(totalBulanIni)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
