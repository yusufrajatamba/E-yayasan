import React from 'react';
import { 
  collection, 
  getDocs, 
  setDoc as firebaseSetDoc, 
  deleteDoc, 
  doc, 
  writeBatch as firebaseWriteBatch,
  getDocFromServer
} from 'firebase/firestore';

// Helper to recursively clean all undefined fields from objects before writing to Firestore
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Custom wrapped setDoc to automatically sanitize payload
async function setDoc(docRef: any, data: any, options?: any) {
  return firebaseSetDoc(docRef, cleanUndefined(data), options);
}

// Custom wrapped writeBatch to automatically sanitize payload set/update
function writeBatch(firestore: any): any {
  const batch = firebaseWriteBatch(firestore);
  return {
    set(docRef: any, data: any, options?: any) {
      batch.set(docRef, cleanUndefined(data), options);
    },
    update(docRef: any, data: any) {
      batch.update(docRef, cleanUndefined(data));
    },
    delete(docRef: any) {
      batch.delete(docRef);
    },
    commit() {
      return batch.commit();
    }
  };
}
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Member, TransactionType, ChurchAsset, Bill, WorshipSchedule, Committee, BudgetItem, Bulletin } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  initialMembers, 
  initialTransactions, 
  initialAssets, 
  initialBills, 
  initialSchedules,
  initialCommittees
} from '../mockData';

// --- AUTH SERVICES DATA TYPES & HELPERS ---
export interface AppUser {
  id: string; // unique username
  username: string;
  password?: string;
  nama: string;
  role: string;
}

export function getCurrentUsername(): string {
  const saved = localStorage.getItem('egereja_current_user');
  if (saved) {
    try {
      const u = JSON.parse(saved);
      if (u && u.username) return u.username;
    } catch (_) {}
  }
  return 'gloria'; // Default fallback
}

// Connection test run as mandated by SKILL.md
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// --- USERS SERVICE ---
export async function fetchUsers(): Promise<AppUser[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const list: AppUser[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        username: data.username,
        password: data.password,
        nama: data.nama,
        role: data.role || 'Administrator Kantor'
      });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'users');
    return [];
  }
}

export async function registerUser(user: AppUser): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), user);
    // Auto-seed for the newly registered user so they don't see an empty page
    await seedUserData(user.username);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    throw err;
  }
}

export async function seedUserData(username: string): Promise<void> {
  try {
    const seededMembers = initialMembers.map(m => ({ ...m, id: uuidv4(), createdBy: username }));
    const seededTransactions = initialTransactions.map(t => ({ ...t, id: uuidv4(), createdBy: username }));
    const seededAssets = initialAssets.map(a => ({ ...a, id: uuidv4(), createdBy: username }));
    const seededBills = initialBills.map(b => ({ ...b, id: uuidv4(), createdBy: username }));
    const seededSchedules = initialSchedules.map(s => ({ ...s, id: uuidv4(), createdBy: username }));

    // Batch set members
    const mBatch = writeBatch(db);
    seededMembers.forEach(m => mBatch.set(doc(db, 'members', m.id), m));
    await mBatch.commit();

    // Batch set transactions
    const tBatch = writeBatch(db);
    seededTransactions.forEach(t => tBatch.set(doc(db, 'transactions', t.id), t));
    await tBatch.commit();

    // Batch set assets
    const aBatch = writeBatch(db);
    seededAssets.forEach(a => aBatch.set(doc(db, 'assets', a.id), a));
    await aBatch.commit();

    // Batch set bills
    const bBatch = writeBatch(db);
    seededBills.forEach(b => bBatch.set(doc(db, 'bills', b.id), b));
    await bBatch.commit();

    // Batch set schedules
    const sBatch = writeBatch(db);
    seededSchedules.forEach(s => sBatch.set(doc(db, 'schedules', s.id), s));
    await sBatch.commit();
  } catch (error) {
    console.error(`Gagal melakukan seeding data untuk user ${username}:`, error);
  }
}


