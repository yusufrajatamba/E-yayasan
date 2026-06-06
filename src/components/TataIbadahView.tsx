import React, { useState } from 'react';
import { Member, WorshipSchedule, BudgetItem, TransactionType } from '../types';
import { 
  BookOpen, 
  Calendar, 
  Plus, 
  Trash2, 
  Pencil,
  X,
  Clock, 
  User, 
  Check, 
  Eye,
  BookMarked,
  AlertTriangle,
  Printer,
  Send,
  MessageSquare,
  Share2,
  Bookmark,
  Users2,
  Wrench,
  UserCheck,
  Music,
  Wallet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TataIbadahViewProps {
  schedules: WorshipSchedule[];
  members: Member[];
  budgets?: BudgetItem[];
  onAddSchedule: (schedule: Omit<WorshipSchedule, 'id'>) => void;
  onEditSchedule: (schedule: WorshipSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onAddTransaction?: (transaction: Omit<TransactionType, 'id'>) => void;
}

export default function TataIbadahView({ 
  schedules, 
  members, 
  budgets = [],
  onAddSchedule, 
  onEditSchedule, 
  onDeleteSchedule,
  onAddTransaction
}: TataIbadahViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorshipSchedule | null>(null);

  // States for WhatsApp Reminders
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waRecipient, setWaRecipient] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [waMessageBody, setWaMessageBody] = useState('');
  const [selectedSchForWa, setSelectedSchForWa] = useState<WorshipSchedule | null>(null);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleOpenWaReminder = (sch: WorshipSchedule) => {
    setSelectedSchForWa(sch);
    setWaRecipient('');
    setCustomPhone('');

    const costStr = sch.biayaIbadah && sch.biayaIbadah > 0 ? formatRupiah(sch.biayaIbadah) : 'Bebas Anggaran';

    const msg = `*UNDANGAN JADWAL KEGIATAN & ROSTER - YAYASAN KRISTEN GLORIA* 📖\n\n` +
      `Shalom Bapak/Ibu/Saudara/i,\n` +
      `Berikut adalah jadwal agenda kegiatan & roster pelayanan terdekat:\n\n` +
      `📌 *Kegiatan:* ${sch.namaIbadah}\n` +
      `📆 *Tanggal:* ${sch.tanggalIbadah}\n` +
      `⏰ *Waktu:* ${sch.waktuIbadah} WIB\n\n` +
      `*SUSUNAN PELAYAN ROSTER:* \n` +
      `🎙️ Pembicara/Presenter: ${sch.pemberitaFirman}\n` +
      `📖 Liturgos / Moderator: ${sch.petugasLiturgi || '-'}\n` +
      `🎵 Pemimpin Pujian (Song Leader): ${sch.pemimpinPujian || '-'}\n` +
      `🛠️ Tim Peralatan (Equipment): ${sch.timPeralatan || '-'}\n` +
      `✉️ Tim Pengundangan (Usher/Invitations): ${sch.timPengundangan || '-'}\n` +
      `🎹 Tim Pemusik (Musicians): ${sch.timPemusik || '-'}\n\n` +
      `💰 Estimasi Anggaran: ${costStr}\n\n` +
      `Mohon seluruh pelayan roster mempersiapkan diri dan hadir 30 menit sebelum acara dimulai untuk doa bersama. \n` +
      `Tuhan Yesus memberkati pelayanan kita! 🕊️`;
    setWaMessageBody(msg);
    setIsWaModalOpen(true);
  };

  const sendWhatsAppReminder = () => {
    let targetPhone = customPhone.trim();
    if (waRecipient && waRecipient !== 'custom') {
      const selectedMember = members.find(m => m.id === waRecipient);
      if (selectedMember && selectedMember.phone) {
        targetPhone = selectedMember.phone;
      }
    }

    if (!targetPhone) {
      return alert('Silakan masukkan nomor WA atau pilih jemaat/kontak pelayanan!');
    }

    let cleanNumber = targetPhone.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(waMessageBody)}`;
    window.open(whatsappUrl, '_blank');
    setIsWaModalOpen(false);
  };

  // Form states
  const [namaIbadah, setNamaIbadah] = useState('');
  const [tanggalIbadah, setTanggalIbadah] = useState('2026-06-07');
  const [waktuIbadah, setWaktuIbadah] = useState('08:00');
  const [pemberitaFirman, setPemberitaFirman] = useState('');
  const [petugasLiturgi, setPetugasLiturgi] = useState('');
  const [pemimpinPujian, setPemimpinPujian] = useState('');
  
  // Roster additions
  const [timPeralatan, setTimPeralatan] = useState('');
  const [timPengundangan, setTimPengundangan] = useState('');
  const [timPemusik, setTimPemusik] = useState('');
  
  // Funding integration
  const [biayaIbadah, setBiayaIbadah] = useState<string>('');
  const [anggaranId, setAnggaranId] = useState<string>('');

  const [selectedSchedule, setSelectedSchedule] = useState<WorshipSchedule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenEditForm = (sch: WorshipSchedule) => {
    setEditingSchedule(sch);
    setNamaIbadah(sch.namaIbadah);
    setTanggalIbadah(sch.tanggalIbadah);
    setWaktuIbadah(sch.waktuIbadah);
    setPemberitaFirman(sch.pemberitaFirman);
    setPetugasLiturgi(sch.petugasLiturgi || '');
    setPemimpinPujian(sch.pemimpinPujian || '');
    setTimPeralatan(sch.timPeralatan || '');
    setTimPengundangan(sch.timPengundangan || '');
    setTimPemusik(sch.timPemusik || '');
    setBiayaIbadah(sch.biayaIbadah ? String(sch.biayaIbadah) : '');
    setAnggaranId(sch.anggaranId || '');
    setIsFormOpen(true);
  };

  const handleCancelSubmit = () => {
    setEditingSchedule(null);
    setNamaIbadah('');
    setPemberitaFirman('');
    setPetugasLiturgi('');
    setPemimpinPujian('');
    setTimPeralatan('');
    setTimPengundangan('');
    setTimPemusik('');
    setBiayaIbadah('');
    setAnggaranId('');
    setIsFormOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaIbadah.trim() || !pemberitaFirman.trim()) {
      return alert('Nama kegiatan dan Pemberita Firman/Presenter wajib diisi!');
    }

    const calculatedCost = biayaIbadah ? parseFloat(biayaIbadah.replace(/[^0-9.-]+/g, '')) : 0;

    if (editingSchedule) {
      onEditSchedule({
        ...editingSchedule,
        namaIbadah,
        tanggalIbadah,
        waktuIbadah,
        pemberitaFirman,
        petugasLiturgi,
        pemimpinPujian,
        timPeralatan,
        timPengundangan,
        timPemusik,
        biayaIbadah: calculatedCost,
        anggaranId
      });
      setEditingSchedule(null);
    } else {
      // Trigger new transaction automatically if cost is assigned to a budget!
      if (onAddTransaction && anggaranId && calculatedCost > 0) {
        onAddTransaction({
          category: 'Pengeluaran Kegiatan',
          amount: -calculatedCost,
          date: tanggalIbadah,
          keterangan: `Penyerapan otomatis agenda roster: ${namaIbadah}`,
          donor: 'Administrasi Kegiatan Roster',
          anggaranId
        });
      }

      onAddSchedule({
        namaIbadah,
        tanggalIbadah,
        waktuIbadah,
        pemberitaFirman,
        petugasLiturgi,
        pemimpinPujian,
        timPeralatan,
        timPengundangan,
        timPemusik,
        biayaIbadah: calculatedCost,
        anggaranId
      });
    }

    // Reset
    setNamaIbadah('');
    setPemberitaFirman('');
    setPetugasLiturgi('');
    setPemimpinPujian('');
    setTimPeralatan('');
    setTimPengundangan('');
    setTimPemusik('');
    setBiayaIbadah('');
    setAnggaranId('');
    setIsFormOpen(false);
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
    doc.text("LITURGI ROSTER & JADWAL AGENDA KEGIATAN YAYASAN", 14, 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Waktu Cetak: 2026-06-04 | Total Jadwal Aktif: ${schedules.length} Kegiatan Berjadwal`, 14, 33);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    const checkList = schedules.map((s, index) => [
      index + 1,
      s.namaIbadah,
      `${s.tanggalIbadah} @ ${s.waktuIbadah}`,
      s.pemberitaFirman || "-",
      s.timPeralatan || "-",
      s.timPengundangan || "-",
      s.timPemusik || "-",
      s.biayaIbadah ? formatRupiah(s.biayaIbadah) : "Rp0"
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["No", "Nama Kegiatan / Acara", "Waktu", "Pembicara/Presenter", "Tim Peralatan", "Tim Undangan", "Pemusik", "Biaya"]],
      body: checkList,
      theme: "grid",
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [18, 66, 127] }
    });

    doc.save("Jadwal-Tata-Kegiatan-Pelayanan-Yayasan.pdf");
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto print:p-0">
      {/* Printed Header Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-850 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight uppercase">JADWAL KEGIATAN &amp; ROSTER PELAYANAN YAYASAN</h1>
        <p className="text-xs font-semibold text-slate-700">Yayasan Kristen Gloria &bull; Logistik Roster Terintegrasi</p>
        <p className="text-[10px] text-slate-500 mt-1">Dicetak pada: 2026-06-04 &bull; Total Jadwal Aktif: {schedules.length} Agenda</p>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#3875d7]" />
            <span>Kegiatan &amp; Roster Rapat</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penjadwalan ibadah, ibadah kelompok kecil (Komsel), roster kepanitiaan yayasan Kristen, pengelolaan logistik tim peralatan, pengundangan, pemusik, serta sinkronisasi penarikan dana anggaran pelayanan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-cetak-ibadah"
            onClick={exportToPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Jadwal</span>
          </button>
          <button
            id="btn-tambah-ibadah"
            onClick={() => {
              if (isFormOpen && editingSchedule) {
                handleCancelSubmit();
              } else {
                setIsFormOpen(!isFormOpen);
              }
            }}
            className="bg-[#3875d7] hover:bg-[#1e5cb3] text-white py-2 px-4 rounded text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer border-none"
          >
            {isFormOpen && editingSchedule ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isFormOpen && editingSchedule ? 'Batal Ubah' : 'Jadwalkan Roster Baru'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* SCHEDULE LIST TABLE */}
        <div className="xl:col-span-2 print:col-span-3 w-full border border-slate-200 rounded overflow-hidden shadow-xs">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <BookMarked className="w-4 h-4 text-emerald-600" />
            <span>Rencana Kegiatan &amp; Agenda Pelayanan Terdaftar ({schedules.length} Roster)</span>
          </div>

          <div className="divide-y divide-slate-100 bg-white">
            {schedules.length > 0 ? (
              schedules.map((sch) => (
                <div key={sch.id} className={`p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${editingSchedule?.id === sch.id ? 'bg-amber-50/60' : ''}`}>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-indigo-50 border border-indigo-200 text-indigo-750 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                        {sch.tanggalIbadah}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                        <Clock className="w-3.5 h-3.5 text-[#3875d7]" /> {sch.waktuIbadah} WIB
                      </span>
                      {sch.biayaIbadah && sch.biayaIbadah > 0 ? (
                        <span className="bg-emerald-50 text-emerald-700 font-mono text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-250 flex items-center gap-0.5">
                          <Wallet className="w-3 h-3 text-emerald-500" />
                          <span>Dana: {formatRupiah(sch.biayaIbadah)}</span>
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-sm font-bold text-slate-850">{sch.namaIbadah}</h3>

                    {/* Rich Grid showing traditional and advanced Roster staffing details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 pt-1 font-medium text-slate-650 text-[11px]">
                      <div>
                        <span className="text-slate-450 mr-1">🎙️ Pembicara:</span> 
                        <span className="text-slate-800 font-bold">{sch.pemberitaFirman}</span>
                      </div>
                      <div>
                        <span className="text-slate-450 mr-1">📖 Liturgos / MC:</span> 
                        <span className="text-slate-800 font-bold">{sch.petugasLiturgi || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-450 mr-1">🎵 Pemimpin Pujian:</span> 
                        <span className="text-slate-800 font-bold">{sch.pemimpinPujian || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-450 mr-1">🛠️ Tim Peralatan:</span> 
                        <span className="text-indigo-700 font-semibold">{sch.timPeralatan || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-450 mr-1">✉️ Tim Pengundangan:</span> 
                        <span className="text-indigo-700 font-semibold">{sch.timPengundangan || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-450 mr-1">🎹 Tim Pemusik:</span> 
                        <span className="text-indigo-700 font-semibold">{sch.timPemusik || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0 print:hidden">
                    <button
                      onClick={() => setSelectedSchedule(sch)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-850 py-1.5 px-2.5 rounded text-xs font-bold flex items-center justify-center cursor-pointer transition-colors border border-slate-300"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-wa-sch-${sch.id}`}
                      onClick={() => handleOpenWaReminder(sch)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-750 font-bold py-1.5 px-2.5 rounded text-xs flex items-center justify-center cursor-pointer transition-colors border border-emerald-200"
                      title="Kirim Undangan / Pengingat WA"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                    <button
                      onClick={() => handleOpenEditForm(sch)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 py-1.5 px-2.5 rounded text-xs font-bold flex items-center justify-center cursor-pointer transition-colors border border-amber-250"
                      title="Ubah Roster"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmId(sch.id);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 py-1.5 px-2.5 rounded text-xs font-bold flex items-center justify-center cursor-pointer transition-colors border border-rose-200"
                      title="Hapus Jadwal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 italic font-medium">
                Belum ada jadwal Roster kegiatan pelayanan terdaftar.
              </div>
            )}
          </div>
        </div>

        {/* INPUT / VIEW COMPONENT */}
        <div className="space-y-4 print:hidden">
          {/* DISPLAY DETAILS CARD */}
          {selectedSchedule && (
            <div className="border border-indigo-200 bg-indigo-50/50 rounded p-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-indigo-150 pb-2 mb-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>Detail Pokok &amp; Roster Agenda</span>
                </h4>
                <button 
                  onClick={() => setSelectedSchedule(null)}
                  className="text-indigo-650 hover:text-indigo-850 text-[10px] font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <p className="font-bold text-indigo-950 text-[13px]">{selectedSchedule.namaIbadah}</p>
                
                <div className="grid grid-cols-2 gap-2 text-[10.5px] text-slate-600 font-bold">
                  <div className="p-1 px-1.5 bg-white border border-slate-200 rounded">
                    <div>📆 Tanggal</div>
                    <span className="text-slate-800 font-mono">{selectedSchedule.tanggalIbadah}</span>
                  </div>
                  <div className="p-1 px-1.5 bg-white border border-slate-200 rounded">
                    <div>⏰ Waktu Jam</div>
                    <span className="text-slate-800 font-mono">{selectedSchedule.waktuIbadah} WIB</span>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-700 font-semibold space-y-1.5">
                  <div className="flex justify-between">
                    <span>🎙️ Pembicara:</span> 
                    <span className="text-slate-900 font-extrabold">{selectedSchedule.pemberitaFirman}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📖 Liturgos / Moderator:</span> 
                    <span className="text-slate-900">{selectedSchedule.petugasLiturgi || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🎵 Song Leader:</span> 
                    <span className="text-slate-900">{selectedSchedule.pemimpinPujian || '-'}</span>
                  </div>
                  
                  <div className="border-t border-slate-250 my-1 pb-1" />
                  <div className="flex justify-between text-indigo-900">
                    <span className="flex items-center gap-0.5"><Wrench className="w-3 h-3" /> Tim Peralatan:</span>
                    <span className="font-extrabold">{selectedSchedule.timPeralatan || '-'}</span>
                  </div>
                  <div className="flex justify-between text-indigo-900">
                    <span className="flex items-center gap-0.5"><UserCheck className="w-3 h-3" /> Tim Pengundangan:</span>
                    <span className="font-extrabold">{selectedSchedule.timPengundangan || '-'}</span>
                  </div>
                  <div className="flex justify-between text-indigo-900">
                    <span className="flex items-center gap-0.5"><Music className="w-3 h-3" /> Tim Pemusik:</span>
                    <span className="font-extrabold">{selectedSchedule.timPemusik || '-'}</span>
                  </div>
                  
                  {selectedSchedule.biayaIbadah ? (
                    <>
                      <div className="border-t border-slate-250 my-1 pb-1" />
                      <div className="flex justify-between text-emerald-800 font-mono font-bold">
                        <span>💰 Anggaran Direalisasikan:</span>
                        <span>{formatRupiah(selectedSchedule.biayaIbadah)}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* ADD SCHEDULE FORM */}
          <div className="border border-slate-200 rounded bg-slate-50 p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2.5 mb-4">
              {editingSchedule ? 'Ubah Roster Jadwal' : 'Form Penjadwalan Pelayanan'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Nama Kegiatan / Kebaktian / Rapat *
                </label>
                <input
                  id="form-sch-name"
                  type="text"
                  required
                  placeholder="Contoh: Kebaktian Raya Minggu Pagi"
                  value={namaIbadah}
                  onChange={(e) => setNamaIbadah(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded px-2.5 py-1.5 text-xs text-slate-850 font-semibold focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    id="form-sch-date"
                    type="date"
                    required
                    value={tanggalIbadah}
                    onChange={(e) => setTanggalIbadah(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded px-2 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Waktu / Jam
                  </label>
                  <input
                    id="form-sch-time"
                    type="text"
                    required
                    placeholder="08:00 WIB"
                    value={waktuIbadah}
                    onChange={(e) => setWaktuIbadah(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded px-2 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Pembicara / Pengkhotbah / Presenter *
                </label>
                <input
                  id="form-sch-preacher"
                  type="text"
                  required
                  placeholder="Contoh: Pdt. Dr. J. R. Simanjuntak"
                  value={pemberitaFirman}
                  onChange={(e) => setPemberitaFirman(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded px-2.5 py-1.5 text-xs text-slate-850 font-semibold focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden"
                />
              </div>

              {/* TWO COLUMN ROSTER STAFFING */}
              <div className="bg-white border border-slate-200 p-3 rounded space-y-3">
                <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">ROSTER TIM PELAYAN (STAFFING)</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Model / Liturgos</label>
                    <input
                      type="text"
                      placeholder="Liturgos/Agenda"
                      value={petugasLiturgi}
                      onChange={(e) => setPetugasLiturgi(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Pemimpin Pujian</label>
                    <input
                      type="text"
                      placeholder="Song Leader"
                      value={pemimpinPujian}
                      onChange={(e) => setPemimpinPujian(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-650 mb-1">Tim Peralatan *</label>
                    <input
                      type="text"
                      placeholder="Seksi Sound, Listrik"
                      value={timPeralatan}
                      onChange={(e) => setTimPeralatan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-650 mb-1">Tim Pengundangan *</label>
                    <input
                      type="text"
                      placeholder="Seksi Humas & Penerima"
                      value={timPengundangan}
                      onChange={(e) => setTimPengundangan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-655 mb-1">Tim Pemusik / Choir *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gloria Band, Pianis Grace"
                    value={timPemusik}
                    onChange={(e) => setTimPemusik(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* INTEGRATED WORSHIP FUND ALLOCATION */}
              {budgets.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-md">
                  <span className="block text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Anggaran Kas &amp; Pembiayaan Komsel</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-600 mb-1">Anggaran Biaya (Rp)</label>
                      <input
                        type="text"
                        placeholder="Cth: 250000"
                        value={biayaIbadah}
                        onChange={(e) => setBiayaIbadah(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-850 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-600 mb-1">Sumber Pos RAB</label>
                      <select
                        value={anggaranId}
                        onChange={(e) => setAnggaranId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 font-bold"
                      >
                        <option value="">-- Tanpa Dana --</option>
                        {budgets.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[9px] text-indigo-650 mt-1.5 font-medium leading-normal">
                    * Menentukan Pembiayaan untuk agenda baru akan otomatis menulis transaksi belanja program (kas keluar) dan mendebet anggaran yang dipetakan pada database.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {editingSchedule && (
                  <button
                    type="button"
                    onClick={handleCancelSubmit}
                    className="flex-1 bg-slate-250 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded text-xs transition-colors cursor-pointer text-center"
                  >
                    Batal
                  </button>
                )}
                <button
                  id="form-submit-sch"
                  type="submit"
                  className="flex-1 bg-[#3a72cc] hover:bg-[#1a55b3] text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSchedule ? 'Simpan Perubahan' : 'Terbitkan Agenda'}</span>
                </button>
              </div>
            </form>
          </div>
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
                  Konfirmasi Hapus Roster
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus roster pelayanan kegiatan <strong>{schedules.find(s => s.id === deleteConfirmId)?.namaIbadah}</strong>? Tindakan ini tidak dapat dibatalkan.
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
                  onDeleteSchedule(deleteConfirmId);
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

      {/* WHATSAPP REMINDER FOR WORSHIP ROSTER SCHEDULE MODAL */}
      {isWaModalOpen && selectedSchForWa && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in flex-wrap">
          <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Kirim Undangan Pelayanan WA</span>
              </h3>
              <button 
                onClick={() => setIsWaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-650 uppercase mb-1">Hubungkan Seksie Roster Pelayan</label>
                <select
                  id="wa-roster-recipient"
                  value={waRecipient}
                  onChange={(e) => {
                    setWaRecipient(e.target.value);
                    if (e.target.value !== 'custom' && e.target.value !== '') {
                      const sel = members.find(m => m.id === e.target.value);
                      if (sel && sel.phone) {
                        setCustomPhone(sel.phone);
                      }
                    }
                  }}
                  className="w-full bg-white border border-slate-350 rounded px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- Ketik Nomor HP Penerima Secara Manual --</option>
                  <option value="custom">Entri Nomor HP Kustom</option>
                  {members.filter(m => m.phone).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} - {m.phone} ({m.sektor || 'Umum'})
                    </option>
                  ))}
                </select>
              </div>

              {(waRecipient === 'custom' || !waRecipient) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">No. WhatsApp Penerima *</label>
                  <input
                    id="wa-roster-custom-phone"
                    type="text"
                    placeholder="Contoh: 08123456789 atau 628123..."
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full border border-slate-350 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:ring-1 focus:ring-emerald-500 bg-white font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Preview Undangan Roster WA</label>
                <textarea
                  id="wa-roster-msg-preview"
                  rows={8}
                  value={waMessageBody}
                  onChange={(e) => setWaMessageBody(e.target.value)}
                  className="w-full border border-slate-350 rounded p-2.5 text-xs font-mono bg-slate-50 text-slate-800 resize-none font-medium leading-normal"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsWaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs cursor-pointer transition-colors border border-slate-300"
                >
                  Batal
                </button>
                <button
                  id="btn-send-roster-wa"
                  onClick={sendWhatsAppReminder}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
