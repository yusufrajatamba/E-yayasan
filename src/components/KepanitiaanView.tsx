import React, { useState } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  UserPlus, 
  X, 
  Calendar, 
  Briefcase, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Printer
} from 'lucide-react';
import { Committee } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface KepanitiaanViewProps {
  committees: Committee[];
  onAddCommittee: (committee: Omit<Committee, 'id'>) => Promise<void>;
  onEditCommittee: (committee: Committee) => Promise<void>;
  onDeleteCommittee: (id: string) => Promise<void>;
}

export default function KepanitiaanView({ 
  committees, 
  onAddCommittee, 
  onEditCommittee, 
  onDeleteCommittee 
}: KepanitiaanViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Selesai Tugas' | 'Draf'>('Semua');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  
  const [namaKepanitiaan, setNamaKepanitiaan] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tanggalDibentuk, setTanggalDibentuk] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Aktif' | 'Selesai Tugas' | 'Draf'>('Aktif');
  const [anggotaList, setAnggotaList] = useState<{ nama: string; jabatan: string; kontak?: string }[]>([]);

  // Member Input Row
  const [newAnggotaNama, setNewAnggotaNama] = useState('');
  const [newAnggotaJabatan, setNewAnggotaJabatan] = useState('Anggota');
  const [newAnggotaKontak, setNewAnggotaKontak] = useState('');

  const resetForm = () => {
    setNamaKepanitiaan('');
    setDeskripsi('');
    setTanggalDibentuk(new Date().toISOString().split('T')[0]);
    setStatus('Aktif');
    setAnggotaList([]);
    setNewAnggotaNama('');
    setNewAnggotaJabatan('Anggota');
    setNewAnggotaKontak('');
    setEditingCommittee(null);
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (comm: Committee) => {
    setEditingCommittee(comm);
    setNamaKepanitiaan(comm.namaKepanitiaan);
    setDeskripsi(comm.deskripsi);
    setTanggalDibentuk(comm.tanggalDibentuk);
    setStatus(comm.status);
    setAnggotaList([...comm.anggotaList]);
    setIsFormOpen(true);
  };

  const handleAddAnggota = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newAnggotaNama.trim()) {
      alert('Nama anggota tidak boleh kosong!');
      return;
    }
    setAnggotaList(prev => [
      ...prev, 
      { 
        nama: newAnggotaNama.trim(), 
        jabatan: newAnggotaJabatan, 
        kontak: newAnggotaKontak.trim() || undefined 
      }
    ]);
    setNewAnggotaNama('');
    setNewAnggotaJabatan('Anggota');
    setNewAnggotaKontak('');
  };

  const handleRemoveAnggota = (index: number) => {
    setAnggotaList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKepanitiaan.trim()) {
      alert('Nama kepanitiaan/seksi wajib diisi!');
      return;
    }

    try {
      const payload = {
        namaKepanitiaan: namaKepanitiaan.trim(),
        deskripsi: deskripsi.trim(),
        tanggalDibentuk,
        status,
        anggotaList
      };

      if (editingCommittee) {
        await onEditCommittee({
          ...editingCommittee,
          ...payload
        });
      } else {
        await onAddCommittee(payload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      alert('Gagal menyimpan kepanitiaan ke database!');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kepanitiaan "${name}"?`)) {
      try {
        await onDeleteCommittee(id);
      } catch (err) {
        alert('Gagal menghapus kepanitiaan!');
      }
    }
  };

  const filteredCommittees = committees.filter(comm => {
    const matchesSearch = 
      comm.namaKepanitiaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.anggotaList.some(member => member.nama.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'Semua' || comm.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(18, 66, 127);
    doc.text("GEREJA GLORIA JEMAAT CENTER", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("LAPORAN DAFTAR INTEGRASI KEPANITIAAN & SEKSI KEBAKTIAN", 14, 27);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Waktu Cetak: 2026-06-04 | Filter Status: ${statusFilter} | Total Terdaftar: ${filteredCommittees.length} Kepanitiaan`, 14, 33);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 36, 196, 36);

    const checkList = filteredCommittees.map((c, index) => [
      index + 1,
      c.namaKepanitiaan,
      c.deskripsi || "-",
      c.tanggalDibentuk || "-",
      c.status,
      c.anggotaList.map(a => `${a.nama} (${a.jabatan})`).join(", ")
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["No", "Nama Kepanitiaan", "Deskripsi", "Tanggal Dibentuk", "Status", "Daftar Personel"]],
      body: checkList,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [18, 66, 127] },
      columnStyles: {
        5: { cellWidth: 60 }
      }
    });

    doc.save("Laporan-Kepanitiaan-Seksi-Gereja.pdf");
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto h-full print:p-0 print:bg-white" id="kepanitiaan-view-container">
      {/* Printed Header Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-850 pb-4 mb-6">
        <h1 className="text-2xl font-serif font-black tracking-tight uppercase">DAFTAR KEPANITIAAN &amp; SEKSI KEBAKTIAN</h1>
        <p className="text-xs font-semibold text-slate-700">Gereja Gloria Jemaat Center &bull; Enterprise Logistik Sistem</p>
        <p className="text-[10px] text-slate-500 mt-1 font-mono">Dicetak pada tanggal: 2026-06-04 &bull; Total Kepanitiaan Registered: {committees.length} Kepanitiaan</p>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>Kepanitiaan &amp; Seksi Kebaktian</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Persiapan ibadah hari raya, panitia pembangunan, koor wilayah, pelayan kebaktian, serta tim seksi liturgi jemaat.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            id="btn-cetak-kepanitiaan"
            onClick={exportToPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Ekspor PDF</span>
          </button>
          <button
            id="btn-tambah-kepanitiaan"
            onClick={openAddForm}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-2 px-4 rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kepanitiaan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 shadow-xs print:hidden">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 flex">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 h-4 text-slate-400" />
            </span>
            <input
              id="kepanitiaan-search"
              type="text"
              placeholder="Cari kepanitiaan (contoh: Natal, koor, nama anggota)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded pl-10 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-500 shrink-0">Filter Status:</label>
            <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
              {(['Semua', 'Aktif', 'Selesai Tugas', 'Draf'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === f
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid List of Committees */}
      {filteredCommittees.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
          <Award className="w-12 h-12 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">Tidak ada data kepanitiaan ditemukan</p>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Mungkin kata kunci tidak cocok atau data masih kosong. Silakan ganti kata kunci atau tambahkan kepanitiaan baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          {filteredCommittees.map((comm) => (
            <div 
              key={comm.id}
              id={`comm-card-${comm.id}`}
              className="bg-white border rounded-lg shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              {/* Card Banner */}
              <div className="p-5 border-b border-slate-100 bg-[#fafbfc]">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">{comm.namaKepanitiaan}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 font-semibold">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Dibentuk: {comm.tanggalDibentuk}</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {comm.status === 'Aktif' && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Aktif</span>
                      </span>
                    )}
                    {comm.status === 'Selesai Tugas' && (
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        <span>Selesai Tugas</span>
                      </span>
                    )}
                    {comm.status === 'Draf' && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Draf</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-white/75 p-2 rounded border border-slate-100">
                  {comm.deskripsi || <span className="text-slate-400 italic">Tidak ada deskripsi kepanitiaan.</span>}
                </p>
              </div>

              {/* Members Content Grid */}
              <div className="p-5 flex-1 bg-white">
                <div className="flex items-center justify-between mb-3.5 border-b border-dashed border-slate-150 pb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Susunan Struktur Organisasi</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {comm.anggotaList.length} Orang
                  </span>
                </div>

                {comm.anggotaList.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Susunan panitia belum ditambahkan ke kepanitiaan ini.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {comm.anggotaList.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-150/75 shadow-3xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                            {member.nama.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{member.nama}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{member.kontak || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded text-right shrink-0 uppercase tracking-wide">
                          {member.jabatan}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-[#e5e8ef] flex justify-end gap-2 text-xs print:hidden">
                <button
                  id={`btn-edit-comm-${comm.id}`}
                  onClick={() => openEditForm(comm)}
                  className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold py-1.5 px-3 rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
                <button
                  id={`btn-delete-comm-${comm.id}`}
                  onClick={() => handleDelete(comm.id, comm.namaKepanitiaan)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-3 rounded flex items-center gap-1 transition-colors border border-rose-150 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL PANEL OVERLAY */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs print:hidden">
          <div className="bg-white rounded border border-slate-200 max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Form Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>{editingCommittee ? 'Ubah' : 'Tambah'} Data Kepanitiaan Pelayanan</span>
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields Scrolling Block */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 select-none">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Nama Kepanitiaan *</label>
                <input
                  id="form-comm-name"
                  type="text"
                  required
                  placeholder="Ketik nama kepanitiaan (cth: Panitia Natal 2026)..."
                  value={namaKepanitiaan}
                  onChange={(e) => setNamaKepanitiaan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Deskripsi Tugas &amp; Tanggung Jawab</label>
                <textarea
                  id="form-comm-desc"
                  placeholder="Deskripsikan peran kepanitiaan atau masa baktinya di sini..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Tanggal Dibentuk *</label>
                  <input
                    id="form-comm-date"
                    type="date"
                    required
                    value={tanggalDibentuk}
                    onChange={(e) => setTanggalDibentuk(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Status Kepanitiaan *</label>
                  <select
                    id="form-comm-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-850 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai Tugas">Selesai Tugas</option>
                    <option value="Draf">Draf</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Organizational Structure Input Section */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                <span className="block text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-wider">Struktur Anggota Panitia</span>

                {/* Sub-Form Row inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3 items-end">
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-slate-450 mb-1">Nama Anggota</label>
                    <input
                      id="form-comm-member-name"
                      type="text"
                      placeholder="Ketik nama (cth: St. Sihombing)..."
                      value={newAnggotaNama}
                      onChange={(e) => setNewAnggotaNama(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-slate-450 mb-1">Jabatan / Peran</label>
                    <input
                      id="form-comm-member-job"
                      type="text"
                      placeholder="Ketua, Seksi Musik, Humas, dll..."
                      value={newAnggotaJabatan}
                      onChange={(e) => setNewAnggotaJabatan(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[9px] uppercase font-semibold text-slate-450 mb-1">No Kontak / HP</label>
                      <input
                        id="form-comm-member-contact"
                        type="text"
                        placeholder="0812..."
                        value={newAnggotaKontak}
                        onChange={(e) => setNewAnggotaKontak(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-800 focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      id="btn-add-member-to-list"
                      onClick={handleAddAnggota}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded transition-colors cursor-pointer shrink-0"
                      title="Tambahkan anggota ke lis"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Added Members Table/List */}
                {anggotaList.length === 0 ? (
                  <div className="text-center p-4 bg-slate-100 rounded border border-dashed border-slate-200 text-slate-400 text-[10px]">
                    Belum ada anggota dimasukkan. Masukkan isian di atas dan klik tombol tambah (+).
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto bg-white border rounded p-1.5">
                    {anggotaList.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-150">
                        <div className="flex gap-2 items-center">
                          <span className="font-bold text-slate-850">{m.nama}</span>
                          <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1 rounded">{m.jabatan}</span>
                          {m.kontak && <span className="text-slate-400">({m.kontak})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnggota(idx)}
                          className="text-rose-650 hover:text-rose-800 p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Buttons Footer */}
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 text-xs shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-comm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Kepanitiaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
