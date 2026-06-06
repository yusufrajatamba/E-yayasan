import { Member, TransactionType, ChurchAsset, Bill, WorshipSchedule, Committee } from './types';

// Let's seed initial members with birthday dates set near early June 2026
// Current date: 2026-06-04 (Thursday)
// Week 1 (Minggu Ini: 2026-06-01 to 2026-06-07)
// Week 2 (Minggu Depan: 2026-06-08 to 2026-06-14)
export const initialMembers: Member[] = [
  {
    id: 'm1',
    nama: 'Ronaldo Simanjuntak',
    tglUlangTahun: '1988-06-02', // June 2
    tglPernikahan: '2015-06-03', // June 3
    phone: '081234567890',
    alamat: 'Jl. Melati No. 12, Sektor I',
    sektor: 'Sektor I',
    statusKeluarga: 'Kepala Keluarga'
  },
  {
    id: 'm2',
    nama: 'Dewi Lestari Manurung',
    tglUlangTahun: '1991-06-03', // June 3
    tglPernikahan: '2015-06-03', // June 3
    phone: '081234567891',
    alamat: 'Jl. Melati No. 12, Sektor I',
    sektor: 'Sektor I',
    statusKeluarga: 'Istri'
  },
  {
    id: 'm3',
    nama: 'Andreas Situmorang',
    tglUlangTahun: '1995-06-05', // June 5
    phone: '081345678912',
    alamat: 'Ruko Griya Segar Blok C-4',
    sektor: 'Sektor III',
    statusKeluarga: 'Mandiri'
  },
  {
    id: 'm4',
    nama: 'Budi Hutapea',
    tglUlangTahun: '1979-06-07', // June 7
    tglPernikahan: '2004-06-01', // June 1
    phone: '08119876543',
    alamat: 'Perum Kencana Indah Gang 2B',
    sektor: 'Sektor II',
    statusKeluarga: 'Kepala Keluarga'
  },
  {
    id: 'm5',
    nama: 'Theresia Siregar',
    tglUlangTahun: '1984-06-10', // June 10
    tglPernikahan: '2010-06-12', // June 12
    phone: '087855442211',
    alamat: 'Jl. Siliwangi No. 45',
    sektor: 'Sektor II',
    statusKeluarga: 'Istri'
  },
  {
    id: 'm6',
    nama: 'Samuel Nainggolan',
    tglUlangTahun: '1992-06-12', // June 12
    tglPernikahan: '2020-06-10', // June 10
    phone: '082166557788',
    alamat: 'Jl. Danau Toba Raya No. 9',
    sektor: 'Sektor IV',
    statusKeluarga: 'Kepala Keluarga'
  },
  {
    id: 'm7',
    nama: 'Grace Hutabarat',
    tglUlangTahun: '2005-06-14', // June 14
    phone: '08991234567',
    alamat: 'Jl. Anggrek No. 8B, Sektor I',
    sektor: 'Sektor I',
    statusKeluarga: 'Anak'
  },
  {
    id: 'm8',
    nama: 'Yohanes Sihombing',
    tglUlangTahun: '1982-10-18',
    tglPernikahan: '2008-06-13', // June 13
    phone: '08128899770',
    alamat: 'Perum Serpong Lestari No. 19',
    sektor: 'Sektor IV',
    statusKeluarga: 'Kepala Keluarga'
  },
  {
    id: 'm9',
    nama: 'Clara Sitorus',
    tglUlangTahun: '2010-06-06', // June 6
    phone: '08112233445',
    alamat: 'Jl. Kebon Jeruk No. 101',
    sektor: 'Sektor I',
    statusKeluarga: 'Anak'
  }
];