// --- MEMBERS SERVICE ---
export async function fetchMembers(): Promise<Member[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'members'));
    const list: Member[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        nama: data.nama,
        tglUlangTahun: data.tglUlangTahun,
        tglPernikahan: data.tglPernikahan || '',
        phone: data.phone || '',
        alamat: data.alamat || '',
        sektor: data.sektor || '',
        statusKeluarga: data.statusKeluarga || '',
        createdBy: data.createdBy || 'gloria',
        komsel: data.komsel || '',
        peranKomsel: data.peranKomsel || 'Bukan Anggota'
      });
    });

    const activeUser = getCurrentUsername();
    const filtered = list.filter(m => m.createdBy.toLowerCase() === activeUser.toLowerCase());

    if (filtered.length === 0) {
      // Seed for backward compatibility if Firestore is completely empty or user has no records
      const batch = writeBatch(db);
      const seeded: Member[] = initialMembers.map(m => ({
        ...m,
        id: uuidv4(),
        createdBy: activeUser
      }));
      for (const m of seeded) {
        const docRef = doc(db, 'members', m.id);
        batch.set(docRef, m);
      }
      await batch.commit();
      return seeded;
    }
    return filtered;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'members');
    return [];
  }
}

export async function addMember(member: Omit<Member, 'id'>): Promise<Member> {
  const newId = uuidv4();
  const activeUser = getCurrentUsername();
  const newMember: Member & { createdBy: string } = { 
    id: newId,
    nama: member.nama,
    tglUlangTahun: member.tglUlangTahun,
    tglPernikahan: member.tglPernikahan || '',
    phone: member.phone || '',
    alamat: member.alamat || '',
    sektor: member.sektor || '',
    statusKeluarga: member.statusKeluarga || '',
    createdBy: activeUser,
    komsel: member.komsel || '',
    peranKomsel: member.peranKomsel || 'Bukan Anggota'
  };
  try {
    await setDoc(doc(db, 'members', newId), newMember);
    return newMember;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `members/${newId}`);
    throw err;
  }
}

export async function editMember(member: Member): Promise<void> {
  try {
    const docRef = doc(db, 'members', member.id);
    const payload = {
      ...member,
      createdBy: member.createdBy || getCurrentUsername()
    };
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `members/${member.id}`);
    throw err;
  }
}

export async function deleteMember(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'members', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `members/${id}`);
    throw err;
  }
}


// --- TRANSACTIONS SERVICE ---
export async function fetchTransactions(): Promise<TransactionType[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'transactions'));
    const list: (TransactionType & { createdBy?: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        category: data.category as any,
        amount: data.amount,
        date: data.date,
        keterangan: data.keterangan,
        donor: data.donor || '',
        createdBy: data.createdBy || 'gloria',
        anggaranId: data.anggaranId || ''
      });
    });

    const activeUser = getCurrentUsername();
    const filtered = list.filter(t => t.createdBy.toLowerCase() === activeUser.toLowerCase());

    if (filtered.length === 0) {
      const batch = writeBatch(db);
      const seeded: (TransactionType & { createdBy: string })[] = initialTransactions.map(t => ({
        ...t,
        id: uuidv4(),
        createdBy: activeUser
      }));
      for (const t of seeded) {
        const docRef = doc(db, 'transactions', t.id);
        batch.set(docRef, t);
      }
      await batch.commit();
      return seeded;
    }
    return filtered;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'transactions');
    return [];
  }
}

export async function addTransaction(transaction: Omit<TransactionType, 'id'>): Promise<TransactionType> {
  const newId = uuidv4();
  const activeUser = getCurrentUsername();
  const newTransaction: TransactionType & { createdBy: string } = { 
    id: newId,
    category: transaction.category,
    amount: transaction.amount,
    date: transaction.date,
    keterangan: transaction.keterangan,
    donor: transaction.donor || '',
    createdBy: activeUser,
    anggaranId: transaction.anggaranId || ''
  };
  try {
    await setDoc(doc(db, 'transactions', newId), newTransaction);
    return newTransaction;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transactions/${newId}`);
    throw err;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'transactions', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`);
    throw err;
  }
}

