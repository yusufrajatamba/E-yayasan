import React, { useState, useEffect } from 'react';
import { Bulletin, Member } from '../types';
import { 
  fetchBulletins, 
  addBulletin, 
  editBulletin, 
  deleteBulletin 
} from '../services/db';
import { 
  FileText, 
  Send, 
  Plus, 
  Trash2, 
  Pencil, 
  X, 
  Check, 
  Download, 
  MessageSquare,
  Sparkles,
  Calendar,
  Layers,
  BookOpen,
  Share2,
  Users,
  CheckSquare,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BuletinBulananViewProps {
  members: Member[];
}

export default function BuletinBulananView({ members }: BuletinBulananViewProps) {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null);

  // Form states
  const [bulan, setBulan] = useState('Juni 2026');
  const [judul, setJudul] = useState('');
  const [tanggalRilis, setTanggalRilis] = useState('2026-06-01');
  const [temaMingguan, setTemaMingguan] = useState('');
  const [ringkasanKhotba, setRingkasanKhotba] = useState('');
  const [wartaJemaat, setWartaJemaat] = useState('');

  // detail modal & WhatsApp modal status
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waRecipient, setWaRecipient] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [waMessageBody, setWaMessageBody] = useState('');

  // Tab menu
  const [activeTab, setActiveTab] = useState<'bulletin' | 'blast'>('bulletin');

  // WhatsApp Blast panel states
  const [blastSourceType, setBlastSourceType] = useState<'bulletin' | 'custom'>('bulletin');
  const [selectedBulletinForBlast, setSelectedBulletinForBlast] = useState<string>('');
  const [customBlastMessage, setCustomBlastMessage] = useState(
    `Shalom Anggota & Mitra Yayasan Kristen Gloria,\n\nBerikut kami sampaikan lembar warta pengumuman digital, program pelayanan sosial, beasiswa pendidikan, dan agenda yayasan terupdate pekan ini.\n\nWilayah/Sektor: {{sektor}}\nKategori Layanan: {{status}}\n\nTuhan Yesus memberkati!`
  );

  // Filter & selections for queue members
  const [filterSektor, setFilterSektor] = useState<string>('ALL');
  const [filterStatusKeluarga, setFilterStatusKeluarga] = useState<string>('ALL');
  const [searchNameQuery, setSearchNameQuery] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Sending queue list values
  const [blastQueue, setBlastQueue] = useState<{ id: string; name: string; phone: string; message: string; status: 'pending' | 'sending' | 'success' | 'failed'; timestamp?: string }[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [isSimulatingBlast, setIsSimulatingBlast] = useState(false);
  const [simulationSpeedText, setSimulationSpeedText] = useState<'1' | '1.5' | '2' | '3'>('1.5');

  // Dynamic automatic effect to handle simulated dispatch sequence
  useEffect(() => {
    let timer: NodeJS.Timeout | any = null;
    if (isSimulatingBlast) {
      const activeIdx = blastQueue.findIndex(q => q.status === 'pending');
      if (activeIdx !== -1) {
        // Mark activeIdx as currently sending
        setBlastQueue(prev => prev.map((item, idx) => idx === activeIdx ? { ...item, status: 'sending' } : item));
        
        const delay = parseFloat(simulationSpeedText) * 1000;
        timer = setTimeout(() => {
          setBlastQueue(prev => prev.map((item, idx) => idx === activeIdx ? { 
            ...item, 
            status: 'success',
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          } : item));
          setCurrentQueueIndex(activeIdx + 1);
        }, delay);
      } else {
        setIsSimulatingBlast(false);
        alert('Kemajuan WA Blast Selesai! Semua antrean siaran massal diselesaikan dengan sukses.');
      }
    }
    return () => clearTimeout(timer);
  }, [isSimulatingBlast, blastQueue, simulationSpeedText]);

  // Sync selected bulletin for blast when bulletins change
  useEffect(() => {
    if (bulletins.length > 0 && !selectedBulletinForBlast) {
      setSelectedBulletinForBlast(bulletins[0].id);
    }
  }, [bulletins, selectedBulletinForBlast]);

  // Parser helper
  const personalizeMessage = (tmpl: string, m: Member) => {
    let text = tmpl;
    text = text.replace(/{{nama}}/g, m.nama || '');
    text = text.replace(/{{sektor}}/g, m.sektor || 'Umum');
    text = text.replace(/{{status}}/g, m.statusKeluarga || 'Mitra');
    text = text.replace(/{{tanggal}}/g, new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    return text;
  };

  const getBulletinTemplate = (b: Bulletin) => {
    return `*BULETIN & WARTA INFORMASI - YAYASAN KRISTEN GLORIA* 📖\n` +
      `*Periode:* ${b.bulan}\n` +
      `*Judul:* ${b.judul}\n\n` +
      `Halo Bapak/Ibu/Saudara/i {{nama}},\n` +
      `Berikut rilis warta pengumuman periodik yayasan Kristen.\n` +
      `✨ *TEMA UTAMA:* "${b.temaMingguan || 'Bertumbuh Bersama'}"\n\n` +
      `*Uraian Renungan:* \n${b.ringkasanKhotba || 'Tidak ada ringkasan.'}\n\n` +
      `*Pengumuman & Agenda Kerja:* \n${b.wartaJemaat || 'Belum ada warta.'}\n\n` +
      `Tuhan Yesus menyertai dan memberkati langkah kita sekalian! 🙏🕊️`;
  };

  // Extract unique sectors & status categories
  const dynamicSectors = Array.from(new Set(members.map(m => m.sektor).filter(Boolean))) as string[];
  const dynamicStatusKeluargas = Array.from(new Set(members.map(m => m.statusKeluarga).filter(Boolean))) as string[];

  // Filter member logic
  const filteredBlastMembers = members.filter(m => {
    const matchesSektor = filterSektor === 'ALL' || m.sektor === filterSektor;
    const matchesStatus = filterStatusKeluarga === 'ALL' || m.statusKeluarga === filterStatusKeluarga;
    const matchesSearch = !searchNameQuery.trim() || m.nama.toLowerCase().includes(searchNameQuery.toLowerCase());
    const hasPhone = !!m.phone; // WA blast needs a phone number
    return matchesSektor && matchesStatus && matchesSearch && hasPhone;
  });

  // Selection toggles
  const handleToggleSelectAll = () => {
    const listIds = filteredBlastMembers.map(m => m.id);
    const allSelected = listIds.every(id => selectedMemberIds.includes(id));
    if (allSelected) {
      setSelectedMemberIds(prev => prev.filter(id => !listIds.includes(id)));
    } else {
      setSelectedMemberIds(prev => Array.from(new Set([...prev, ...listIds])));
    }
  };

  const handleToggleSingle = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedMemberIds(prev => [...prev, id]);
    }
  };

  // Build queue
  const handlePrepareBlastQueue = () => {
    if (selectedMemberIds.length === 0) {
      return alert('Pilih minimal 1 kontak anggota jemaat untuk memulai blast!');
    }

    let rawTemplate = '';
    if (blastSourceType === 'bulletin') {
      const bObj = bulletins.find(b => b.id === selectedBulletinForBlast);
      if (!bObj) {
        return alert('Silakan buat atau pilih draf buletin yang valid terlebih dahulu!');
      }
      rawTemplate = getBulletinTemplate(bObj);
    } else {
      rawTemplate = customBlastMessage;
    }

    const compiledQueue = members
      .filter(m => selectedMemberIds.includes(m.id))
      .map(m => ({
        id: m.id,
        name: m.nama,
        phone: m.phone || '',
        message: personalizeMessage(rawTemplate, m),
        status: 'pending' as const
      }));

    setBlastQueue(compiledQueue);
    setCurrentQueueIndex(0);
    setIsSimulatingBlast(false);
    alert(`Sukses memuat ${compiledQueue.length} kontak ke Antrean Siaran Massal!`);
  };

  const handleSendManualQueueItem = (idx: number) => {
    const item = blastQueue[idx];
    if (!item) return;

    let targetPhone = item.phone.trim();
    let cleanNumber = targetPhone.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(item.message)}`;
    window.open(whatsappUrl, '_blank');

    // Mark as success and step forward
    setBlastQueue(prev => prev.map((q, i) => i === idx ? { 
      ...q, 
      status: 'success', 
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } : q));
    setCurrentQueueIndex(idx + 1);
  };

  const handleSkipQueueItem = (idx: number) => {
    setBlastQueue(prev => prev.map((q, i) => i === idx ? { 
      ...q, 
      status: 'failed', 
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } : q));
    setCurrentQueueIndex(idx + 1);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchBulletins()
      .then((data) => {
        if (active) {
          setBulletins(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data buletin:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAddForm = () => {
    setEditingBulletin(null);
    setBulan('Juni 2026');
    setJudul('Buletin Warta Minggu Baru - Juni 2026');
    setTanggalRilis(new Date().toISOString().substring(0, 10));
    setTemaMingguan('');
    setRingkasanKhotba('');
    setWartaJemaat('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (b: Bulletin) => {
    setEditingBulletin(b);
    setBulan(b.bulan);
    setJudul(b.judul);
    setTanggalRilis(b.tanggalRilis);
    setTemaMingguan(b.temaMingguan || '');
    setRingkasanKhotba(b.ringkasanKhotba || '');
    setWartaJemaat(b.wartaJemaat || '');
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingBulletin(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulan.trim() || !judul.trim() || !tanggalRilis) {
      return alert('Bulan, judul, dan tanggal rilis wajib diisi!');
    }

    const payload: Omit<Bulletin, 'id'> = {
      bulan,
      judul,
      tanggalRilis,
      temaMingguan,
      ringkasanKhotba,
      wartaJemaat
    };

    try {
      setLoading(true);
      if (editingBulletin) {
        const updated: Bulletin = {
          ...editingBulletin,
          ...payload
        };
        await editBulletin(updated);
        setBulletins(prev => prev.map(b => b.id === updated.id ? updated : b));
        if (selectedBulletin?.id === updated.id) {
          setSelectedBulletin(updated);
        }
        alert('Berhasil mengubah buletin bulanan!');
      } else {
        const saved = await addBulletin(payload);
        setBulletins(prev => [saved, ...prev]);
        alert('Berhasil menambahkan buletin bulanan baru!');
      }
      setIsFormOpen(false);
    } catch (err) {
      alert('Gagal menyimpan buletin ke database.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus buletin/Warta Jemaat ini?')) {
      try {
        setLoading(true);
        await deleteBulletin(id);
        setBulletins(prev => prev.filter(b => b.id !== id));
        if (selectedBulletin?.id === id) {
          setSelectedBulletin(null);
        }
        alert('Buletin berhasil dihapus dari database.');
      } catch (err) {
        alert('Gagal menghapus buletin.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAISimplify = () => {
    // Elegant simulation of AI Generation for church bulletins
    if (!temaMingguan) {
      return alert('Silakan isi Tema Mingguan terlebih dahulu untuk membantu referensi AI!');
    }
    setJudul(`Warta Bulanan Gereja Gloria: Bertema "${temaMingguan}"`);
    setRingkasanKhotba(
      `Sesuai dengan tema pokok "${temaMingguan}", nats pembimbing mengingatkan jemaat untuk teguh berdiri di dalam iman, mengasihi sesama jemaat, dan aktif mensosialisasikan program diakonia kasih yang transparan.`
    );
    setWartaJemaat(
      `1. Pelayanan Katekisasi Khusus Sektor akan dibuka mulai minggu depan.\n2. Pembayaran Iuran Wajib Bulanan Sektor melalui Menu Bill System.\n3. Rapat Parhalado (Kepanitiaan Jemaat) dikoordinasikan oleh pengurus pusat.`
    );
  };

  const generatePDF = (bulletin: Bulletin) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(18, 66, 127); // Deep Blue Gloria color
    doc.text("GEREJA GLORIA JEMAAT CENTER", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("BULETIN BULANAN & WARTA JEMAAT RESMI", 14, 26);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Periode: ${bulletin.bulan} | Rilis: ${bulletin.tanggalRilis}`, 14, 32);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 35, 196, 35);
    
    // Bulletin Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(bulletin.judul, 14, 43);
    
    // Tema Mingguan
    doc.setFontSize(10);
    doc.setTextColor(18, 66, 127);
    doc.text(`TEMA BULANAN/MINGGUAN:`, 14, 51);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(10);
    doc.setTextColor(236, 168, 60); // Orange highlight
    doc.text(`"${bulletin.temaMingguan || 'Belum Ditentukan'}"`, 14, 57);
    
    doc.setDrawColor(241, 245, 249);
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 62, 182, 45, "F");
    
    // Ringkasan Khotbah
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Ringkasan Khotbah Pelayanan:", 18, 68);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const splitKhotba = doc.splitTextToSize(bulletin.ringkasanKhotba || 'Tidak ada uraian ringkasan khotbah.', 174);
    doc.text(splitKhotba, 18, 74);
    
    // Warta Jemaat
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(18, 66, 127);
    doc.text("WARTA & PENGUMUMAN JEMAAT AKTIF:", 14, 115);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const splitWarta = doc.splitTextToSize(bulletin.wartaJemaat || 'Belum ada pengumuman warta.', 180);
    doc.text(splitWarta, 14, 122);
    
    // Footer watermark
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.line(14, 270, 196, 270);
    doc.text("Dicetak otomatis via e-Yayasan Gloria Enterprise System. Saluran Komunikasi Terpadu.", 14, 275);
    
    doc.save(`Buletin-${bulletin.bulan.replace(' ', '-')}.pdf`);
  };

  const handleOpenWaModal = (bulletin: Bulletin) => {
    setSelectedBulletin(bulletin);
    
    // Formulate a beautiful messaging body
    const msg = `*BULETIN & WARTA INFORMASI - YAYASAN KRISTEN GLORIA* 📖\n` +
      `*Periode:* ${bulletin.bulan}\n` +
      `*Judul:* ${bulletin.judul}\n` +
      `*Tema:* "${bulletin.temaMingguan}"\n\n` +
      `*Uraian Renungan:* \n${bulletin.ringkasanKhotba}\n\n` +
      `*Pengumuman & Agenda Kerja:* \n${bulletin.wartaJemaat}\n\n` +
      `Tuhan Yesus memberkati seluruh mitra dan pengurus bersama! 🕊️`;
    
    setWaMessageBody(msg);
    setIsWaModalOpen(true);
  };

  const sendWhatsApp = () => {
    let targetPhone = customPhone.trim();
    if (waRecipient && waRecipient !== 'custom') {
      const selectedMember = members.find(m => m.id === waRecipient);
      if (selectedMember && selectedMember.phone) {
        targetPhone = selectedMember.phone;
      }
    }

    if (!targetPhone) {
      return alert('Silakan masukkan atau pilih nomor WhatsApp penerima!');
    }

    // Clean phone number (replace space, dash, or leading 0 with 62)
    let cleanNumber = targetPhone.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(waMessageBody)}`;
    window.open(whatsappUrl, '_blank');
    setIsWaModalOpen(false);
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#4abdd5]" />
            <span>Buletin Bulanan &amp; Siaran WhatsApp</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen publikasi warta jemaat berkala, siaran pengumuman digital, ekspor cetak PDF liturgi mingguan, dan integrasi pengirim WhatsApp instan.
          </p>
        </div>

        <button
          id="btn-tambah-buletin"
          onClick={handleOpenAddForm}
          className="bg-[#4abdd5] hover:bg-[#39a7be] text-white py-2 px-4 rounded text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Buletin / Warta Baru</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('bulletin')}
          className={`py-2 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'bulletin'
              ? 'border-[#4abdd5] text-[#4abdd5]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Arsip &amp; Redaksi Jemaat</span>
        </button>

        <button
          onClick={() => setActiveTab('blast')}
          className={`py-2 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'blast'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Siaran Massal (WA Blast)</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded ml-1 max-sm:hidden">PRO</span>
        </button>
      </div>

      {activeTab === 'bulletin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* BULLETIN DIRECTORIES */}
          <div id="bulletin-list-container" className="lg:col-span-1 border border-slate-200 rounded min-h-[400px] h-full overflow-hidden bg-slate-50">
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Daftar Arsip Buletin Terbit</span>
            </div>

            <div id="bulletin-items-list" className="divide-y divide-slate-150 overflow-y-auto max-h-[500px]">
              {loading && bulletins.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-5 h-5 border-2 border-t-transparent border-[#4abdd5] rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-xs font-semibold">Mengambil data buletin...</span>
                </div>
              ) : bulletins.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  Belum ada draf buletin bulanan yang disimpan.
                </div>
              ) : (
                bulletins.map((b) => (
                  <div 
                    key={b.id} 
                    id={`bulletin-card-${b.id}`}
                    onClick={() => setSelectedBulletin(b)}
                    className={`p-3.5 cursor-pointer hover:bg-slate-100 transition-all text-left flex flex-col justify-between ${selectedBulletin?.id === b.id ? 'bg-white border-l-4 border-l-[#4abdd5] shadow-xs' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="bg-slate-200 font-mono text-[9px] font-bold text-slate-700 px-1.5 py-0.5 rounded leading-none shrink-0">
                        {b.bulan}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {b.tanggalRilis}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-850 mt-1 lines-clamp-2 leading-snug">
                      {b.judul}
                    </h4>
                    {b.temaMingguan && (
                      <p className="text-[10px] italic text-amber-600 font-medium truncate mt-0.5">
                        "{b.temaMingguan}"
                      </p>
                    )}
                    
                    <div className="flex justify-end gap-1 mt-3">
                      <button
                        id={`btn-edit-b-${b.id}`}
                        onClick={(e) => { e.stopPropagation(); handleOpenEditForm(b); }}
                        className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-850 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        id={`btn-del-b-${b.id}`}
                        onClick={(e) => handleDelete(b.id, e)}
                        className="p-1 hover:bg-slate-200 text-rose-500 hover:text-rose-700 rounded transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DETAILS & ACTIONS & EDITOR */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* ACTION BUTTON PANEL FOR SELECTED BULLETIN */}
            {selectedBulletin ? (
              <div id="bulletin-active-detail-card" className="border border-slate-200 rounded p-5 bg-white shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-extrabold px-2.5 py-0.5 rounded-full font-mono uppercase">
                        {selectedBulletin.bulan}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Tanggal Publikasi: {selectedBulletin.tanggalRilis}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-850 mt-1 tracking-tight">{selectedBulletin.judul}</h2>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id="btn-cetak-buletin-pdf"
                      onClick={() => generatePDF(selectedBulletin)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded text-xs border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Cetak PDF</span>
                    </button>

                    <button
                      id="btn-broadcast-buletin-wa"
                      onClick={() => handleOpenWaModal(selectedBulletin)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Siarkan ke WA</span>
                    </button>
                  </div>
                </div>

                {/* DETAILS BODY */}
                <div className="space-y-4 text-xs text-slate-750">
                  {selectedBulletin.temaMingguan && (
                    <div className="bg-amber-50/60 border border-amber-200 rounded p-3">
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">Tema Utama Pekan Ini:</div>
                      <p className="text-sm font-semibold text-slate-800 font-serif italic">"{selectedBulletin.temaMingguan}"</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-[#14427f] border-b border-slate-100 pb-1 mb-1.5 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Ringkasan Khotbah Kebaktian:
                    </h3>
                    <p className="whitespace-pre-line text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                      {selectedBulletin.ringkasanKhotba || 'Tidak ada detail uraian khotbah.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#14427f] border-b border-slate-100 pb-1 mb-1.5 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Berita / Warta Jemaat Selengkapnya:
                    </h3>
                    <p className="whitespace-pre-line text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                      {selectedBulletin.wartaJemaat || 'Belum ada draf pengumuman warta.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg py-16 px-4 text-center bg-slate-50/50">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-600 text-sm">Belum Ada Buletin Dipilih</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Silakan pilih salah satu buletin di daftar arsip sebelah kiri untuk melihat konten lengkap, men-download PDF, atau menyiarkannya via WhatsApp.
                </p>
              </div>
            )}

            {/* EDITOR FORM */}
            {isFormOpen && (
              <div id="bulletin-editor-form" className="border border-slate-200 rounded p-4 bg-slate-50 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#4abdd5]" />
                    <span>{editingBulletin ? 'Ubah Rencana Buletin' : 'Tulis Draf Buletin Baru'}</span>
                  </h3>
                  <button 
                    onClick={handleCancelForm}
                    className="text-slate-450 hover:text-slate-700 p-1 rounded hover:bg-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Bulan Publikasi
                      </label>
                      <input
                        id="form-b-bulan"
                        type="text"
                        required
                        placeholder="Contoh: Juni 2026"
                        value={bulan}
                        onChange={(e) => setBulan(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-850 font-semibold focus:ring-1 focus:ring-[#4abdd5] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Tanggal Rilis *
                      </label>
                      <input
                        id="form-b-tanggal"
                        type="date"
                        required
                        value={tanggalRilis}
                        onChange={(e) => setTanggalRilis(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#4abdd5] focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Judul Buletin *
                    </label>
                    <input
                      id="form-b-judul"
                      type="text"
                      required
                      placeholder="Contoh: Buletin Gloria Jemaat Center - Edisi Pekan Pertama"
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-850 font-semibold focus:ring-1 focus:ring-[#4abdd5] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                        Tema Mingguan
                      </label>
                      <button
                        type="button"
                        onClick={handleAISimplify}
                        className="text-[10px] text-[#4abdd5] hover:text-[#198ca6] font-bold flex items-center gap-1 cursor-pointer"
                        title="Lengkapi otomatis dengan AI!"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Sihir Penulisan AI</span>
                      </button>
                    </div>
                    <input
                      id="form-b-tema"
                      type="text"
                      placeholder="Contoh: Berdiri Teguh dalam Firman Tuhan"
                      value={temaMingguan}
                      onChange={(e) => setTemaMingguan(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#4abdd5] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Uraian Ringkas Khotbah Belanja Iman
                    </label>
                    <textarea
                      id="form-b-khotba"
                      placeholder="Tulis garis besar materi khotbah kebaktian di sini..."
                      rows={3}
                      value={ringkasanKhotba}
                      onChange={(e) => setRingkasanKhotba(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#4abdd5] focus:outline-hidden leading-relaxed font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Warta Jemaat, Mutasi, Rapat Jemaat
                    </label>
                    <textarea
                      id="form-b-warta"
                      placeholder="1. Pembangunan gedung sekretariat baru...\n2. Selamat ulang tahun untuk jemaat..."
                      rows={4}
                      value={wartaJemaat}
                      onChange={(e) => setWartaJemaat(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#4abdd5] focus:outline-hidden leading-relaxed font-sans"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="px-4 py-2 bg-slate-250 hover:bg-slate-300 text-slate-700 font-bold rounded text-xs transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      id="form-b-submit"
                      type="submit"
                      className="px-4 py-2 bg-[#4abdd5] hover:bg-[#34aac2] text-white font-bold rounded text-xs flex items-center justify-center gap-1 bg-sky-500 shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{editingBulletin ? 'Simpan Perubahan' : 'Terbitkan Buletin'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {activeTab === 'blast' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Header Description card */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Modul Siaran Massal &amp; Personalisasi Anggota</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Siarkan bahan liturgi, ringkasan khotbah kepelayanan, ataupun pesan kustom lainnya ke ratusan anggota jemaat sekaligus. Sistem menyisipkan sapaan personal seperti <strong>nama</strong>, <strong>sektor</strong>, dan <strong>kondisi keluarga</strong> secara dinamis untuk mengoptimalkan pelayanan jemaat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* COLUMN 1: TARGET FILTER & CONTACT LIST */}
            <div className="lg:col-span-1 space-y-4">
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                {/* Section Filter */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span>Saring Penerima Siaran</span>
                </div>

                <div className="p-4 space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Berdasarkan Sektor</label>
                    <select
                      value={filterSektor}
                      onChange={(e) => setFilterSektor(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-[1px] focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="ALL">Semua Sektor ({dynamicSectors.length})</option>
                      {dynamicSectors.map(sek => (
                        <option key={sek} value={sek}>{sek}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Status Hubungan Keluarga</label>
                    <select
                      value={filterStatusKeluarga}
                      onChange={(e) => setFilterStatusKeluarga(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-[1px] focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="ALL">Semua Peran ({dynamicStatusKeluargas.length})</option>
                      {dynamicStatusKeluargas.map(fam => (
                        <option key={fam} value={fam}>{fam}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Cari Nama Anggota</label>
                    <input
                      type="text"
                      placeholder="Cari nama..."
                      value={searchNameQuery}
                      onChange={(e) => setSearchNameQuery(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Selection List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Daftar Kontak Terpilih ({filteredBlastMembers.length})</span>
                  </span>
                  
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-extrabold cursor-pointer transition-colors"
                  >
                    {filteredBlastMembers.every(m => selectedMemberIds.includes(m.id)) ? 'Lepas Semua' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[350px] divide-y divide-slate-100">
                  {filteredBlastMembers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                      Tidak ada jemaat yang cocok atau memiliki nomor HP.
                    </div>
                  ) : (
                    filteredBlastMembers.map(m => {
                      const isSel = selectedMemberIds.includes(m.id);
                      return (
                        <div 
                          key={m.id}
                          onClick={() => handleToggleSingle(m.id)}
                          className={`p-3 flex items-center gap-3 cursor-pointer select-none transition-colors hover:bg-slate-50 ${isSel ? 'bg-emerald-50/30' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => {}} // toggled on card click
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{m.nama}</p>
                            <p className="text-[10px] text-slate-500 truncate">{m.phone} • <span className="italic text-slate-400">{m.sektor}, {m.statusKeluarga}</span></p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 flex justify-between items-center">
                  <span>Kontak Siap Kirim:</span>
                  <span className="bg-emerald-600 text-white font-mono text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedMemberIds.filter(id => members.some(m => m.id === id)).length} Terpilih
                  </span>
                </div>
              </div>
            </div>

            {/* COLUMN 2 & 3: ASSEMBLY & ENGINE CONTROLLER */}
            <div className="lg:col-span-2 space-y-4">
              {/* Content assembler */}
              <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-850 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Pengaturan Template Konten Wa Blast</span>
                </h3>

                <div className="flex gap-4 border-b border-slate-100 pb-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="blastSource"
                      checked={blastSourceType === 'bulletin'}
                      onChange={() => setBlastSourceType('bulletin')}
                      className="border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Gunakan Bahan Buletin Terbit</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="blastSource"
                      checked={blastSourceType === 'custom'}
                      onChange={() => setBlastSourceType('custom')}
                      className="border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Pesan Khusus Baru / Bebas</span>
                  </label>
                </div>

                {blastSourceType === 'bulletin' ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-600">Pilih Buletin &amp; Warta Sumber Pelayanan</label>
                    <select
                      value={selectedBulletinForBlast}
                      onChange={(e) => setSelectedBulletinForBlast(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-medium focus:ring-[1px] focus:ring-emerald-500 cursor-pointer"
                    >
                      {bulletins.length === 0 ? (
                        <option value="">-- Tidak ada buletin --</option>
                      ) : (
                        bulletins.map(b => (
                          <option key={b.id} value={b.id}>{b.bulan} - {b.judul} ("{b.temaMingguan}")</option>
                        ))
                      )}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block leading-snug">Sistem otomatis menyusun nats khutbah, tema sentral minggu ini, beserta info pengumuman aktif berkat ke kotak pesan whatsapp.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-600">Isi Pesan Kustom Anda</label>
                      <span className="text-[10px] text-slate-400 font-mono">Kode pendukung: {"{{nama}}"}, {"{{sektor}}"}, {"{{status}}"}, {"{{tanggal}}"}</span>
                    </div>
                    <textarea
                      rows={5}
                      value={customBlastMessage}
                      onChange={(e) => setCustomBlastMessage(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2.5 text-xs font-sans bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {/* Simulated WhatsApp preview bubble */}
                <div className="mt-4 bg-slate-100 rounded-lg p-4 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pratinjau Percakapan (Personalisasi Cepat {"{{nama}}"})</span>
                  </div>
                  
                  {/* Whatsapp Layout Bubble */}
                  <div className="bg-[#efeae2] p-4 rounded-md border border-slate-300 relative max-w-lg shadow-inner">
                    <div className="bg-[#d9fdd3] text-slate-800 p-2.5 rounded-lg text-xs leading-relaxed max-w-sm ml-auto relative shadow-xs whitespace-pre-line text-left">
                      {/* Dynamic replace simulation */}
                      {(() => {
                        const sampleMember = filteredBlastMembers[0] || members[0] || { id: '', nama: 'Yusuf Raja Tamba', phone: '', sektor: 'Sektor I', statusKeluarga: 'Kepala Keluarga', tglUlangTahun: '' };
                        let finalTxt = '';
                        if (blastSourceType === 'bulletin') {
                          const activeBObj = bulletins.find(b => b.id === selectedBulletinForBlast);
                          finalTxt = activeBObj ? getBulletinTemplate(activeBObj) : 'Belum isi data buletin.';
                        } else {
                          finalTxt = customBlastMessage;
                        }
                        return personalizeMessage(finalTxt, sampleMember as any);
                      })()}
                      <div className="text-[9px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1 font-mono">
                        <span>12:20 AM</span>
                        <span className="text-sky-500 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handlePrepareBlastQueue}
                    className="bg-[#4abdd5] hover:bg-[#34aac2] text-white font-bold py-2.5 px-5 rounded text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    <span>Muat &amp; Siapkan Antrean Siaran Massal</span>
                  </button>
                </div>
              </div>

              {/* ACTION BLANK DESK QUEUE MANAGER */}
              {blastQueue.length > 0 && (
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-md">
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Manajer Dispatch Antrean WA Blast ({blastQueue.length} kontak dimuat)</span>
                    </h3>
                    
                    <button
                      onClick={() => { setBlastQueue([]); setCurrentQueueIndex(0); setIsSimulatingBlast(false); }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-extrabold cursor-pointer"
                    >
                      Bersihkan Antrean
                    </button>
                  </div>

                  {/* ACTIVE ITEM ASSISTANT */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/70 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Manual dispatch frame */}
                    <div className="border border-slate-200 bg-white rounded-lg p-4 shadow-xs space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold tracking-wider font-mono bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
                            PROGRES: {currentQueueIndex + 1} / {blastQueue.length}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">PRESISI &amp; AMAN</span>
                        </div>

                        {currentQueueIndex < blastQueue.length ? (
                          <div className="mt-3 space-y-2">
                            <h4 className="text-xs font-bold text-slate-800">Penerima Aktif:</h4>
                            <p className="text-sm font-extrabold text-[#11325c]">{blastQueue[currentQueueIndex]?.name}</p>
                            <p className="text-xs font-semibold font-mono text-slate-500">{blastQueue[currentQueueIndex]?.phone}</p>
                            <div className="border border-slate-100 p-2.5 max-h-[85px] overflow-y-auto text-[10px] text-slate-600 bg-slate-50 whitespace-pre-line leading-relaxed italic border-l-2 border-l-emerald-500">
                              "{blastQueue[currentQueueIndex]?.message}"
                            </div>
                          </div>
                        ) : (
                          <div className="mt-8 text-center text-slate-400 flex flex-col items-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500 mb-1" />
                            <p className="text-xs font-bold text-emerald-600">Siaran Massal Selesai!</p>
                            <p className="text-[10px] text-slate-400">Seluruh antrean telah berhasil dialihkan.</p>
                          </div>
                        )}
                      </div>

                      {currentQueueIndex < blastQueue.length && (
                        <div className="flex gap-2 pt-3">
                          <button
                            onClick={() => handleSkipQueueItem(currentQueueIndex)}
                            className="flex-1 py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-xs cursor-pointer transition-all"
                          >
                            Lompati
                          </button>
                          
                          <button
                            onClick={() => handleSendManualQueueItem(currentQueueIndex)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded text-xs flex items-center justify-center gap-1.5 flex-2 animate-pulse cursor-pointer shadow-sm shadow-emerald-400 transition-all focus:outline-hidden"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim &amp; Lanjut</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Automatic Simulation Console */}
                    <div className="border border-slate-200 bg-white rounded-lg p-4 shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-700">Simulasi Siaran Otomatis</h4>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      </div>
                      
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Jika Anda ingin mendemonstrasikan sistem pengiriman massal dengan visualisasi cepat tanpa harus membuka ratusan tab secara fisik:
                      </p>

                      <div className="space-y-4 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Kecepatan Sesi</label>
                          <select
                            value={simulationSpeedText}
                            onChange={(e) => setSimulationSpeedText(e.target.value as any)}
                            disabled={isSimulatingBlast}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="1">Sangat Cepat (1.0 Detik)</option>
                            <option value="1.5">Standar Cepat (1.5 Detik)</option>
                            <option value="2">Tenang (2.0 Detik)</option>
                            <option value="3">Sabar Aman (3.0 Detik)</option>
                          </select>
                        </div>

                        <div className="flex gap-2">
                          {isSimulatingBlast ? (
                            <button
                              onClick={() => setIsSimulatingBlast(false)}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause Berhenti</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (currentQueueIndex >= blastQueue.length) {
                                  setBlastQueue(prev => prev.map(q => ({ ...q, status: 'pending' })));
                                  setCurrentQueueIndex(0);
                                }
                                setIsSimulatingBlast(true);
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Mulai Simulasi</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUEUE REPORTS LOG */}
                  <div className="max-h-[250px] overflow-y-auto divide-y divide-slate-100">
                    <table className="w-full text-xs text-left text-slate-700">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2">Nama</th>
                          <th className="px-4 py-2 font-mono">No. HP</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2 text-right">Waktu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {blastQueue.map((item, idx) => {
                          const isCur = idx === currentQueueIndex;
                          return (
                            <tr key={`${item.id}-${idx}`} className={`hover:bg-slate-50 transition-colors ${isCur ? 'bg-indigo-50/50 font-semibold' : ''}`}>
                              <td className="px-4 py-2 text-slate-850">{item.name}</td>
                              <td className="px-4 py-2 font-mono text-slate-600">{item.phone}</td>
                              <td className="px-4 py-2">
                                {item.status === 'pending' && (
                                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase bg-slate-100 py-0.5 px-2 rounded">Antrean</span>
                                )}
                                {item.status === 'sending' && (
                                  <span className="text-[10px] font-bold text-amber-600 font-mono uppercase bg-amber-50 py-0.5 px-2 rounded flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                                    <span>Mengirim...</span>
                                  </span>
                                )}
                                {item.status === 'success' && (
                                  <span className="text-[10px] font-bold text-emerald-700 font-mono uppercase bg-emerald-50 py-0.5 px-2 rounded">✓ Sukses</span>
                                )}
                                {item.status === 'failed' && (
                                  <span className="text-[10px] font-bold text-rose-600 font-mono bg-rose-50 py-0.5 px-2 rounded">Dilompati</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-[10px] text-slate-400 font-mono">{item.timestamp || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP BROADCAST MODAL */}
      {isWaModalOpen && selectedBulletin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-lg w-full shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Konsol Pengirim Buletin WhatsApp</span>
              </h3>
              <button 
                onClick={() => setIsWaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pilih Kontak Anggota Jemaat</label>
                <select
                  id="wa-select-recipient"
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
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-[1px] focus:ring-emerald-500"
                >
                  <option value="">-- Hubungkan Nomor Telepon (Ketik Manual) --</option>
                  <option value="custom">Entri Nomor Kustom Baru</option>
                  {members.filter(m => m.phone).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} - {m.phone} ({m.sektor})
                    </option>
                  ))}
                </select>
              </div>

              {(waRecipient === 'custom' || !waRecipient) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Masukkan Nomor Telepon/WhatsApp Handphone</label>
                  <input
                    id="wa-custom-phone-input"
                    type="text"
                    placeholder="Contoh: 08123456789 atau 6281234..."
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Format standar Indonesia diawali 08 atau kode internasional 62.</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pratinjau Draft Pesan WA</label>
                <textarea
                  id="wa-msg-body-preview"
                  rows={8}
                  value={waMessageBody}
                  onChange={(e) => setWaMessageBody(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2.5 text-xs font-mono bg-slate-50 text-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setIsWaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  id="btn-process-send-wa"
                  onClick={sendWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
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