export const initialTransactions: TransactionType[] = [
  // Penerimaan Bulan Ini - Juni 2026
  {
    id: 't1',
    category: 'Ibadah Umum',
    amount: 5200000,
    date: '2026-06-01',
    keterangan: 'Persembahan Ibadah Minggu Pagi I',
    donor: 'Jemaat Umum'
  },
  {
    id: 't2',
    category: 'Ibadah Umum',
    amount: 4300000,
    date: '2026-06-01',
    keterangan: 'Persembahan Ibadah Minggu Siang II',
    donor: 'Jemaat Umum'
  },
  {
    id: 't3',
    category: 'Ibadah Umum',
    amount: 3000000,
    date: '2026-06-03',
    keterangan: 'Persembahan Ibadah Tengah Minggu',
    donor: 'Jemaat Umum'
  },
  {
    id: 't4',
    category: 'Ucapan Syukur',
    amount: 2500000,
    date: '2026-06-02',
    keterangan: 'Ucapan Syukur atas Kesembuhan Keluarga',
    donor: 'Kel. Budi Hutapea'
  },
  {
    id: 't5',
    category: 'Ucapan Syukur',
    amount: 1750000,
    date: '2026-06-03',
    keterangan: 'Ucapan Syukur Kelulusan Anak',
    donor: 'Kel. Ronaldo Simanjuntak'
  },
  {
    id: 't6',
    category: 'Persepuluhan',
    amount: 10500000,
    date: '2026-06-02',
    keterangan: 'Persepuluhan Bulan Juni',
    donor: 'Hamba Tuhan NN'
  },
  {
    id: 't7',
    category: 'Persepuluhan',
    amount: 8400000,
    date: '2026-06-04',
    keterangan: 'Persepuluhan Bulan Juni Kel. Siregar',
    donor: 'Kel. Siregar'
  },
  {
    id: 't8',
    category: 'Sektor',
    amount: 3100000,
    date: '2026-06-02',
    keterangan: 'Penerimaan Persembahan Sektor I & II',
    donor: 'Kolekte Sektor'
  },
  {
    id: 't9',
    category: 'Sektor',
    amount: 2500000,
    date: '2026-06-03',
    keterangan: 'Penerimaan Persembahan Sektor III & IV',
    donor: 'Kolekte Sektor'
  },

  // Penerimaan Bulan Lalu - Mei 2026 (Untuk Perbandingan)
  {
    id: 't_m1',
    category: 'Ibadah Umum',
    amount: 11200000,
    date: '2026-05-15',
    keterangan: 'Akumulasi Persembahan Ibadah Umum Mei',
    donor: 'Umum'
  },
  {
    id: 't_m2',
    category: 'Ucapan Syukur',
    amount: 3800000,
    date: '2026-05-18',
    keterangan: 'Akumulasi Persembahan Ucapan Syukur Mei',
    donor: 'Keluarga'
  },
  {
    id: 't_m3',
    category: 'Persepuluhan',
    amount: 16500000,
    date: '2026-05-20',
    keterangan: 'Akumulasi Persepuluhan Jemaat Mei',
    donor: 'Jemaat'
  },
  {
    id: 't_m4',
    category: 'Sektor',
    amount: 4900000,
    date: '2026-05-22',
    keterangan: 'Akumulasi Persembahan Sektor-Sekur Mei',
    donor: 'Sektor'
  }
];

export const initialAssets: ChurchAsset[] = [
  {
    id: 'a1',
    namaBarang: 'Sound System Mixer Behringer X32',
    jumlah: 1,
    kondisi: 'Baik',
    lokasi: 'Ruang Operator Utama',
    tanggalPerolehan: '2023-04-12'
  },
  {
    id: 'a2',
    namaBarang: 'Piano Elektrik Roland RD-2000',
    jumlah: 1,
    kondisi: 'Baik',
    lokasi: 'Panggung Altar',
    tanggalPerolehan: '2022-09-18'
  },
  {
    id: 'a3',
    namaBarang: 'Projector Epson EB-2247U',
    jumlah: 2,
    kondisi: 'Perlu Perbaikan',
    lokasi: 'Sisi Kiri & Kanan Altar',
    tanggalPerolehan: '2021-11-05'
  },
  {
    id: 'a4',
    namaBarang: 'AC Split Daikin 2 PK',
    jumlah: 8,
    kondisi: 'Baik',
    lokasi: 'Gedung Utama (Ibadah)',
    tanggalPerolehan: '2024-02-14'
  },
  {
    id: 'a5',
    namaBarang: 'Kursi Jemaat Futura',
    jumlah: 350,
    kondisi: 'Baik',
    lokasi: 'Gedung Serbaguna',
    tanggalPerolehan: '2020-08-20'
  }
];