export async function editTransaction(transaction: TransactionType): Promise<void> {
  try {
    const docRef = doc(db, 'transactions', transaction.id);
    const payload = {
      ...transaction,
      createdBy: transaction.createdBy || getCurrentUsername()
    };
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transactions/${transaction.id}`);
    throw err;
  }
}


// --- ASSETS SERVICE ---
export async function fetchAssets(): Promise<ChurchAsset[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'assets'));
    const list: (ChurchAsset & { createdBy?: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        namaBarang: data.namaBarang,
        jumlah: data.jumlah,
        kondisi: data.kondisi as any,
        lokasi: data.lokasi,
        tanggalPerolehan: data.tanggalPerolehan,
        createdBy: data.createdBy || 'gloria'
      });
    });

    const activeUser = getCurrentUsername();
    const filtered = list.filter(a => a.createdBy.toLowerCase() === activeUser.toLowerCase());

    if (filtered.length === 0) {
      const batch = writeBatch(db);
      const seeded: (ChurchAsset & { createdBy: string })[] = initialAssets.map(a => ({
        ...a,
        id: uuidv4(),
        createdBy: activeUser
      }));
      for (const a of seeded) {
        const docRef = doc(db, 'assets', a.id);
        batch.set(docRef, a);
      }
      await batch.commit();
      return seeded;
    }
    return filtered;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'assets');
    return [];
  }
}

export async function addAsset(asset: Omit<ChurchAsset, 'id'>): Promise<ChurchAsset> {
  const newId = uuidv4();
  const activeUser = getCurrentUsername();
  const newAsset: ChurchAsset & { createdBy: string } = { 
    id: newId,
    namaBarang: asset.namaBarang,
    jumlah: asset.jumlah,
    kondisi: asset.kondisi,
    lokasi: asset.lokasi,
    tanggalPerolehan: asset.tanggalPerolehan,
    createdBy: activeUser
  };
  try {
    await setDoc(doc(db, 'assets', newId), newAsset);
    return newAsset;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `assets/${newId}`);
    throw err;
  }
}

export async function deleteAsset(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'assets', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `assets/${id}`);
    throw err;
  }
}

export async function editAsset(asset: ChurchAsset): Promise<void> {
  try {
    const docRef = doc(db, 'assets', asset.id);
    const payload = {
      ...asset,
      createdBy: asset.createdBy || getCurrentUsername()
    };
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `assets/${asset.id}`);
    throw err;
  }
}


// --- BILLS SERVICE ---
export async function fetchBills(): Promise<Bill[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'bills'));
    const list: (Bill & { createdBy?: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        namaTagihan: data.namaTagihan,
        untukSektor: data.untukSektor,
        jumlahTagihan: data.jumlahTagihan,
        tanggalJatuhTempo: data.tanggalJatuhTempo,
        status: data.status as any,
        createdBy: data.createdBy || 'gloria'
      });
    });

    const activeUser = getCurrentUsername();
    const filtered = list.filter(b => b.createdBy.toLowerCase() === activeUser.toLowerCase());

    if (filtered.length === 0) {
      const batch = writeBatch(db);
      const seeded: (Bill & { createdBy: string })[] = initialBills.map(b => ({
        ...b,
        id: uuidv4(),
        createdBy: activeUser
      }));
      for (const b of seeded) {
        const docRef = doc(db, 'bills', b.id);
        batch.set(docRef, b);
      }
      await batch.commit();
      return seeded;
    }
    return filtered;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'bills');
    return [];
  }
}

export async function addBill(bill: Omit<Bill, 'id'>): Promise<Bill> {
  const newId = uuidv4();
  const activeUser = getCurrentUsername();
  const newBill: Bill & { createdBy: string } = { 
    id: newId,
    namaTagihan: bill.namaTagihan,
    untukSektor: bill.untukSektor,
    jumlahTagihan: bill.jumlahTagihan,
    tanggalJatuhTempo: bill.tanggalJatuhTempo,
    status: bill.status,
    createdBy: activeUser
  };
  try {
    await setDoc(doc(db, 'bills', newId), newBill);
    return newBill;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `bills/${newId}`);
    throw err;
  }
}

export async function editBill(bill: Bill): Promise<void> {
  try {
    const docRef = doc(db, 'bills', bill.id);
    const payload = {
      ...bill,
      createdBy: bill.createdBy || getCurrentUsername()
    };
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `bills/${bill.id}`);
    throw err;
  }
}

export async function deleteBill(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'bills', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `bills/${id}`);
    throw err;
  }
}


// --- SCHEDULES SERVICE ---
export async function fetchSchedules(): Promise<WorshipSchedule[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'schedules'));
    const list: (WorshipSchedule & { createdBy?: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        namaIbadah: data.namaIbadah,
        tanggalIbadah: data.tanggalIbadah,
        waktuIbadah: data.waktuIbadah,
        pemberitaFirman: data.pemberitaFirman,
        petugasLiturgi: data.petugasLiturgi,
        pemimpinPujian: data.pemimpinPujian,
        createdBy: data.createdBy || 'gloria',
        timPeralatan: data.timPeralatan || '',
        timPengundangan: data.timPengundangan || '',
        timPemusik: data.timPemusik || '',
        biayaIbadah: data.biayaIbadah || 0,
        anggaranId: data.anggaranId || ''
      });
    });

    const activeUser = getCurrentUsername();
    const filtered = list.filter(s => s.createdBy.toLowerCase() === activeUser.toLowerCase());

    if (filtered.length === 0) {
      const batch = writeBatch(db);
      const seeded: (WorshipSchedule & { createdBy: string })[] = initialSchedules.map(s => ({
        ...s,
        id: uuidv4(),
        createdBy: activeUser
      }));
      for (const s of seeded) {
        const docRef = doc(db, 'schedules', s.id);
        batch.set(docRef, s);
      }
      await batch.commit();
      return seeded;
    }
    return filtered;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'schedules');
    return [];
  }
}

export async function addSchedule(schedule: Omit<WorshipSchedule, 'id'>): Promise<WorshipSchedule> {
  const newId = uuidv4();
  const activeUser = getCurrentUsername();
  const newSchedule: WorshipSchedule & { createdBy: string } = { 
    id: newId,
    namaIbadah: schedule.namaIbadah,
    tanggalIbadah: schedule.tanggalIbadah,
    waktuIbadah: schedule.waktuIbadah,
    pemberitaFirman: schedule.pemberitaFirman,
    petugasLiturgi: schedule.petugasLiturgi,
    pemimpinPujian: schedule.pemimpinPujian,
    createdBy: activeUser,
    timPeralatan: schedule.timPeralatan || '',
    timPengundangan: schedule.timPengundangan || '',
    timPemusik: schedule.timPemusik || '',
    biayaIbadah: schedule.biayaIbadah || 0,
    anggaranId: schedule.anggaranId || ''
  };
  try {
    await setDoc(doc(db, 'schedules', newId), newSchedule);
    return newSchedule;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `schedules/${newId}`);
    throw err;
  }
}

export async function deleteSchedule(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'schedules', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `schedules/${id}`);
    throw err;
  }
}

export async function editSchedule(schedule: WorshipSchedule): Promise<void> {
  try {
    const docRef = doc(db, 'schedules', schedule.id);
    const payload = {
      ...schedule,
      createdBy: schedule.createdBy || getCurrentUsername()
    };
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `schedules/${schedule.id}`);
    throw err;
  }
}

// --- COMMITTEES SERVICE ---
export async function fetchCommittees(): Promise<Committee[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'committees'));
    const list: (Committee & { createdBy?: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        namaKepanitiaan: data.namaKepanitiaan,
        deskripsi: data.deskripsi || '',
        tanggalDibentuk: data.tanggalDibentuk,
        status: data.status || 'Aktif',
        anggotaList: data.anggotaList || [],
        createdBy: data.createdBy || 'gloria'
      });
    });

    const activeUser = getCurrentUsername();
    const filtered = list.filter(c => c.createdBy.toLowerCase() === activeUser.toLowerCase());

    if (filtered.length === 0) {
      const batch = writeBatch(db);
      const seeded: (Committee & { createdBy: string })[] = initialCommittees.map(c => ({
        ...c,
        id: uuidv4(),
        createdBy: activeUser
      }));
      seeded.forEach(c => batch.set(doc(db, 'committees', c.id), c));
      await batch.commit();
      return seeded;
    }

    return filtered;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'committees');
    throw err;
  }
}

export async function addCommittee(committee: Omit<Committee, 'id'> & { id?: string }): Promise<Committee> {
  try {
    const id = committee.id || uuidv4();
    const docRef = doc(db, 'committees', id);
    const newCommittee: Committee = {
      ...committee,
      id,
      createdBy: getCurrentUsername()
    };
    await setDoc(docRef, newCommittee);
    return newCommittee;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'committees');
    throw err;
  }
}

export async function deleteCommittee(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'committees', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `committees/${id}`);
    throw err;
  }
}

export async function editCommittee(committee: Committee): Promise<void> {
  try {
    const docRef = doc(db, 'committees', committee.id);
    const payload = {
      ...committee,
      createdBy: committee.createdBy || getCurrentUsername()
    };
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `committees/${committee.id}`);
    throw err;
  }
}

// --- BUDGETS SERVICE ---
export async function fetchBudgets(): Promise<BudgetItem[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'budgets'));
    const list: (BudgetItem & { createdBy?: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        nama: data.nama,
        kategori: data.kategori,
        alokasi: Number(data.alokasi) || 0,
        terpakai: Number(data.terpakai) || 0,
        keterangan: data.keterangan || '',
        createdBy: data.createdBy || 'gloria'
      });
    });

    const activeUser = getCurrentUsername();
    const filtered = list.filter(b => b.createdBy.toLowerCase() === activeUser.toLowerCase());

    if (filtered.length === 0) {
      // Seed initial budgets for the current user in Firestore automatically
      const batch = writeBatch(db);
      const initialBudgetsList: BudgetItem[] = [
        { id: 'b1', nama: 'Program Sosial Yayasan & Paket Sembako', kategori: 'Program Sosial', alokasi: 25000000, terpakai: 12500000, keterangan: 'Anggaran santunan sembako untuk yatim piatu dan jompo' },
        { id: 'b2', nama: 'Operasional Kantor Yayasan', kategori: 'Operasional', alokasi: 20000000, terpakai: 18450000, keterangan: 'Biaya utilitas bulanan kantor sekretariat yayasan' },
        { id: 'b3', nama: 'Bantuan Beasiswa Anak Asuh', kategori: 'Beasiswa Pendidikan', alokasi: 15000000, terpakai: 6000000, keterangan: 'Santunan beasiswa anak asuh bekerjasama dengan sekolah Mitra' },
        { id: 'b4', nama: 'Kegiatan Persekutuan & Komsel', kategori: 'Edukasi Karakter', alokasi: 7000000, terpakai: 4200000, keterangan: 'Bahan cetak materi Komsel dan katering pembinaan leader' },
      ];
      const seeded: BudgetItem[] = initialBudgetsList.map(b => ({
        ...b,
        id: uuidv4(),
        createdBy: activeUser
      }));
      for (const b of seeded) {
        const docRef = doc(db, 'budgets', b.id);
        batch.set(docRef, b);
      }
      await batch.commit();
      return seeded;
    }
    return filtered;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'budgets');
    return [];
  }
}

export async function addBudget(budget: Omit<BudgetItem, 'id'> & { id?: string }): Promise<BudgetItem> {
  try {
    const id = budget.id || uuidv4();
    const docRef = doc(db, 'budgets', id);
    const newBudget: BudgetItem = {
      ...budget,
      id,
      createdBy: getCurrentUsername()
    };
    await setDoc(docRef, newBudget);
    return newBudget;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'budgets');
    throw err;
  }
}

export async function deleteBudget(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'budgets', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `budgets/${id}`);
    throw err;
  }
}

export async function editBudget(budget: BudgetItem): Promise<void> {
  try {
    const docRef = doc(db, 'budgets', budget.id);
    const payload = {
      ...budget,
      createdBy: budget.createdBy || getCurrentUsername()
    };
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `budgets/${budget.id}`);
    throw err;
  }
}

export async function resetDatabase(
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>,
  setTransactions: React.Dispatch<React.SetStateAction<TransactionType[]>>,
  setAssets: React.Dispatch<React.SetStateAction<ChurchAsset[]>>,
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>,
  setSchedules: React.Dispatch<React.SetStateAction<WorshipSchedule[]>>,
  setCommittees?: React.Dispatch<React.SetStateAction<Committee[]>>,
  setBudgets?: React.Dispatch<React.SetStateAction<BudgetItem[]>>,
  setBulletins?: React.Dispatch<React.SetStateAction<Bulletin[]>>
) {
  const username = getCurrentUsername();
  const collectionsToReset = ['members', 'transactions', 'assets', 'bills', 'schedules', 'committees', 'budgets', 'bulletins'];
  
  for (const collName of collectionsToReset) {
    try {
      const querySnapshot = await getDocs(collection(db, collName));
      const batch = writeBatch(db);
      let count = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if ((data.createdBy || 'gloria') === username) {
          batch.delete(doc.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, collName);
    }
  }

  const seededMembers = initialMembers.map(m => ({ ...m, id: uuidv4(), createdBy: username }));
  const seededTransactions = initialTransactions.map(t => ({ ...t, id: uuidv4(), createdBy: username }));
  const seededAssets = initialAssets.map(a => ({ ...a, id: uuidv4(), createdBy: username }));
  const seededBills = initialBills.map(b => ({ ...b, id: uuidv4(), createdBy: username }));
  const seededSchedules = initialSchedules.map(s => ({ ...s, id: uuidv4(), createdBy: username }));
  const seededCommittees = initialCommittees.map(c => ({ ...c, id: uuidv4(), createdBy: username }));
  const initialBudgetsList: BudgetItem[] = [
    { id: 'b1', nama: 'Program Sosial Yayasan & Paket Sembako', kategori: 'Program Sosial', alokasi: 25000000, terpakai: 12500000, keterangan: 'Anggaran santunan sembako untuk yatim piatu dan jompo' },
    { id: 'b2', nama: 'Operasional Kantor Yayasan', kategori: 'Operasional', alokasi: 20000000, terpakai: 18450000, keterangan: 'Biaya utilitas bulanan kantor sekretariat yayasan' },
    { id: 'b3', nama: 'Bantuan Beasiswa Anak Asuh', kategori: 'Beasiswa Pendidikan', alokasi: 15000000, terpakai: 6000000, keterangan: 'Santunan beasiswa anak asuh bekerjasama dengan sekolah Mitra' },
    { id: 'b4', nama: 'Kegiatan Persekutuan & Komsel', kategori: 'Edukasi Karakter', alokasi: 7000000, terpakai: 4200000, keterangan: 'Bahan cetak materi Komsel dan katering pembinaan leader' },
  ];
  const seededBudgets = initialBudgetsList.map(b => ({ ...b, id: uuidv4(), createdBy: username }));

  const sampleBulletin: Bulletin = {
    id: uuidv4(),
    bulan: 'Juni 2026',
    judul: 'Buletin Gloria Jemaat Center - Edisi Awal Juni 2026',
    tanggalRilis: '2026-06-01',
    temaMingguan: 'Melayani dengan Hati yang Tulus dan Gembira',
    ringkasanKhotba: 'Khotbah minggu ini diambil dari Kolose 3:23-24. Rasul Paulus menasihati jemaat agar melakukan segala sesuatu seperti untuk Tuhan dan bukan untuk manusia. Layanan kita di dalam gereja maupun di masyarakat harus berpusatkan pada Kristus.',
    wartaJemaat: '1. Kelas Katekisasi Baru dibuka pukul 13:00 WIB di Konsistori.\n2. Rapat Pembentukan Panitia Natal 2026 akan diadakan hari Kamis ini.\n3. Diakonia Kasih untuk keluarga sakit dikoordinasikan oleh Seksi Sosial.',
    createdBy: username
  };

  const mBatch = writeBatch(db);
  seededMembers.forEach(m => mBatch.set(doc(db, 'members', m.id), m));
  await mBatch.commit();

  const tBatch = writeBatch(db);
  seededTransactions.forEach(t => tBatch.set(doc(db, 'transactions', t.id), t));
  await tBatch.commit();

  const aBatch = writeBatch(db);
  seededAssets.forEach(a => aBatch.set(doc(db, 'assets', a.id), a));
  await aBatch.commit();

  const bBatch = writeBatch(db);
  seededBills.forEach(b => bBatch.set(doc(db, 'bills', b.id), b));
  await bBatch.commit();

  const sBatch = writeBatch(db);
  seededSchedules.forEach(s => sBatch.set(doc(db, 'schedules', s.id), s));
  await sBatch.commit();

  const cBatch = writeBatch(db);
  seededCommittees.forEach(c => cBatch.set(doc(db, 'committees', c.id), c));
  await cBatch.commit();

  const budBatch = writeBatch(db);
  seededBudgets.forEach(b => budBatch.set(doc(db, 'budgets', b.id), b));
  await budBatch.commit();

  await setDoc(doc(db, 'bulletins', sampleBulletin.id), sampleBulletin);

  setMembers(seededMembers);
  setTransactions(seededTransactions);
  setAssets(seededAssets);
  setBills(seededBills);
  setSchedules(seededSchedules);
  if (setCommittees) {
    setCommittees(seededCommittees);
  }
  if (setBudgets) {
    setBudgets(seededBudgets);
  }
  if (setBulletins) {
    setBulletins([sampleBulletin]);
  }
}

export async function purgeAllDatabaseData(
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>,
  setTransactions: React.Dispatch<React.SetStateAction<TransactionType[]>>,
  setAssets: React.Dispatch<React.SetStateAction<ChurchAsset[]>>,
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>,
  setSchedules: React.Dispatch<React.SetStateAction<WorshipSchedule[]>>,
  setCommittees?: React.Dispatch<React.SetStateAction<Committee[]>>,
  setBudgets?: React.Dispatch<React.SetStateAction<BudgetItem[]>>,
  setBulletins?: React.Dispatch<React.SetStateAction<Bulletin[]>>
) {
  const username = getCurrentUsername();
  const collectionsToReset = ['members', 'transactions', 'assets', 'bills', 'schedules', 'committees', 'budgets', 'bulletins'];
  
  for (const collName of collectionsToReset) {
    try {
      const querySnapshot = await getDocs(collection(db, collName));
      const batch = writeBatch(db);
      let count = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if ((data.createdBy || 'gloria') === username) {
          batch.delete(doc.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, collName);
    }
  }

  setMembers([]);
  setTransactions([]);
  setAssets([]);
  setBills([]);
  setSchedules([]);
  if (setCommittees) {
    setCommittees([]);
  }
  if (setBudgets) {
    setBudgets([]);
  }
  if (setBulletins) {
    setBulletins([]);
  }
}

// --- BULLETINS SERVICE ---
export async function fetchBulletins(): Promise<Bulletin[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'bulletins'));
    const list: (Bulletin & { createdBy?: string })[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        bulan: data.bulan || '',
        judul: data.judul || '',
        tanggalRilis: data.tanggalRilis || '',
        temaMingguan: data.temaMingguan || '',
        ringkasanKhotba: data.ringkasanKhotba || '',
        wartaJemaat: data.wartaJemaat || '',
        createdBy: data.createdBy || 'gloria'
      });
    });

    const activeUser = getCurrentUsername();
    const filtered = list.filter(b => b.createdBy.toLowerCase() === activeUser.toLowerCase());

    if (filtered.length === 0) {
      // Seed initial bulletins for the current user in Firestore automatically
      const activeUser = getCurrentUsername();
      const sampleId = uuidv4();
      const sampleBulletin: Bulletin = {
        id: sampleId,
        bulan: 'Juni 2026',
        judul: 'Buletin Gloria Jemaat Center - Edisi Awal Juni 2026',
        tanggalRilis: '2026-06-01',
        temaMingguan: 'Melayani dengan Hati yang Tulus dan Gembira',
        ringkasanKhotba: 'Khotbah minggu ini diambil dari Kolose 3:23-24. Rasul Paulus menasihati jemaat agar melakukan segala sesuatu seperti untuk Tuhan dan bukan untuk manusia. Layanan kita di dalam gereja maupun di masyarakat harus berpusatkan pada Kristus.',
        wartaJemaat: '1. Kelas Katekisasi Baru dibuka pukul 13:00 WIB di Konsistori.\n2. Rapat Pembentukan Panitia Natal 2026 akan diadakan hari Kamis ini.\n3. Diakonia Kasih untuk keluarga sakit dikoordinasikan oleh Seksi Sosial.',
        createdBy: activeUser
      };
      await setDoc(doc(db, 'bulletins', sampleId), sampleBulletin);
      return [sampleBulletin];
    }
    return filtered;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'bulletins');
    return [];
  }
}

export async function addBulletin(bulletin: Omit<Bulletin, 'id'> & { id?: string }): Promise<Bulletin> {
  try {
    const id = bulletin.id || uuidv4();
    const docRef = doc(db, 'bulletins', id);
    const newBulletin: Bulletin = {
      ...bulletin,
      id,
      createdBy: getCurrentUsername()
    };
    await setDoc(docRef, newBulletin);
    return newBulletin;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'bulletins');
    throw err;
  }
}

export async function editBulletin(bulletin: Bulletin): Promise<void> {
  try {
    const docRef = doc(db, 'bulletins', bulletin.id);
    const payload = {
      ...bulletin,
      createdBy: bulletin.createdBy || getCurrentUsername()
    };
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `bulletins/${bulletin.id}`);
    throw err;
  }
}

export async function deleteBulletin(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'bulletins', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `bulletins/${id}`);
    throw err;
  }
}

