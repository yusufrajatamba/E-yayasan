import React, { useState } from 'react';
import { Member } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  UserPlus, 
  Check, 
  Grid,
  MapPin,
  Calendar,
  AlertTriangle,
  Printer,
  Shield,
  UserCheck,
  UserX,
  UserMinus,
  MessageSquare
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface KeanggotaanViewProps {
  members: Member[];
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  initialFormOpen?: boolean;
}

export default function KeanggotaanView({ 
  members, 
  onAddMember, 
  onEditMember, 
  onDeleteMember,
  initialFormOpen = false
}: KeanggotaanViewProps) {
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'anggota' | 'komsel'>('anggota');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSektor, setSelectedSektor] = useState('Semua');
  const [selectedKomselFilter, setSelectedKomselFilter] = useState('Semua');
  
  // Modals & Interactive States
  const [isFormOpen, setIsFormOpen] = useState(initialFormOpen);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Komsel Group creation form state
  const [newKomselName, setNewKomselName] = useState('');
  const [newKomselLeaderId, setNewKomselLeaderId] = useState('');
  const [selectedKomselToManage, setSelectedKomselToManage] = useState<string | null>(null);

  // Form Fields for Member
  const [nama, setNama] = useState('');
  const [tglUlangTahun, setTglUlangTahun] = useState('1990-06-01');
  const [tglPernikahan, setTglPernikahan] = useState('');
  const [phone, setPhone] = useState('');
  const [alamat, setAlamat] = useState('');
  const [sektor, setSektor] = useState('Sektor I');
  const [statusKeluarga, setStatusKeluarga] = useState('Kepala Keluarga');
  const [komsel, setKomsel] = useState('');
  const [peranKomsel, setPeranKomsel] = useState('Bukan Anggota');

  const handleOpenAddForm = () => {
    setEditingMember(null);
    setNama('');
    setTglUlangTahun('1990-06-01');
    setTglPernikahan('');
    setPhone('');
    setAlamat('');
    setSektor('Sektor I');
    setStatusKeluarga('Kepala Keluarga');
    setKomsel('');
    setPeranKomsel('Bukan Anggota');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (member: Member) => {
    setEditingMember(member);
    setNama(member.nama);
    setTglUlangTahun(member.tglUlangTahun);
    setTglPernikahan(member.tglPernikahan || '');
    setPhone(member.phone || '');
    setAlamat(member.alamat || '');
    setSektor(member.sektor || 'Sektor I');
    setStatusKeluarga(member.statusKeluarga || 'Kepala Keluarga');
    setKomsel(member.komsel || '');
    setPeranKomsel(member.peranKomsel || 'Bukan Anggota');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return alert('Nama Anggota wajib diisi!');

    const formData = {
      nama,
      tglUlangTahun,
      tglPernikahan: tglPernikahan || undefined,
      phone: phone || undefined,
      alamat: alamat || undefined,
      sektor,
      statusKeluarga,
      komsel: komsel || undefined,
      peranKomsel: komsel ? peranKomsel : 'Bukan Anggota'
    };

    if (editingMember) {
      onEditMember({ ...formData, id: editingMember.id });
    } else {
      onAddMember(formData);
    }

    setIsFormOpen(false);
    // Reset Form
    setNama('');
    setEditingMember(null);
  };

  // Compile unique Komsel lists from database
  const uniqueKomselList = Array.from(
    new Set(members.map(m => m.komsel).filter((v): v is string => !!v))
  );

  // Filter & Search Logic for Member table
  const filteredMembers = members.filter(member => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = 
      member.nama.toLowerCase().includes(searchLow) || 
      (member.alamat && member.alamat.toLowerCase().includes(searchLow)) ||
      (member.phone && member.phone.includes(searchTerm)) ||
      (member.sektor && member.sektor.toLowerCase().includes(searchLow)) ||
      (member.komsel && member.komsel.toLowerCase().includes(searchLow)) ||
      (member.statusKeluarga && member.statusKeluarga.toLowerCase().includes(searchLow));
    
    const matchesSektor = selectedSektor === 'Semua' || member.sektor === selectedSektor;
    const matchesKomsel = selectedKomselFilter === 'Semua' || 
                         (selectedKomselFilter === 'Tanpa Komsel' && !member.komsel) ||
                         member.komsel === selectedKomselFilter;

    return matchesSearch && matchesSektor && matchesKomsel;
  });

  // Create a brand new Komsel by designating a leader and setting up its namespace
  const handleCreateKomsel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKomselName.trim()) return alert('Nama Kelompok Kecil (Komsel) wajib diisi!');
    if (!newKomselLeaderId) return alert('Silakan pilih Pemimpin terlebih dahulu!');

    const leaderMember = members.find(m => m.id === newKomselLeaderId);
    if (leaderMember) {
      // Set the leader member of this new Komsel
      const updatedLeader: Member = {
        ...leaderMember,
        komsel: newKomselName.trim(),
        peranKomsel: 'Pemimpin'
      };
      onEditMember(updatedLeader);
      alert(`Kelompok Kecil "${newKomselName}" berhasil dibentuk dengan Pemimpin: ${leaderMember.nama}`);
      setNewKomselName('');
      setNewKomselLeaderId('');
    }
  };

  // Assign a quick member to a specific Komsel
  const handleAssignToKomsel = (memberId: string, komselName: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      onEditMember({
        ...member,
        komsel: komselName,
        peranKomsel: 'Anggota'
      });
    }
  };

  // Expel member from Komsel
  const handleRemoveFromKomsel = (member: Member) => {
    onEditMember({
      ...member,
      komsel: undefined,
      peranKomsel: 'Bukan Anggota'
    });
  };

  // Appoint leader directly and demote the old leader
  const handleSetLeaderDirectly = (komselName: string, leaderId: string) => {
    // Find current leader of this Komsel (if any) and demote to 'Anggota'
    const currentLeader = members.find(m => m.komsel === komselName && m.peranKomsel === 'Pemimpin');
    if (currentLeader && currentLeader.id !== leaderId) {
      onEditMember({
        ...currentLeader,
        peranKomsel: 'Anggota'
      });
    }

    // Assign new leader
    const newLeader = members.find(m => m.id === leaderId);
    if (newLeader) {
      onEditMember({
        ...newLeader,
        komsel: komselName,
        peranKomsel: 'Pemimpin'
      });
    }
  };

  // Dissolve an entire Komsel group
  const handleDissolveKomsel = (komselName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin membubarkan Komsel "${komselName}"? Semua anggota akan dikeluarkan.`)) {
      const gMembers = members.filter(m => m.komsel === komselName);
      gMembers.forEach(gm => {
        onEditMember({
          ...gm,
          komsel: undefined,
          peranKomsel: 'Bukan Anggota'
        });
      });
      setSelectedKomselToManage(null);
    }
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
    doc.text("LAPORAN DATA KEPENDUDUKAN & KEANGGOTAAN ANGGOTA YAYASAN", 14, 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Waktu Cetak: 2026-06-04 | Sektor Filter: ${selectedSektor} | Kelompok Kecil Filter: ${selectedKomselFilter} | Hasil: ${filteredMembers.length} Anggota`, 14, 33);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    // List Table
    const tableRows = filteredMembers.map((m, index) => [
      index + 1,
      m.nama,
      m.sektor || "-",
      m.tglUlangTahun || "-",
      m.komsel ? `${m.komsel} (${m.peranKomsel || 'Anggota'})` : "Belum Tergabung",
      m.phone || "-",
      m.statusKeluarga || "-",
      m.alamat || "-"
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["No", "Nama Lengkap", "Sektor / Cabang", "Ulang Tahun", "Komsel", "Kontak", "Hub. Keluarga", "Alamat Tinggal"]],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [18, 66, 127] },
      columnStyles: {
        7: { cellWidth: 40 } // Address gets more space
      }
    });

    doc.save(`Data-Anggota-Yayasan-${selectedSektor.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto print:p-0">
      {/* Printed Header Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-850 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight uppercase">DAFTAR KEPENDUDUKAN &amp; DATA ANGGOTA YAYASAN</h1>
        <p className="text-xs font-semibold text-slate-700">Yayasan Kristen Gloria &bull; Layanan: Enterprise System</p>
        <p className="text-[10px] text-slate-500 mt-1">Dicetak pada tanggal: 2026-06-04 &bull; Total Keanggotaan: {members.length} Anggota Terdaftar</p>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#3875d7]" />
            <span>Manajemen Anggota &amp; Komsel</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sistem kependudukan Yayasan Kristen. Mengelola profil anggota, kelompok kecil (Komsel / Cell Group), pemimpin, dan statistik wilayah pelayanan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-cetak-anggota"
            onClick={exportToPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Ekspor PDF</span>
          </button>
          <button
            id="btn-tambah-jemaat"
            onClick={handleOpenAddForm}
            className="bg-[#3875d7] hover:bg-[#1a5cb8] text-white py-2 px-4 rounded text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:hidden">
        <div className="bg-slate-50 border border-slate-200 rounded p-4">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Anggota</div>
          <div className="text-2xl font-bold text-[#12427f] mt-1">{members.length} Jiwa</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded p-4">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kelompok Kecil (Komsel)</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {uniqueKomselList.length} Kelompok
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded p-4">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tergabung Komsel</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {members.filter(m => m.komsel).length} Anggota ({Math.round((members.filter(m => m.komsel).length / (members.length || 1)) * 100)}%)
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded p-4">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Belum Komsel</div>
          <div className="text-2xl font-bold text-rose-500 mt-1">
            {members.filter(m => !m.komsel).length} Anggota
          </div>
        </div>
      </div>

      {/* Main Tab Options */}
      <div className="flex border-b border-slate-200 mb-6 print:hidden">
        <button
          onClick={() => setActiveTab('anggota')}
          className={`py-2 px-4 text-xs font-bold border-b-2 tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'anggota' 
              ? 'border-[#3875d7] text-[#3875d7]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Direktori Anggota ({filteredMembers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('komsel')}
          className={`py-2 px-4 text-xs font-bold border-b-2 tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'komsel' 
              ? 'border-[#3875d7] text-[#3875d7]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Kelompok Kecil / Komsel ({uniqueKomselList.length})</span>
        </button>
      </div>

      {activeTab === 'anggota' ? (
        <>
          {/* Interactive Filter panel */}
          <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
            <div className="relative w-full md:w-96">
              <input
                id="member-search"
                type="text"
                placeholder="Cari (Nama, Sektor, Komsel, Kontak, Status...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-10 py-2 text-xs focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 space-x-1 whitespace-nowrap">Wilayah / Sektor:</span>
                <select
                  id="sektor-filter"
                  value={selectedSektor}
                  onChange={(e) => setSelectedSektor(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden text-slate-700 font-medium cursor-pointer"
                >
                  <option value="Semua">Semua Sektor (I s/d IV)</option>
                  <option value="Sektor I">Sektor I (Baitel)</option>
                  <option value="Sektor II">Sektor II (Efrata)</option>
                  <option value="Sektor III">Sektor III (Gideon)</option>
                  <option value="Sektor IV">Sektor IV (Sion)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 space-x-1 whitespace-nowrap">Komsel:</span>
                <select
                  id="komsel-filter"
                  value={selectedKomselFilter}
                  onChange={(e) => setSelectedKomselFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden text-slate-700 font-medium cursor-pointer"
                >
                  <option value="Semua">Semua Kelompok</option>
                  <option value="Tanpa Komsel">Belum Tergabung Komsel</option>
                  {uniqueKomselList.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Grid / Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* MEMBERS REGISTERED TABLE LIST */}
            <div className="xl:col-span-2 print:col-span-3 border border-slate-200 rounded-sm overflow-hidden bg-white shadow-xs w-full">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Daftar Anggota Keluarga Yayasan ({filteredMembers.length} hasil)</span>
                <span className="text-[10px] text-slate-500 font-mono">Modul Anggota</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="py-2 px-4">Nama Anggota</th>
                      <th className="py-2 px-3">Sektor</th>
                      <th className="py-2 px-3">Kelompok Kecil (Komsel)</th>
                      <th className="py-2 px-3">Ulang Tahun</th>
                      <th className="py-2 px-3">Kontak / Keluarga</th>
                      <th className="py-2 px-3 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            <div>{member.nama}</div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-xs truncate">
                              {member.alamat || 'Alamat belum diinput'}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600">
                              <MapPin className="w-2.5 h-2.5 text-[#3875d7]" />
                              {member.sektor}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold">
                            {member.komsel ? (
                              <div className="space-y-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                  member.peranKomsel === 'Pemimpin' 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                                }`}>
                                  {member.komsel}
                                </span>
                                <span className="block text-[8.5px] font-medium text-slate-400 pl-1">
                                  {member.peranKomsel === 'Pemimpin' ? '⭐ Pemimpin Komsel' : 'Anggota'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10.5px] text-slate-400 font-medium italic">Belum Join</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700">
                            {member.tglUlangTahun}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono text-slate-500">{member.phone || '-'}</div>
                            <div className="text-[10px] text-[#3875d7] font-semibold">{member.statusKeluarga}</div>
                          </td>
                          <td className="py-3 px-3 print:hidden">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditForm(member)}
                                className="bg-sky-50 text-sky-600 hover:bg-sky-100 p-1.5 rounded transition-colors cursor-pointer"
                                title="Edit Data"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmId(member.id);
                                }}
                                className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-1.5 rounded transition-colors cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 italic font-medium">
                          Pencarian tidak ditemukan atau database kosong.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* INPUT FORM (ADD OR EDIT) */}
            <div className="border border-slate-200 rounded bg-slate-50 p-4 print:hidden">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  {editingMember ? <Edit3 className="w-4 h-4 text-[#eca83c]" /> : <UserPlus className="w-4 h-4 text-emerald-600" />}
                  <span>{editingMember ? 'Ubah Informasi Anggota' : 'Form Anggota Baru'}</span>
                </h3>
                {isFormOpen && (
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Nama Lengkap Anggota *
                  </label>
                  <input
                    id="form-member-name"
                    type="text"
                    required
                    placeholder="Contoh: Ronald Purba, M.Sc"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Ulang Tahun *
                    </label>
                    <input
                      id="form-member-bday"
                      type="date"
                      required
                      value={tglUlangTahun}
                      onChange={(e) => setTglUlangTahun(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                      Pernikahan <span className="text-[9px] text-slate-400 font-normal">(opsional)</span>
                    </label>
                    <input
                      id="form-member-anniversary"
                      type="date"
                      value={tglPernikahan}
                      onChange={(e) => setTglPernikahan(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Wilayah / Sektor
                    </label>
                    <select
                      id="form-member-sektor"
                      value={sektor}
                      onChange={(e) => setSektor(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-semibold cursor-pointer"
                    >
                      <option value="Sektor I">Sektor I (Baitel)</option>
                      <option value="Sektor II">Sektor II (Efrata)</option>
                      <option value="Sektor III">Sektor III (Gideon)</option>
                      <option value="Sektor IV">Sektor IV (Sion)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Hub. Keluarga
                    </label>
                    <select
                      id="form-member-status"
                      value={statusKeluarga}
                      onChange={(e) => setStatusKeluarga(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-semibold cursor-pointer"
                    >
                      <option value="Kepala Keluarga">Kepala Keluarga</option>
                      <option value="Istri">Istri</option>
                      <option value="Anak">Anak</option>
                      <option value="Mandiri">Mandiri / Jomblo</option>
                    </select>
                  </div>
                </div>

                {/* Komsel & Peran inputs directly in Member form */}
                <div className="border border-slate-200/80 p-3 rounded bg-white">
                  <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Penempatan Kelompok Kecil (Komsel)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-500 mb-1">Kelompok</label>
                      <select
                        value={komsel}
                        onChange={(e) => setKomsel(e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:ring-[1px] focus:ring-[#3875d7] focus:outline-hidden font-medium cursor-pointer bg-slate-50"
                      >
                        <option value="">-- Non Komsel --</option>
                        {uniqueKomselList.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                        {/* Option to type custom if list empty */}
                        <option value="Komsel Baru">Create New / Komsel Baru</option>
                      </select>
                      {komsel === 'Komsel Baru' && (
                        <input
                          type="text"
                          placeholder="Nama Komsel baru..."
                          onChange={(e) => setKomsel(e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1 mt-1 text-xs text-slate-800"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-500 mb-1">Peran Jabatan</label>
                      <select
                        value={peranKomsel}
                        onChange={(e) => setPeranKomsel(e.target.value)}
                        disabled={!komsel}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-750 focus:ring-[1px] focus:ring-[#3875d7] focus:outline-hidden font-medium cursor-pointer bg-slate-50 disabled:opacity-50"
                      >
                        <option value="Bukan Anggota">Melayani / Bukan Anggota</option>
                        <option value="Anggota">Anggota Biasa</option>
                        <option value="Pemimpin">Pemimpin Kelompok (CG Leader)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    No. HP / WhatsApp
                  </label>
                  <input
                    id="form-member-phone"
                    type="text"
                    placeholder="Contoh: 081234..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1 font-sans">
                    Alamat Rumah Tinggal
                  </label>
                  <textarea
                    id="form-member-alamat"
                    placeholder="Jl. Raya Permai No. A-12, Bekasi Barat"
                    value={alamat}
                    rows={2}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden resize-none font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    id="form-submit-member"
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingMember ? 'Simpan Perubahan' : 'Masukkan Database'}</span>
                  </button>
                  
                  {editingMember && (
                    <button
                      type="button"
                      onClick={handleOpenAddForm}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded text-xs transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </>
      ) : (
        /* KELOMPOK KECIL / KOMSEL SEGMENT VIEW */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* LIST BOX OF CG GROUPS */}
          <div className="xl:col-span-2 space-y-6">
            {uniqueKomselList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniqueKomselList.map((groupName) => {
                  const leader = members.find(m => m.komsel === groupName && m.peranKomsel === 'Pemimpin');
                  const groupMembers = members.filter(m => m.komsel === groupName && m.peranKomsel !== 'Pemimpin');
                  
                  return (
                    <div key={groupName} className="border border-slate-200/90 rounded-md bg-white shadow-xs overflow-hidden flex flex-col justify-between">
                      {/* Card main parameters */}
                      <div className="p-4 flex-1">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                          <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-[#3875d7]" />
                            <span>{groupName}</span>
                          </h3>
                          <span className="bg-indigo-50 text-indigo-700 font-mono text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-150">
                            {groupMembers.length + (leader ? 1 : 0)} Anggota
                          </span>
                        </div>

                        {/* Leader section info */}
                        <div className="bg-slate-50 border border-slate-150/80 rounded p-2.5 mb-3">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Pemimpin Kelompok (CG Leader)</span>
                          {leader ? (
                            <div className="flex justify-between items-center mt-1">
                              <div>
                                <div className="text-xs font-bold text-slate-800">{leader.nama}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{leader.phone || 'HP tidak diset'}</div>
                              </div>
                              <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[8.5px] border border-amber-200 flex items-center gap-0.5">
                                <UserCheck className="w-2.5 h-2.5" />
                                Leader
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-rose-500 italic font-medium mt-1">Belum Ada Pemimpin. Silakan Edit Anggota dan jadikan Leader.</div>
                          )}
                        </div>

                        {/* Members inside the group */}
                        <div>
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Anggota Komsel ({groupMembers.length})</span>
                          {groupMembers.length > 0 ? (
                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                              {groupMembers.map((gm) => (
                                <div key={gm.id} className="flex justify-between items-center text-xs py-1.5 px-2 bg-slate-50 hover:bg-slate-100 transition-colors rounded">
                                  <div className="font-medium text-slate-700 truncate mr-2" title={gm.nama}>
                                    {gm.nama}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-slate-450 font-mono truncate">{gm.phone || '-'}</span>
                                    <button
                                      onClick={() => handleRemoveFromKomsel(gm)}
                                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                                      title="Keluarkan dari Kelompok"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10.5px] text-slate-400 italic">Belum ada anggota biasa tergabung.</div>
                          )}
                        </div>
                      </div>

                      {/* Card Quick-Assign Footer */}
                      <div className="bg-slate-50 px-4 py-2 text-xs border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">Join:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignToKomsel(e.target.value, groupName);
                                e.target.value = ''; // Reset select
                              }
                            }}
                            className="bg-white border border-slate-200 rounded px-1.5 py-1 text-[10.5px] w-full focus:ring-[1px] cursor-pointer text-slate-700 font-medium"
                          >
                            <option value="">-- Tambah Anggota --</option>
                            {members.filter(m => !m.komsel).map(m => (
                              <option key={m.id} value={m.id}>{m.nama}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedKomselToManage(groupName)}
                          className="bg-[#3875d7]/10 hover:bg-[#3875d7]/20 text-[#3a7ad9] font-bold py-1.5 px-2.5 rounded text-[10px] border border-[#3875d7]/20 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Kelola Komsel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-slate-200/95 rounded p-12 text-center bg-slate-50">
                <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Belum ada Kelompok Kecil (Komsel)</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Silakan buat kelompok kecil baru di panel sebelah kanan dengan menentukan penamaan komsel dan memilih pemimpin pertamanya.
                </p>
              </div>
            )}
          </div>

          {/* FORM TO CREATE KOMSEL */}
          <div className="border border-slate-200 rounded bg-slate-50 p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2.5 mb-4 flex items-center gap-1">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Kelompok Kecil Baru</span>
            </h3>

            <form onSubmit={handleCreateKomsel} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Nama Komsel / Group *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Komsel Yerusalem, Komsel Bethany"
                  value={newKomselName}
                  onChange={(e) => setNewKomselName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-[#3875d7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Pilih Pemimpin Komsel *
                </label>
                <select
                  required
                  value={newKomselLeaderId}
                  onChange={(e) => setNewKomselLeaderId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-750 focus:ring-1 focus:ring-[#3875d7] font-medium cursor-pointer"
                >
                  <option value="">-- Pilih Anggota Sebagai Core/Leader --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nama} {m.komsel ? `(Tergabung di ${m.komsel})` : '(Bebas/Belum Tergabung)'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pemersatu utama kelompok kecil didasarkan dari Leader terpilih. Anggota biasa dapat langsung ditambahkan setelah Komsel dibentuk.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Bentuk Kelompok Komsel</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED KOMSEL MANAGEMENT MODAL */}
      {selectedKomselToManage && (() => {
        const komselName = selectedKomselToManage;
        const leader = members.find(m => m.komsel === komselName && m.peranKomsel === 'Pemimpin');
        const groupMembers = members.filter(m => m.komsel === komselName && m.peranKomsel !== 'Pemimpin');
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                      Detail &amp; Pengelolaan Komsel: {komselName}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Atur Pemimpin, tambahkan anggota, atau mutasikan anggota dengan praktis
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedKomselToManage(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* Section Stats Info */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="bg-slate-50 p-3 rounded border border-slate-150">
                    <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Anggota</span>
                    <span className="text-lg font-bold text-slate-800 mt-1 block">
                      {groupMembers.length + (leader ? 1 : 0)} Orang
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-150">
                    <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Sektor Pelayanan Utama</span>
                    <span className="text-xs font-bold text-slate-700 mt-1 block truncate">
                      {(() => {
                        const totalList = members.filter(m => m.komsel === komselName);
                        if (totalList.length === 0) return 'Belum terdata';
                        const counts: Record<string, number> = {};
                        totalList.forEach(m => {
                          if (m.sektor) counts[m.sektor] = (counts[m.sektor] || 0) + 1;
                        });
                        let topSektor = 'Sektor I';
                        let max = 0;
                        Object.entries(counts).forEach(([k, v]) => {
                          if (v > max) { max = v; topSektor = k; }
                        });
                        return topSektor;
                      })()}
                    </span>
                  </div>
                </div>

                {/* PEMIMPIN KOMSEL (LEADER ASSIGN) */}
                <div className="border border-amber-200 rounded-md p-4 bg-amber-50/50">
                  <span className="block text-[10px] font-black uppercase text-amber-750 tracking-wider mb-2 flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <span>Pemimpin Kelompok Kecil (Leader)</span>
                  </span>
                  
                  {leader ? (
                    <div className="flex bg-white border border-amber-200/80 p-3 rounded-md items-center justify-between mb-3 shadow-xs">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{leader.nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{leader.phone || 'HP tidak diset'} &bull; {leader.sektor}</div>
                      </div>
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[8.5px] border border-amber-200">
                        Active Leader
                      </span>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-250 p-3 text-rose-705 rounded-md mb-3 font-semibold">
                      ⚠ Belum ada Pemimpin ditugaskan untuk kelompok ini! Silakan tunjuk satu di bawah.
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                      {leader ? 'Ganti / Tunjuk Pemimpin Baru' : 'Pilih Pemimpin Kelompok'}
                    </label>
                    <select
                      value={leader ? leader.id : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSetLeaderDirectly(komselName, e.target.value);
                        }
                      }}
                      className="bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 w-full cursor-pointer focus:ring-1 focus:ring-indigo-500 font-medium"
                    >
                      <option value="">-- Pilih Pemimpin Kelompok --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nama} {m.komsel ? `(Komsel: ${m.komsel})` : '(Tanpa Komsel)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DAFTAR ANGGOTA YAYASAN TERGABUNG */}
                <div>
                  <span className="block text-[10.5px] font-black uppercase text-slate-600 tracking-wider mb-2 flex items-center gap-1">
                    <Users className="w-4 h-4 text-[#3875d7]" />
                    <span>Daftar Anggota Kelompok ({groupMembers.length})</span>
                  </span>

                  {groupMembers.length > 0 ? (
                    <div className="border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                      {groupMembers.map(m => (
                        <div key={m.id} className="flex p-2.5 items-center justify-between bg-slate-50 hover:bg-slate-100/50 transition-colors">
                          <div>
                            <div className="text-xs font-semibold text-slate-800">{m.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {m.phone || 'Kontak -'} &bull; {m.statusKeluarga}
                            </div>
                          </div>
                          
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSetLeaderDirectly(komselName, m.id)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-850 px-2 py-1 rounded border border-amber-200 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-0.5"
                              title="Jadikan Pemimpin Utama"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Naikkan Pemimpin</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromKomsel(m)}
                              className="bg-rose-55 hover:bg-rose-100 text-rose-600 hover:text-rose-700 px-2 py-1 rounded border border-rose-220 text-[10px] font-bold transition-colors cursor-pointer"
                              title="Keluarkan dari Komsel"
                            >
                              Keluarkan
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded p-6 bg-slate-50 text-center font-medium text-slate-400 italic">
                      Kelompok ini tidak memiliki anggota biasa selain pemimpin kelompok.
                    </div>
                  )}
                </div>

                {/* TAMBAH ANGGOTA BARU SECTION */}
                <div className="border-t border-slate-200 pt-4">
                  <span className="block text-[10.5px] font-black uppercase text-slate-600 tracking-wider mb-2 flex items-center gap-1">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Tambahkan Anggota Baru ke Kelompok Ini</span>
                  </span>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignToKomsel(e.target.value, komselName);
                          e.target.value = ''; // Reset select
                        }
                      }}
                      className="bg-white border border-slate-300 rounded p-2 text-xs text-slate-800 w-full cursor-pointer focus:ring-1 focus:ring-indigo-500 font-medium"
                    >
                      <option value="">-- Pilih Anggota untuk Dimasukkan --</option>
                      {members
                        .filter(m => m.komsel !== komselName)
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            {m.nama} {m.komsel ? `(Pindahkan dari "${m.komsel}")` : '(Tanpa Komsel)'}
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1 pl-1 leading-relaxed">
                      Catatan: Jika anggota tersebut sudah tergabung di komsel lain, maka perannya akan otomatis beralih ke komsel ini.
                    </p>
                  </div>
                </div>

                {/* BUBARKAN KOMSEL DESIGNER */}
                <div className="bg-rose-50 border border-rose-100 hover:bg-rose-100/50 p-3 rounded flex items-center justify-between gap-3 transition-colors shrink-0">
                  <div>
                    <div className="text-xs font-bold text-rose-800">Zona Pembubaran Komsel</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Melepaskan seluruh keanggotaan dan melikuidasi data komsel ini.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDissolveKomsel(komselName)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-3 rounded text-[10.5px] transition-colors cursor-pointer"
                  >
                    Bubarkan Komsel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                  Konfirmasi Hapus Anggota
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data anggota <strong>{members.find(m => m.id === deleteConfirmId)?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
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
                  onDeleteMember(deleteConfirmId);
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