export const initialBills: Bill[] = [
  {
    id: 'b1',
    namaTagihan: 'Kontribusi Sosial Sinode Tahunan',
    untukSektor: 'Semua Sektor',
    jumlahTagihan: 5000000,
    tanggalJatuhTempo: '2026-06-25',
    status: 'Belum Lunas'
  },
  {
    id: 'b2',
    namaTagihan: 'Subsidi Kegiatan Remaja-Pemuda Sektor I',
    untukSektor: 'Sektor I',
    jumlahTagihan: 1500000,
    tanggalJatuhTempo: '2026-06-15',
    status: 'Lunas'
  },
  {
    id: 'b3',
    namaTagihan: 'Sewa Gedung Serbaguna Rapat Distrik',
    untukSektor: 'Pusat',
    jumlahTagihan: 3500000,
    tanggalJatuhTempo: '2026-06-30',
    status: 'Belum Lunas'
  },
  {
    id: 'b4',
    namaTagihan: 'Perawatan Sound System Sektor IV',
    untukSektor: 'Sektor IV',
    jumlahTagihan: 800000,
    tanggalJatuhTempo: '2026-06-12',
    status: 'Lunas'
  }
];

export const initialSchedules: WorshipSchedule[] = [
  {
    id: 's1',
    namaIbadah: 'Ibadah Minggu Pagi I (Bahasa Indonesia)',
    tanggalIbadah: '2026-06-07',
    waktuIbadah: '08:00',
    pemberitaFirman: 'Pdt. Dr. J. R. Simanjuntak',
    petugasLiturgi: 'St. M. Limbong',
    pemimpinPujian: 'Grace Sitorus'
  },
  {
    id: 's2',
    namaIbadah: 'Ibadah Minggu Siang II (Bahasa Batak / Tradisional)',
    tanggalIbadah: '2026-06-07',
    waktuIbadah: '10:30',
    pemberitaFirman: 'Pdt. R. Siregar, S.Th',
    petugasLiturgi: 'St. J. Nainggolan',
    pemimpinPujian: 'Clara Marbun'
  },
  {
    id: 's3',
    namaIbadah: 'Ibadah Remaja & Pemuda (Youth Service)',
    tanggalIbadah: '2026-06-07',
    waktuIbadah: '16:00',
    pemberitaFirman: 'Pdt. Muda Samuel Nainggolan',
    petugasLiturgi: 'Sdr. Timothy Hutapea',
    pemimpinPujian: 'Ruth Amanda'
  },
  {
    id: 's4',
    namaIbadah: 'Ibadah Keluarga tengah Minggu (Keluarga)',
    tanggalIbadah: '2026-06-10',
    waktuIbadah: '19:00',
    pemberitaFirman: 'St. Budi Hutapea',
    petugasLiturgi: 'St. S. Siregar',
    pemimpinPujian: 'Dewi Manurung'
  }
];

export const initialCommittees: Committee[] = [
  {
    id: 'k1',
    namaKepanitiaan: 'Panitia Natal & Tahun Baru 2026',
    deskripsi: 'Kepanitiaan khusus perayaan ibadah raya Natal 25 Desember dan ibadah kunci tahun jemaat.',
    tanggalDibentuk: '2026-05-15',
    status: 'Aktif',
    anggotaList: [
      { nama: 'Budi Hutapea', jabatan: 'Ketua', kontak: '08119876543' },
      { nama: 'Samuel Nainggolan', jabatan: 'Sekretaris', kontak: '082166557788' },
      { nama: 'Dewi Lestari Manurung', jabatan: 'Bendahara', kontak: '081234567891' },
      { nama: 'Andreas Situmorang', jabatan: 'Seksi Acara', kontak: '081345678912' }
    ]
  },
  {
    id: 'k2',
    namaKepanitiaan: 'Panitia Pembangunan Gedung Sekolah Minggu',
    deskripsi: 'Pembangunan renovasi sayap kiri gedung utama untuk ruang ibadah sekolah minggu.',
    tanggalDibentuk: '2026-04-10',
    status: 'Aktif',
    anggotaList: [
      { nama: 'Yohanes Sihombing', jabatan: 'Ketua', kontak: '08128899770' },
      { nama: 'Andreas Situmorang', jabatan: 'Sekretaris', kontak: '081345678912' },
      { nama: 'Dewi Lestari Manurung', jabatan: 'Bendahara', kontak: '081234567891' }
    ]
  },
  {
    id: 'k3',
    namaKepanitiaan: 'Panitia Paskah 2026',
    deskripsi: 'Kepanitiaan ibadah Jumat Agung dan Kebangkitan Paskah Raya jemaat.',
    tanggalDibentuk: '2026-02-15',
    status: 'Selesai Tugas',
    anggotaList: [
      { nama: 'Ronaldo Simanjuntak', jabatan: 'Ketua', kontak: '081234567890' },
      { nama: 'Dewi Lestari Manurung', jabatan: 'Sekretaris', kontak: '081234567891' }
    ]
  }
];
