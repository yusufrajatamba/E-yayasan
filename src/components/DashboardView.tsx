import { useState } from 'react';
import { 
  Member, 
  TransactionType 
} from '../types';
import { 
  TrendingUp, 
  Calendar, 
  Gift, 
  Heart,
  PlusCircle, 
  Info,
  Layers,
  ArrowRightCircle,
  Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardViewProps {
  members: Member[];
  transactions: TransactionType[];
  onNavigateToView: (view: string) => void;
}

export default function DashboardView({ members, transactions, onNavigateToView }: DashboardViewProps) {
  // Let the user switch between "Exact Replica Mode" (which displays zeros and January dates as shown in the screenshot)
  // and "Dynamic Live Mode" (which computes active calculations and lists people in June 2026 based on live transactions).
  const [tampilanMode, setTampilanMode] = useState<'gambar' | 'riil'>('riil');

  // Calculating Monthly Totals for June 2026 (Bulan Ini)
  const juneTransactions = transactions.filter(t => t.date.startsWith('2026-06'));
  const countsBulanIni = {
    umum: juneTransactions.filter(t => t.category === 'Ibadah Umum').reduce((acc, t) => acc + t.amount, 0),
    syukur: juneTransactions.filter(t => t.category === 'Ucapan Syukur').reduce((acc, t) => acc + t.amount, 0),
    sepuluh: juneTransactions.filter(t => t.category === 'Persepuluhan').reduce((acc, t) => acc + t.amount, 0),
    sektor: juneTransactions.filter(t => t.category === 'Sektor').reduce((acc, t) => acc + t.amount, 0),
  };

  // Calculating Monthly Totals for May 2026 (Bulan Lalu)
  const mayTransactions = transactions.filter(t => t.date.startsWith('2026-05'));
  const countsBulanLalu = {
    umum: mayTransactions.filter(t => t.category === 'Ibadah Umum').reduce((acc, t) => acc + t.amount, 0),
    syukur: mayTransactions.filter(t => t.category === 'Ucapan Syukur').reduce((acc, t) => acc + t.amount, 0),
    sepuluh: mayTransactions.filter(t => t.category === 'Persepuluhan').reduce((acc, t) => acc + t.amount, 0),
    sektor: mayTransactions.filter(t => t.category === 'Sektor').reduce((acc, t) => acc + t.amount, 0),
  };

  // Real PDF Export for Dashboard Data
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(18, 66, 127);
    doc.text("GEREJA GLORIA JEMAAT CENTER", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("LAPORAN RINGKAS STATUS DASHBOARD SISTEM INTEGRASI GEREJA", 14, 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Waktu Cetak: 2026-06-04 | Mode Tampilan: ${tampilanMode === 'riil' ? 'Real-time Live' : 'Screenshot Replication'}`, 14, 33);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    // Grid stats
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Statistik Utama Jemaat:", 14, 45);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Total Keanggotaan: ${members.length} Jiwa`, 14, 52);
    doc.text(`Sektor I (Baitel): ${members.filter(m => m.sektor === 'Sektor I').length} Jiwa`, 14, 58);
    doc.text(`Sektor II (Efrata): ${members.filter(m => m.sektor === 'Sektor II').length} Jiwa`, 14, 64);
    doc.text(`Sektor III (Gideon): ${members.filter(m => m.sektor === 'Sektor III').length} Jiwa`, 14, 70);
    doc.text(`Sektor IV (Sion): ${members.filter(m => m.sektor === 'Sektor IV').length} Jiwa`, 14, 76);

    const formatRupiahLocal = (num: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(num);
    };

    // Financial Table
    doc.setFont("helvetica", "bold");
    doc.text("Finansial Bulanan Berjalan (Juni vs Mei):", 14, 88);

    const financialRows = [
      ["Ibadah Umum", formatRupiahLocal(countsBulanLalu.umum), formatRupiahLocal(countsBulanIni.umum)],
      ["Ucapan Syukur", formatRupiahLocal(countsBulanLalu.syukur), formatRupiahLocal(countsBulanIni.syukur)],
      ["Persepuluhan", formatRupiahLocal(countsBulanLalu.sepuluh), formatRupiahLocal(countsBulanIni.sepuluh)],
      ["Sektor", formatRupiahLocal(countsBulanLalu.sektor), formatRupiahLocal(countsBulanIni.sektor)],
    ];

    autoTable(doc, {
      startY: 94,
      head: [["Kategori Kas", "Realisasi Mei (Bulan Lalu)", "Realisasi Juni (Bulan Ini)"]],
      body: financialRows,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 66, 127] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' }
      }
    });

    doc.save("Dashboard-Overview-Gereja-Gloria.pdf");
  };

  // Birthdays matching "12 Januari s/d 18 Januari" & "19 Januari s/d 25 Januari" for "Gambar Mode"
  // vs "01 Juni s/d 07 Juni" & "08 Juni s/d 14 Juni" for "Riil Mode"
  const getBirthdaysThisWeek = (): { index: number; member: Member; displayDate: string }[] => {
    if (tampilanMode === 'gambar') {
      // Return beautiful mock items that can be displayed
      return [
        { index: 1, member: { id: 'dg1', nama: 'gloria (Admin)', tglUlangTahun: '1998-01-14' }, displayDate: '14 Januari' },
        { index: 2, member: { id: 'dg2', nama: 'Siska Simorangkir', tglUlangTahun: '1993-01-16' }, displayDate: '16 Januari' }
      ];
    } else {
      // Filter dynamically for June 1 to June 7
      return members
        .filter(m => {
          const mMonth = m.tglUlangTahun.substring(5, 7);
          const mDay = parseInt(m.tglUlangTahun.substring(8, 10));
          return mMonth === '06' && mDay >= 1 && mDay <= 7;
        })
        .map((m, idx) => {
          const day = m.tglUlangTahun.substring(8, 10);
          return { index: idx + 1, member: m, displayDate: `${day} Juni` };
        });
    }
  };

  const getBirthdaysNextWeek = (): { index: number; member: Member; displayDate: string }[] => {
    if (tampilanMode === 'gambar') {
      return [
        { index: 1, member: { id: 'dg3', nama: 'Yusuf Tamba', tglUlangTahun: '1990-01-22' }, displayDate: '22 Januari' },
        { index: 2, member: { id: 'dg4', nama: 'Natalia Pangaribuan', tglUlangTahun: '1987-01-24' }, displayDate: '24 Januari' }
      ];
    } else {
      // Filter dynamically for June 8 to June 14
      return members
        .filter(m => {
          const mMonth = m.tglUlangTahun.substring(5, 7);
          const mDay = parseInt(m.tglUlangTahun.substring(8, 10));
          return mMonth === '06' && mDay >= 8 && mDay <= 14;
        })
        .map((m, idx) => {
          const day = m.tglUlangTahun.substring(8, 10);
          return { index: idx + 1, member: m, displayDate: `${day} Juni` };
        });
    }
  };

  // Wedding Anniversaries matching the screenshot
  const getWeddingsThisWeek = (): { index: number; names: string; tgl: string }[] => {
    if (tampilanMode === 'gambar') {
      return [
        { index: 1, names: 'Kel. Budi Hutapea / Clara', tgl: '12 Januari' },
        { index: 2, names: 'Kel. Ronaldo Simanjuntak / Siska', tgl: '15 Januari' }
      ];
    } else {
      // June 1 to June 7 anniversaries
      return members
        .filter(m => m.tglPernikahan && m.statusKeluarga === 'Kepala Keluarga')
        .filter(m => {
          if (!m.tglPernikahan) return false;
          const month = m.tglPernikahan.substring(5, 7);
          const day = parseInt(m.tglPernikahan.substring(8, 10));
          return month === '06' && day >= 1 && day <= 7;
        })
        .map((m, idx) => {
          const wife = members.find(w => w.statusKeluarga === 'Istri' && w.alamat === m.alamat);
          const dayLabel = m.tglPernikahan ? m.tglPernikahan.substring(8, 10) : '01';
          return {
            index: idx + 1,
            names: `Kel. ${m.nama.split(' ')[0]} / ${wife ? wife.nama.split(' ')[0] : 'Isteri'}`,
            tgl: `${dayLabel} Juni`
          };
        });
    }
  };

  const getWeddingsNextWeek = (): { index: number; names: string; tgl: string }[] => {
    if (tampilanMode === 'gambar') {
      return [
        { index: 1, names: 'Kel. Samuel Nainggolan / Maria', tgl: '21 Januari' }
      ];
    } else {
      // June 8 to June 14 anniversaries
      return members
        .filter(m => m.tglPernikahan && m.statusKeluarga === 'Kepala Keluarga')
        .filter(m => {
          if (!m.tglPernikahan) return false;
          const month = m.tglPernikahan.substring(5, 7);
          const day = parseInt(m.tglPernikahan.substring(8, 10));
          return month === '06' && day >= 8 && day <= 14;
        })
        .map((m, idx) => {
          const wife = members.find(w => w.statusKeluarga === 'Istri' && w.alamat === m.alamat);
          const dayLabel = m.tglPernikahan ? m.tglPernikahan.substring(8, 10) : '08';
          return {
            index: idx + 1,
            names: `Kel. ${m.nama.split(' ')[0]} / ${wife ? wife.nama.split(' ')[0] : 'Isteri'}`,
            tgl: `${dayLabel} Juni`
          };
        });
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Setup the grid block statistics
  const getStats = (period: 'ini' | 'lalu') => {
    const activeCounts = period === 'ini' ? countsBulanIni : countsBulanLalu;
    
    return [
      {
        id: 'umum',
        label: 'Persembahan Ibadah Umum',
        bgColor: 'bg-[#3583ca] hover:bg-[#2d73b3]',
        value: tampilanMode === 'gambar' ? '0' : formatRupiah(activeCounts.umum)
      },
      {
        id: 'syukur',
        label: 'Ucapan Syukur',
        bgColor: 'bg-[#53b85d] hover:bg-[#45a34e]',
        value: tampilanMode === 'gambar' ? '0' : formatRupiah(activeCounts.syukur)
      },
      {
        id: 'sepuluh',
        label: 'Persepuluhan',
        bgColor: 'bg-[#f1b255] hover:bg-[#e09e3e]',
        value: tampilanMode === 'gambar' ? '0' : formatRupiah(activeCounts.sepuluh)
      },
      {
        id: 'sektor',
        label: 'Persembahan Sektor',
        bgColor: 'bg-[#d25454] hover:bg-[#bd4545]',
        value: tampilanMode === 'gambar' ? '0' : formatRupiah(activeCounts.sektor)
      }
    ];
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto print:p-0">
      {/* Printed Header Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-850 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight uppercase">DASHBOARD LAPORAN UTAMA E-GEREJA</h1>
        <p className="text-xs font-semibold text-slate-700">Gereja Gloria Jemaat Center &bull; Layanan: Enterprise System</p>
        <p className="text-[10px] text-slate-500 mt-1">Dicetak pada tanggal: 2026-06-04 &bull; Status Operasional: Normal</p>
      </div>

      {/* Upper Dashboard Title & Package bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold font-sans text-slate-800 tracking-tight">
            Dashboard Gereja
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gereja Management System &bull; Kantor Administrator &bull; Wilayah Indonesia
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-cetak-dashboard"
            onClick={exportToPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer self-stretch"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Ekspor PDF</span>
          </button>

          {/* Enterprise plan activation detail */}
          <div className="bg-[#e2f0d9] border border-[#c5e0b4] rounded overflow-hidden shadow-sm">
            <div className="bg-[#a9d18e] px-4 py-1 text-center text-[11px] font-bold text-slate-800 tracking-wide uppercase">
              Paket E-Gereja Enterprise
            </div>
            <div className="px-5 py-1.5 text-center text-[11px] font-semibold text-slate-700 bg-white/70">
              Aktif hingga : <span className="font-mono text-slate-900">15-02-2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE MODE CHANGER SWITCH */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">Mode Interaktif Cerdas:</span> Anda dapat berpindah antara representasi data statis (dari screenshot) atau data riil transaksional yang bisa Anda ubah di menu samping!
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-200 p-1 rounded-md shrink-0">
          <button
            onClick={() => setTampilanMode('gambar')}
            className={`px-3 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
              tampilanMode === 'gambar'
                ? 'bg-[#12427f] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Sesuai Gambar (Nilai 0)
          </button>
          <button
            onClick={() => setTampilanMode('riil')}
            className={`px-3 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
              tampilanMode === 'riil'
                ? 'bg-[#3875d7] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Simulasi Data Riil
          </button>
        </div>
      </div>

      {/* SECTION 1: PENERIMAAN BULAN INI */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-[#3875d7] rounded-full" />
          Penerimaan Bulan Ini {tampilanMode === 'riil' && <span className="text-[10px] text-[#3875d7] normal-case ml-1">(Juni 2026)</span>}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getStats('ini').map((stat) => (
            <div 
              key={`ini-${stat.id}`}
              className={`${stat.bgColor} cursor-pointer rounded-sm p-4 text-white shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md h-[92px] flex flex-col justify-between`}
              onClick={() => onNavigateToView('transaksi')}
            >
              <div className="text-[11px] font-bold tracking-wide text-white/90 text-right opacity-90 truncate">
                {stat.label}
              </div>
              <div className="text-3xl font-bold tracking-tight text-right w-full pr-1">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: PENERIMAAN BULAN LALU */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-[#718096] rounded-full" />
          Penerimaan Bulan Lalu {tampilanMode === 'riil' && <span className="text-[10px] text-slate-500 normal-case ml-1">(Mei 2026)</span>}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {getStats('lalu').map((stat) => (
            <div 
              key={`lalu-${stat.id}`}
              className={`${stat.bgColor} cursor-pointer rounded-sm p-4 text-white/85 shadow-sm relative overflow-hidden opacity-90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md h-[92px] flex flex-col justify-between`}
              onClick={() => onNavigateToView('transaksi')}
            >
              <div className="text-[11px] font-bold tracking-wide text-white/90 text-right opacity-90 truncate">
                {stat.label}
              </div>
              <div className="text-3xl font-bold tracking-tight text-right w-full pr-1">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: BIRTHDAYS AND WEDDING ANNIVERSARIES (SPLIT COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: JEMAAT YANG BERULANG TAHUN */}
        <div className="border border-[#b8cce4] rounded-sm shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-[#4f81bd] text-white px-4 py-2 text-xs font-bold flex items-center gap-2">
            <Gift className="w-4 h-4 shrink-0" />
            <span>Jemaat Yang Berulang Tahun</span>
          </div>

          <div className="p-4 bg-slate-50 flex-1 flex flex-col gap-5">
            {/* 1. MINGGU INI */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-t-sm border-b-0 flex items-center justify-between">
                <span>
                  {tampilanMode === 'gambar' 
                    ? 'Minggu Ini ( 12 Januari s/d 18 Januari )' 
                    : 'Minggu Ini ( 01 Juni s/d 07 Juni )'}
                </span>
                <span className="text-[10px] text-blue-600 font-mono font-medium">Bulan Berjalan</span>
              </h4>
              <div className="bg-white border border-slate-200 overflow-x-auto rounded-b-sm">
                <table className="w-full text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-1 px-3 text-left w-12 border-r border-slate-200">#</th>
                      <th className="py-1 px-3 text-left border-r border-slate-200">Nama</th>
                      <th className="py-1 px-3 text-left">Tgl Ulang Tahun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getBirthdaysThisWeek().length > 0 ? (
                      getBirthdaysThisWeek().map((row) => (
                        <tr key={row.member.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                          <td className="py-1.5 px-3 border-r border-slate-200 font-mono text-slate-400">{row.index}</td>
                          <td className="py-1.5 px-3 border-r border-slate-200 font-medium text-slate-800">{row.member.nama}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-600">{row.displayDate}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 px-3 text-center text-slate-400 italic">
                          Tidak ada jemaat yang berulang tahun minggu ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. MINGGU DEPAN */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-t-sm border-b-0 flex items-center justify-between">
                <span>
                  {tampilanMode === 'gambar' 
                    ? 'Minggu Depan ( 19 Januari s/d 25 Januari )' 
                    : 'Minggu Depan ( 08 Juni s/d 14 Juni )'}
                </span>
                <span className="text-[10px] text-emerald-600 font-mono font-medium">Minggu Yad</span>
              </h4>
              <div className="bg-white border border-slate-200 overflow-x-auto rounded-b-sm">
                <table className="w-full text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-1 px-3 text-left w-12 border-r border-slate-200">#</th>
                      <th className="py-1 px-3 text-left border-r border-slate-200">Nama</th>
                      <th className="py-1 px-3 text-left">Tgl Ulang Tahun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getBirthdaysNextWeek().length > 0 ? (
                      getBirthdaysNextWeek().map((row) => (
                        <tr key={row.member.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                          <td className="py-1.5 px-3 border-r border-slate-200 font-mono text-slate-400">{row.index}</td>
                          <td className="py-1.5 px-3 border-r border-slate-200 font-medium text-slate-800">{row.member.nama}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-600">{row.displayDate}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 px-3 text-center text-slate-400 italic">
                          Tidak ada jemaat yang berulang tahun minggu depan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Navigation Action link */}
            <button 
              onClick={() => onNavigateToView('keanggotaan')}
              className="mt-auto self-end text-xs text-[#3875d7] hover:text-[#183a5c] font-semibold flex items-center gap-1.5 bg-white border border-slate-200 rounded px-3 py-1 shadow-xs transition-colors cursor-pointer"
            >
              <span>Atur Data Keanggotaan</span>
              <ArrowRightCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: ULANG TAHUN PERNIKAHAN JEMAAT */}
        <div className="border border-[#b8cce4] rounded-sm shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-[#4f81bd] text-white px-4 py-2 text-xs font-bold flex items-center gap-2">
            <Heart className="w-4 h-4 shrink-0 fill-white/20" />
            <span>Ulang Tahun Pernikahan Jemaat</span>
          </div>

          <div className="p-4 bg-slate-50 flex-1 flex flex-col gap-5">
            {/* 1. MINGGU INI */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-t-sm border-b-0 flex items-center justify-between">
                <span>
                  {tampilanMode === 'gambar' 
                    ? 'Minggu Ini ( 12 Januari s/d 18 Januari )' 
                    : 'Minggu Ini ( 01 Juni s/d 07 Juni )'}
                </span>
                <span className="text-[10px] text-blue-600 font-mono font-medium">Bulan Berjalan</span>
              </h4>
              <div className="bg-white border border-slate-200 overflow-x-auto rounded-b-sm">
                <table className="w-full text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-1 px-3 text-left w-12 border-r border-slate-200">#</th>
                      <th className="py-1 px-3 text-left border-r border-slate-200">Nama</th>
                      <th className="py-1 px-3 text-left">Tgl Pernikahan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getWeddingsThisWeek().length > 0 ? (
                      getWeddingsThisWeek().map((row) => (
                        <tr key={row.index} className="border-b border-slate-100 hover:bg-slate-50/80">
                          <td className="py-1.5 px-3 border-r border-slate-200 font-mono text-slate-400">{row.index}</td>
                          <td className="py-1.5 px-3 border-r border-slate-200 font-medium text-slate-800">{row.names}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-600">{row.tgl}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 px-3 text-center text-slate-400 italic">
                          Tidak ada ulang tahun pernikahan jemaat minggu ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. MINGGU DEPAN */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-t-sm border-b-0 flex items-center justify-between">
                <span>
                  {tampilanMode === 'gambar' 
                    ? 'Minggu Depan ( 19 Januari s/d 25 Januari )' 
                    : 'Minggu Depan ( 08 Juni s/d 14 Juni )'}
                </span>
                <span className="text-[10px] text-emerald-600 font-mono font-medium">Minggu Yad</span>
              </h4>
              <div className="bg-white border border-slate-200 overflow-x-auto rounded-b-sm">
                <table className="w-full text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-1 px-3 text-left w-12 border-r border-slate-200">#</th>
                      <th className="py-1 px-3 text-left border-r border-slate-200">Nama</th>
                      <th className="py-1 px-3 text-left">Tgl Pernikahan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getWeddingsNextWeek().length > 0 ? (
                      getWeddingsNextWeek().map((row) => (
                        <tr key={row.index} className="border-b border-slate-100 hover:bg-slate-50/80">
                          <td className="py-1.5 px-3 border-r border-slate-200 font-mono text-slate-400">{row.index}</td>
                          <td className="py-1.5 px-3 border-r border-slate-200 font-medium text-slate-800">{row.names}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-600">{row.tgl}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 px-3 text-center text-slate-400 italic">
                          Tidak ada ulang tahun pernikahan jemaat minggu depan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick form additions action link */}
            <button 
              onClick={() => onNavigateToView('keanggotaan')}
              className="mt-auto self-end text-xs text-[#3875d7] hover:text-[#183a5c] font-semibold flex items-center gap-1.5 bg-white border border-slate-200 rounded px-3 py-1 shadow-xs transition-colors cursor-pointer"
            >
              <span>Ubah Informasi Pernikahan</span>
              <ArrowRightCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Floating green whatsapp contact support mimic from screenshot */}
      <div className="fixed bottom-6 right-6 z-50">
        <a 
          href="https://wa.me/628123456789" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#25D366] hover:bg-[#20ba59] hover:-translate-y-0.5 active:bg-[#1ca34d] text-white px-5 py-3 rounded-full font-bold shadow-lg transition-all text-xs flex items-center gap-2 tracking-wide"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          Hubungi Hub/Layanan Pelanggan
        </a>
      </div>
    </div>
  );
}
