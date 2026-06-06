export interface Member {
  id: string;
  nama: string;
  tglUlangTahun: string; // format YYYY-MM-DD
  tglPernikahan?: string; // format YYYY-MM-DD (optional)
  phone?: string;
  alamat?: string;
  sektor?: string; // Sektor I, Sektor II, etc. (Can represent Region/Branch)
  statusKeluarga?: string; // Kepala Keluarga, Istri, Anak, Mandiri
  createdBy?: string;
  komsel?: string; // Kelompok Kecil / Komsel / Cell Group
  peranKomsel?: 'Pemimpin' | 'Anggota' | 'Bukan Anggota' | string; // Role in Komsel
}

export interface TransactionType {
  id: string;
  category: 'Ibadah Umum' | 'Ucapan Syukur' | 'Persepuluhan' | 'Sektor' | 'Donasi Sosial' | 'Kemitraan Yayasan' | 'Dana Sponsor' | string;
  amount: number;
  date: string; // YYYY-MM-DD
  keterangan: string;
  donor?: string;
  createdBy?: string;
  anggaranId?: string; // ID of BudgetItem if taken from budget allocation
}

export interface ChurchAsset {
  id: string;
  namaBarang: string;
  jumlah: number;
  kondisi: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  lokasi: string;
  tanggalPerolehan: string;
  createdBy?: string;
}

export interface Bill {
  id: string;
  namaTagihan: string;
  untukSektor: string;
  jumlahTagihan: number;
  tanggalJatuhTempo: string;
  status: 'Lunas' | 'Belum Lunas';
  createdBy?: string;
}

export interface WorshipSchedule {
  id: string;
  namaIbadah: string;
  tanggalIbadah: string; // YYYY-MM-DD
  waktuIbadah: string; // HH:MM
  pemberitaFirman: string;
  petugasLiturgi: string;
  pemimpinPujian: string;
  timPeralatan?: string; // Tim Peralatan / Equipment team
  timPengundangan?: string; // Tim Pengundangan / Usher / Invitation team
  timPemusik?: string; // Tim Pemusik / Musicians
  biayaIbadah?: number; // Cost of organizing this event/worship service
  anggaranId?: string; // Associated budget source ID
  createdBy?: string;
}

export interface Committee {
  id: string;
  namaKepanitiaan: string; // contoh: "Panitia Natal 2026", "Seksi Koor Sektor I"
  deskripsi: string;
  tanggalDibentuk: string; // YYYY-MM-DD
  status: 'Aktif' | 'Selesai Tugas' | 'Draf';
  anggotaList: {
    nama: string;
    jabatan: string; // contoh: "Ketua", "Sekretaris", "Bendahara", "Seksi Acara", "Anggota"
    kontak?: string;
  }[];
  createdBy?: string;
}

export interface BudgetItem {
  id: string;
  nama: string;
  kategori: string;
  alokasi: number;
  terpakai: number;
  keterangan: string;
  createdBy?: string;
}

export interface Bulletin {
  id: string;
  bulan: string;
  judul: string;
  tanggalRilis: string;
  temaMingguan: string;
  ringkasanKhotba: string;
  wartaJemaat: string;
  createdBy?: string;
}

export interface AppState {
  members: Member[];
  transactions: TransactionType[];
  assets: ChurchAsset[];
  bills: Bill[];
  schedules: WorshipSchedule[];
  currentUser: {
    username: string;
    role: string;
    code: string;
    packageType: string;
    activeUntil: string;
  };
}
