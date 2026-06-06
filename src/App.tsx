import React, { useState, useEffect } from 'react';
import { Member, TransactionType, ChurchAsset, Bill, WorshipSchedule, Committee, BudgetItem } from './types';
import { 
  fetchMembers, 
  addMember, 
  editMember, 
  deleteMember,
  fetchTransactions, 
  addTransaction, 
  editTransaction,
  deleteTransaction,
  fetchAssets, 
  addAsset, 
  editAsset,
  deleteAsset,
  fetchBills, 
  addBill, 
  editBill, 
  deleteBill,
  fetchSchedules, 
  addSchedule, 
  editSchedule,
  deleteSchedule,
  fetchCommittees,
  addCommittee,
  editCommittee,
  deleteCommittee,
  fetchBudgets,
  addBudget,
  editBudget,
  deleteBudget,
  resetDatabase,
  purgeAllDatabaseData,
  fetchUsers,
  registerUser
} from './services/db';

// Component Imports
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import KeanggotaanView from './components/KeanggotaanView';
import TransaksiView from './components/TransaksiView';
import TataIbadahView from './components/TataIbadahView';
import ManajemenAsetView from './components/ManajemenAsetView';
import LaporanView from './components/LaporanView';
import DaftarBillView from './components/DaftarBillView';
import KepanitiaanView from './components/KepanitiaanView';
import BudgetingView from './components/BudgetingView';
import BuletinBulananView from './components/BuletinBulananView';

import { 
  ShieldAlert, 
  Unlock, 
  CheckCircle, 
  Settings, 
  Info, 
  CloudAlert, 
  Compass,
  MapPin,
  Flame,
  Award,
  Loader2,
  AlertTriangle,
  Printer
} from 'lucide-react';

export default function App() {
  // Current tab state routing
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core App states loaded from Cloud Firestore
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [assets, setAssets] = useState<ChurchAsset[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [schedules, setSchedules] = useState<WorshipSchedule[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);

  // Security Credentials
  const [password, setPassword] = useState<string>(() => {
    return localStorage.getItem('egereja_admin_password') || 'gloria123';
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('egereja_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      id: 'gloria',
      username: 'gloria',
      nama: 'gloria',
      role: 'Administrator Kantor'
    };
  });

  // UI state overlays
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetType, setResetType] = useState<'seed' | 'purge' | null>(null);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; success: boolean } | null>(null);

  const [isLocked, setIsLocked] = useState<boolean>(() => !localStorage.getItem('egereja_current_user'));
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login');
  
  // Login input states
  const [loginUsername, setLoginUsername] = useState('gloria');
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register input states
  const [signupNama, setSignupNama] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Administrator Kantor');

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initial load effect
  useEffect(() => {
    let active = true;
    async function loadAllData() {
      setIsLoading(true);
      try {
        const [loadedMembers, loadedTransactions, loadedAssets, loadedBills, loadedSchedules, loadedCommittees, loadedBudgets] = await Promise.all([
          fetchMembers(),
          fetchTransactions(),
          fetchAssets(),
          fetchBills(),
          fetchSchedules(),
          fetchCommittees(),
          fetchBudgets()
        ]);
        if (active) {
          setMembers(loadedMembers);
          setTransactions(loadedTransactions);
          setAssets(loadedAssets);
          setBills(loadedBills);
          setSchedules(loadedSchedules);
          setCommittees(loadedCommittees);
          setBudgets(loadedBudgets);
        }
      } catch (error) {
        console.error("Gagal memuat data dari Cloud Firestore:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    if (currentUser) {
      loadAllData();
    } else {
      setMembers([]);
      setTransactions([]);
      setAssets([]);
      setBills([]);
      setSchedules([]);
      setCommittees([]);
      setBudgets([]);
      setIsLoading(false);
    }
    return () => { active = false; };
  }, [currentUser, refreshTrigger]);

  // Handle addition & edits
  const handleAddMember = async (newMem: Omit<Member, 'id'>) => {
    try {
      const added = await addMember(newMem);
      setMembers(prev => [added, ...prev]);
    } catch (err) {
      alert('Gagal menambah anggota ke database Cloud Firestore!');
    }
  };

  const handleEditMember = async (updated: Member) => {
    try {
      await editMember(updated);
      setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      alert('Gagal menyimpan perubahan anggota di database!');
    }
  };

  const handleDeleteMember = async (id: string) => {
    console.log(`[App.tsx] Memulai handleDeleteMember untuk ID: ${id}`);
    try {
      await deleteMember(id);
      console.log(`[App.tsx] sukses deleteMember untuk ID: ${id}`);
      setMembers(prev => {
        const after = prev.filter(m => m.id !== id);
        console.log(`[App.tsx] State members diperbarui. Sebelum: ${prev.length}, Sesudah: ${after.length}`);
        return after;
      });
    } catch (err) {
      console.error(`[App.tsx] Error di handleDeleteMember untuk ID: ${id}`, err);
      alert(`Gagal menghapus anggota dari database! Detail: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleAddTransaction = async (newTrx: Omit<TransactionType, 'id'>) => {
    try {
      const added = await addTransaction(newTrx);
      setTransactions(prev => [added, ...prev]);

      // Real-time integration of Budget item updates
      if (newTrx.anggaranId) {
        const linkedBudget = budgets.find(b => b.id === newTrx.anggaranId);
        if (linkedBudget) {
          // If transaction is spending (Pengeluaran), adjust the budget spent field
          const isExpense = newTrx.amount < 0 || newTrx.keterangan?.toLowerCase().includes('pengeluaran') || newTrx.category?.toLowerCase().includes('pengeluaran');
          const diff = isExpense ? Math.abs(newTrx.amount) : 0;
          if (diff > 0) {
            const updatedBudget = { ...linkedBudget, terpakai: linkedBudget.terpakai + diff };
            await editBudget(updatedBudget);
            setBudgets(prev => prev.map(b => b.id === linkedBudget.id ? updatedBudget : b));
          }
        }
      }
    } catch (err) {
      alert('Gagal menyimpan transaksi ke database!');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    console.log(`[App.tsx] Memulai handleDeleteTransaction untuk ID: ${id}`);
    try {
      await deleteTransaction(id);
      console.log(`[App.tsx] Sukses deleteTransaction untuk ID: ${id}`);
      setTransactions(prev => {
        const after = prev.filter(t => t.id !== id);
        console.log(`[App.tsx] State transactions diperbarui. Sebelum: ${prev.length}, Sesudah: ${after.length}`);
        return after;
      });
    } catch (err) {
      console.error(`[App.tsx] Error di handleDeleteTransaction untuk ID: ${id}`, err);
      alert(`Gagal menghapus transaksi dari database! Detail: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEditTransaction = async (updated: TransactionType) => {
    try {
      await editTransaction(updated);
      setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (err) {
      alert('Gagal mendata perubahan transaksi!');
    }
  };

  const handleAddAsset = async (newAss: Omit<ChurchAsset, 'id'>) => {
    try {
      const added = await addAsset(newAss);
      setAssets(prev => [added, ...prev]);
    } catch (err) {
      alert('Gagal menambah aset inventaris!');
    }
  };

  const handleEditAsset = async (updated: ChurchAsset) => {
    try {
      await editAsset(updated);
      setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch (err) {
      alert('Gagal menyimpan perubahan aset inventaris!');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    console.log(`[App.tsx] Memulai handleDeleteAsset untuk ID: ${id}`);
    try {
      await deleteAsset(id);
      console.log(`[App.tsx] Sukses deleteAsset untuk ID: ${id}`);
      setAssets(prev => {
        const after = prev.filter(a => a.id !== id);
        console.log(`[App.tsx] State assets diperbarui. Sebelum: ${prev.length}, Sesudah: ${after.length}`);
        return after;
      });
    } catch (err) {
      console.error(`[App.tsx] Error di handleDeleteAsset untuk ID: ${id}`, err);
      alert(`Gagal menghapus aset dari database! Detail: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleAddBill = async (newB: Omit<Bill, 'id'>) => {
    try {
      const added = await addBill(newB);
      setBills(prev => [added, ...prev]);
    } catch (err) {
      alert('Gagal menambah data tagihan!');
    }
  };

  const handleEditBill = async (updated: Bill) => {
    try {
      await editBill(updated);
      setBills(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch (err) {
      alert('Gagal menyimpan perubahan lembar tagihan!');
    }
  };

  const handleToggleBillStatus = async (id: string) => {
    const found = bills.find(b => b.id === id);
    if (!found) return;
    const updatedStatus = found.status === 'Lunas' ? 'Belum Lunas' : 'Lunas';
    const updatedBill: Bill = { ...found, status: updatedStatus };
    try {
      await editBill(updatedBill);
      setBills(prev => prev.map(b => b.id === id ? updatedBill : b));
    } catch (err) {
      alert('Gagal mengganti status pembayaran tagihan!');
    }
  };

  const handleDeleteBill = async (id: string) => {
    console.log(`[App.tsx] Memulai handleDeleteBill untuk ID: ${id}`);
    try {
      await deleteBill(id);
      console.log(`[App.tsx] Sukses deleteBill untuk ID: ${id}`);
      setBills(prev => {
        const after = prev.filter(b => b.id !== id);
        console.log(`[App.tsx] State bills diperbarui. Sebelum: ${prev.length}, Sesudah: ${after.length}`);
        return after;
      });
    } catch (err) {
      console.error(`[App.tsx] Error di handleDeleteBill untuk ID: ${id}`, err);
      alert(`Gagal menghapus tagihan! Detail: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleAddSchedule = async (newSch: Omit<WorshipSchedule, 'id'>) => {
    try {
      const added = await addSchedule(newSch);
      setSchedules(prev => [added, ...prev]);
    } catch (err) {
      alert('Gagal mendaftarkan jadwal ke database!');
    }
  };

  const handleEditSchedule = async (updated: WorshipSchedule) => {
    try {
      await editSchedule(updated);
      setSchedules(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err) {
      alert('Gagal menyimpan perubahan roster pelayanan!');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    console.log(`[App.tsx] Memulai handleDeleteSchedule untuk ID: ${id}`);
    try {
      await deleteSchedule(id);
      console.log(`[App.tsx] Sukses deleteSchedule untuk ID: ${id}`);
      setSchedules(prev => {
        const after = prev.filter(s => s.id !== id);
        console.log(`[App.tsx] State schedules diperbarui. Sebelum: ${prev.length}, Sesudah: ${after.length}`);
        return after;
      });
    } catch (err) {
      console.error(`[App.tsx] Error di handleDeleteSchedule untuk ID: ${id}`, err);
      alert(`Gagal menghapus jadwal ibadah! Detail: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleAddCommittee = async (newComm: Omit<Committee, 'id'>) => {
    try {
      const added = await addCommittee(newComm);
      setCommittees(prev => [added, ...prev]);
    } catch (err) {
      alert('Gagal mendata kepanitiaan baru!');
    }
  };

  const handleEditCommittee = async (updated: Committee) => {
    try {
      await editCommittee(updated);
      setCommittees(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err) {
      alert('Gagal mengedit data kepanitiaan!');
    }
  };

  const handleDeleteCommittee = async (id: string) => {
    try {
      await deleteCommittee(id);
      setCommittees(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Gagal menghapus kepanitiaan!');
    }
  };

  // Handle password modification for both default and custom users
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      if (currentUser.username === 'gloria') {
        if (oldPasswordInput !== password) {
          setPasswordMessage({ text: 'Kata sandi lama salah!', success: false });
          return;
        }
        if (newPasswordInput.length < 4) {
          setPasswordMessage({ text: 'Kata sandi baru minimal 4 karakter!', success: false });
          return;
        }
        setPassword(newPasswordInput);
        localStorage.setItem('egereja_admin_password', newPasswordInput);
      } else {
        if (oldPasswordInput !== currentUser.password) {
          setPasswordMessage({ text: 'Kata sandi lama salah!', success: false });
          return;
        }
        if (newPasswordInput.length < 4) {
          setPasswordMessage({ text: 'Kata sandi baru minimal 4 karakter!', success: false });
          return;
        }
        // Update user password in Firestore & LocalState
        const updatedUser = { ...currentUser, password: newPasswordInput };
        await registerUser(updatedUser);
        localStorage.setItem('egereja_current_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }

      setPasswordMessage({ text: 'Kata sandi berhasil diubah!', success: true });
      setOldPasswordInput('');
      setNewPasswordInput('');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordMessage(null);
      }, 1500);
    } catch (_) {
      setPasswordMessage({ text: 'Gagal memperbarui di database cloud!', success: false });
    }
  };

  // Locks the administrator session
  const handleLockSession = () => {
    localStorage.removeItem('egereja_current_user');
    setIsLocked(true);
    setLoginInput('');
    setLoginError('');
    setCurrentUser(null);
  };

  // Factory reset to initial settings for active user only
  const handleResetData = async () => {
    setIsLoading(true);
    try {
      await resetDatabase(setMembers, setTransactions, setAssets, setBills, setSchedules, setCommittees);
      if (currentUser?.username === 'gloria') {
        setPassword('gloria123');
        localStorage.setItem('egereja_admin_password', 'gloria123');
      }
      alert('Database Cloud Firestore berhasil di-reset ke data awal khusus untuk akun Anda!');
    } catch (err) {
      alert('Gagal mereset database online!');
    } finally {
      setIsLoading(false);
    }
  };

  // Completely empty all custom data and budgeting info
  const handlePurgeData = async () => {
    setIsLoading(true);
    try {
      await purgeAllDatabaseData(setMembers, setTransactions, setAssets, setBills, setSchedules, setCommittees);
      localStorage.removeItem('e_gereja_budgets');
      alert('Semua data Anda di database Cloud Firestore & LocalStorage budgeting berhasil dihapus bersih (Mulai dari Nol)!');
    } catch (err) {
      alert('Gagal mengosongkan database!');
    } finally {
      setIsLoading(false);
    }
  };

  // Render correct panel according to view state
  const renderContentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView members={members} transactions={transactions} onNavigateToView={setCurrentView} />;
      
      case 'keanggotaan':
        return (
          <KeanggotaanView 
            members={members} 
            onAddMember={handleAddMember} 
            onEditMember={handleEditMember} 
            onDeleteMember={handleDeleteMember} 
          />
        );
      
      case 'add-member':
        return (
          <KeanggotaanView 
            members={members} 
            onAddMember={handleAddMember} 
            onEditMember={handleEditMember} 
            onDeleteMember={handleDeleteMember} 
            initialFormOpen={true}
          />
        );

      case 'transaksi':
        return (
          <TransaksiView 
            transactions={transactions} 
            budgets={budgets}
            onAddTransaction={handleAddTransaction} 
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction} 
          />
        );
      
      case 'add-transaction':
        return (
          <TransaksiView 
            transactions={transactions} 
            budgets={budgets}
            onAddTransaction={handleAddTransaction} 
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction} 
            initialFormOpen={true}
          />
        );

      case 'tata-ibadah':
        return (
          <TataIbadahView 
            schedules={schedules} 
            members={members}
            budgets={budgets}
            onAddSchedule={handleAddSchedule} 
            onEditSchedule={handleEditSchedule}
            onDeleteSchedule={handleDeleteSchedule} 
            onAddTransaction={handleAddTransaction}
          />
        );

      case 'buletin-bulanan':
        return (
          <BuletinBulananView 
            members={members} 
          />
        );

      case 'manajemen-aset':
        return (
          <ManajemenAsetView 
            assets={assets} 
            onAddAsset={handleAddAsset} 
            onEditAsset={handleEditAsset}
            onDeleteAsset={handleDeleteAsset} 
          />
        );

      case 'laporan':
        return <LaporanView transactions={transactions} />;

      case 'daftar-bill':
        return (
          <DaftarBillView 
            bills={bills} 
            onAddBill={handleAddBill} 
            onEditBill={handleEditBill}
            onToggleBillStatus={handleToggleBillStatus} 
            onDeleteBill={handleDeleteBill} 
          />
        );

      case 'change-password':
        return (
          <div className="flex-1 p-6 bg-white overflow-y-auto">
            <div className="max-w-md mx-auto border border-slate-200 rounded p-6 bg-slate-50 mt-8 shadow-xs">
              <h2 className="text-sm font-bold text-slate-850 flex items-center justify-gap mb-4 border-b border-slate-200 pb-2.5">
                Keamanan: Ganti Kata Sandi Sesi
              </h2>
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Kata Sandi Lama *
                  </label>
                  <input
                    id="page-old-pass"
                    type="password"
                    required
                    placeholder="Ketik kata sandi saat ini..."
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3c9ecc] focus:outline-hidden font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Kata Sandi Baru *
                  </label>
                  <input
                    id="page-new-pass"
                    type="password"
                    required
                    placeholder="Ketik kata sandi yang baru..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3c9ecc] focus:outline-hidden font-mono bg-white"
                  />
                </div>

                {passwordMessage && (
                  <div className={`p-2 rounded text-[11px] font-semibold text-center ${
                    passwordMessage.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2 text-xs">
                  <button
                    id="page-save-pass"
                    type="submit"
                    className="w-full bg-[#eca83c] hover:bg-[#de9729] text-white py-2 rounded font-bold transition-colors cursor-pointer text-center"
                  >
                    Simpan Kata Sandi Baru
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'budget-plan':
      case 'budgeting':
        return (
          <BudgetingView budgets={budgets} setBudgets={setBudgets} />
        );

      case 'kepanitiaan':
        return (
          <KepanitiaanView 
            committees={committees} 
            onAddCommittee={handleAddCommittee} 
            onEditCommittee={handleEditCommittee} 
            onDeleteCommittee={handleDeleteCommittee} 
          />
        );

      case 'sektor-list':
      case 'kategori-persembahan':
      case 'data-master':
        return (
          <div className="flex-1 p-6 bg-white overflow-y-auto print:p-0">
            {/* Printed Header Banner */}
            <div className="hidden print:block text-center border-b-2 border-slate-850 pb-4 mb-6">
              <h1 className="text-2xl font-serif font-black tracking-tight uppercase">STRUKTUR WILAYAH DATA MASTER (e-GEREJA)</h1>
              <p className="text-xs font-semibold text-slate-700">Gereja Gloria Jemaat Center &bull; Enterprise Logistik Sistem</p>
              <p className="text-[10px] text-slate-500 mt-1">Dicetak pada tanggal: 2026-06-04</p>
            </div>

            {/* Title with Print Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
              <div>
                <h1 className="text-2xl font-bold font-sans text-slate-800 tracking-tight flex items-center gap-2">
                  <span>Data Master &amp; Sektor Pelayanan</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Pengaturan data master wilayah jemaat, status keaktifan jemaat per sektor, dan kategori kas sinode.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3.5 rounded text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak / Ekspor PDF</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded p-6 bg-slate-50/75 max-w-3xl">
              <h2 className="text-base font-bold text-slate-800">Struktur Wilayah Pelayanan Aktif</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">Berikut rincian statistik ringkas wilayah pelayanan aktif saat ini:</p>
              
              <div className="space-y-3 text-xs text-slate-700 font-medium">
                <div className="p-2.5 bg-white border border-slate-200 rounded flex justify-between items-center">
                  <span>Sektor I - Baitel (Wilayah Timur)</span>
                  <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">9 Anggota Aktif</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded flex justify-between items-center">
                  <span>Sektor II - Efrata (Wilayah Barat)</span>
                  <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">14 Anggota Aktif</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded flex justify-between items-center">
                  <span>Sektor III - Gideon (Wilayah Selatan)</span>
                  <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px]">11 Anggota Aktif</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded flex justify-between items-center">
                  <span>Sektor IV - Sion (Wilayah Utara)</span>
                  <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px]">8 Anggota Aktif</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'system-info':
      case 'sistem-utility':
      default:
        return (
          <div className="flex-1 p-6 bg-white space-y-6">
            <div className="border border-slate-200 rounded p-5 bg-slate-50 max-w-2xl">
              <h2 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#3875d7]" />
                Sistem Utility Terintegrasi
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">Utilisasi backend database, sinkronisasi kunci akses, dan instrumen operasional.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-rose-200 bg-rose-50/20 p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pilihan A: Reset ke Data Contoh (Demo)</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Menghapus data kustom Anda dan mengisi kembali database dengan data simulasi jemaat/transaksi standar gereja (seeded data).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setResetType('seed');
                      setIsResetConfirmOpen(true);
                    }}
                    className="mt-3 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded transition-colors cursor-pointer self-start"
                  >
                    Reset &amp; Isi Data Contoh
                  </button>
                </div>

                <div className="border border-red-300 bg-red-50/20 p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-red-800 uppercase tracking-wide">Pilihan B: Kosongkan Semua Data (Mulai Nol)</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Menghapus permanen seluruh data Anda dari database online Cloud Firestore dan local storage budgeting. Database akan benar-benar kosong total.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setResetType('purge');
                      setIsResetConfirmOpen(true);
                    }}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-3.5 rounded transition-colors cursor-pointer self-start"
                  >
                    Kosongkan Semua Data Bersih
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-sky-100 bg-sky-50/50 rounded p-5 max-w-2xl">
              <h3 className="text-xs font-bold text-sky-850 flex items-center gap-1.5 uppercase tracking-wide">
                <Info className="w-4 h-4 text-sky-600" />
                Informasi Server Aplikasi
              </h3>
              <div className="mt-3 text-xs text-slate-700 space-y-1 font-mono font-semibold">
                <div>Versi Rilis: <span className="text-slate-900">e-Gereja Enterprise Client 4.2.0</span></div>
                <div>Runtime Ingress: <span className="text-slate-900">Cloud Run Sandboxed Container</span></div>
                <div>Database Penyimpanan: <span className="text-sky-600 font-bold">Google Cloud Firestore (Enterprise Engine)</span></div>
                <div>Server Zone: <span className="text-slate-900">tokyo-ap-northeast1 (98% Uptime)</span></div>
              </div>
            </div>
          </div>
        );
    }
  };

  // Loading Database Overlay
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4">
        <div className="max-w-m w-full text-center space-y-4 flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-sky-450 animate-spin" />
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Sinkronisasi Database e-Gereja...</h2>
          <p className="text-xs text-slate-400 max-w-sm">
            Menghubungkan ke infrastruktur durabel Cloud Firestore dan menyinkronkan data jemaat &amp; keuangan.
          </p>
        </div>
      </div>
    );
  }

  // Locked Gate Overlay with Dynamic Login/Register Dialog
  if (isLocked) {
    const handleUnlockSubmitInternal = async (e: React.FormEvent) => {
      e.preventDefault();
      const uName = loginUsername.trim().toLowerCase();
      if (!uName) return alert('Username wajib diisi!');
      if (!loginInput) return alert('Kata sandi wajib diisi!');

      setIsLoading(true);
      try {
        // Fallback for default gloria
        if (uName === 'gloria' && loginInput === password) {
          const gloriaUser = {
            id: 'gloria',
            username: 'gloria',
            nama: 'Gloria',
            role: 'Administrator Kantor'
          };
          localStorage.setItem('egereja_current_user', JSON.stringify(gloriaUser));
          setCurrentUser(gloriaUser);
          setIsLocked(false);
          setLoginError('');
          return;
        }

        const users = await fetchUsers();
        const found = users.find(u => u.username.toLowerCase() === uName && u.password === loginInput);
        if (found) {
          localStorage.setItem('egereja_current_user', JSON.stringify(found));
          setCurrentUser(found);
          setIsLocked(false);
          setLoginError('');
        } else {
          setLoginError('Sandi atau Username tidak sesuai. Silakan hubungi Sinode.');
        }
      } catch (err) {
        setLoginError('Koneksi terganggu. Gagal memvalidasi user.');
      } finally {
        setIsLoading(false);
      }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const uName = signupUsername.trim().toLowerCase();
      const uNama = signupNama.trim();
      const uPass = signupPassword;

      if (!uNama) return alert('Nama Lengkap wajib diisi!');
      if (!uName) return alert('Username wajib diisi!');
      if (uPass.length < 4) return alert('Kata sandi minimal 4 karakter!');

      setIsLoading(true);
      try {
        // Prevent registering as existing 'gloria' fallback
        if (uName === 'gloria') {
          alert('Username "gloria" adalah cadangan sistem default.');
          setIsLoading(false);
          return;
        }

        const users = await fetchUsers();
        if (users.some(u => u.username.toLowerCase() === uName)) {
          alert('Username ini sudah terdaftar! Gunakan username lain.');
          setIsLoading(false);
          return;
        }

        const newUser = {
          id: uName,
          username: uName,
          password: uPass,
          nama: uNama,
          role: signupRole
        };

        await registerUser(newUser); // Automatically seeds template data in Firestore with createdBy = uName
        localStorage.setItem('egereja_current_user', JSON.stringify(newUser));
        setCurrentUser(newUser);
        setIsLocked(false);
        alert('Daftar user baru berhasil! Sesi telah di-seed dengan data template kustom.');
      } catch (err) {
        alert('Gagal mendaftarkan user baru. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-4 font-sans select-none antialiased">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-6 rounded-md shadow-xl">
          <div className="text-center mb-5">
            <ShieldAlert className="w-10 h-10 text-[#eca83c] mx-auto mb-2 animate-bounce" />
            <h2 className="text-md font-bold tracking-tight text-slate-100 uppercase">Gerbang Sesi e-Gereja</h2>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              Sistem Otentikasi Terenkripsi Sinode &amp; Administrasi Jemaat. Silakan masuk atau daftarkan akun baru Anda.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 mb-5 bg-slate-850 p-1 rounded-sm border border-slate-700">
            <button
              onClick={() => { setLoginTab('login'); setLoginError(''); }}
              className={`py-1.5 text-xs font-bold rounded-sm transition-all cursor-pointer ${
                loginTab === 'login' 
                  ? 'bg-[#4abdd5] text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Masuk Sesi
            </button>
            <button
              onClick={() => { setLoginTab('register'); setLoginError(''); }}
              className={`py-1.5 text-xs font-bold rounded-sm transition-all cursor-pointer ${
                loginTab === 'register' 
                  ? 'bg-[#eca83c] text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daftar User Baru
            </button>
          </div>

          {loginTab === 'login' ? (
            <form onSubmit={handleUnlockSubmitInternal} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Username Kasir / Admin</label>
                <input
                  id="login-username-input"
                  type="text"
                  required
                  placeholder="Ketik username Anda (cth: gloria)..."
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-slate-750 border border-slate-650 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#3fc1c9] focus:outline-hidden text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Kata Sandi Rahasia</label>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  placeholder="Ketik kata sandi Anda..."
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="w-full bg-slate-750 border border-slate-650 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#3fc1c9] focus:outline-hidden text-white font-mono"
                />
              </div>

              {loginError && <p className="text-[11px] text-rose-400 font-bold text-center bg-rose-950/45 p-1.5 rounded border border-rose-900/50">{loginError}</p>}

              <button
                id="login-submit-button"
                type="submit"
                className="w-full bg-[#4abdd5] hover:bg-[#34aac2] text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <Unlock className="w-4 h-4" />
                <span>Buka Gembok Sesi</span>
              </button>
              
              <p className="text-[10px] text-slate-500 text-center mt-2">
                User default login: <span className="font-mono bg-slate-700 px-1 py-0.5 rounded text-white font-bold">gloria</span> sandi: <span className="font-mono bg-slate-700 px-1 py-0.5 rounded text-white font-bold">{password}</span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Nama Lengkap Jemaat / Admin</label>
                <input
                  id="signup-nama-input"
                  type="text"
                  required
                  placeholder="Ketik nama lengkap Anda..."
                  value={signupNama}
                  onChange={(e) => setSignupNama(e.target.value)}
                  className="w-full bg-slate-750 border border-slate-650 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#e3ab47] focus:outline-hidden text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Username Unik (Tanpa Spasi)</label>
                <input
                  id="signup-username-input"
                  type="text"
                  required
                  placeholder="Ketik username baru Anda..."
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  className="w-full bg-slate-750 border border-slate-650 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#e3ab47] focus:outline-hidden text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Kata Sandi Baru</label>
                <input
                  id="signup-password-input"
                  type="password"
                  required
                  placeholder="Minimal 4 karakter..."
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full bg-slate-750 border border-slate-650 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#e3ab47] focus:outline-hidden text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Jabatan / Otoritas Sektor</label>
                <select
                  id="signup-role-input"
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  className="w-full bg-slate-750 border border-slate-650 rounded px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#e3ab47] focus:outline-hidden text-white cursor-pointer"
                >
                  <option value="Administrator Kantor">Administrator Kantor</option>
                  <option value="Majelis Jemaat">Majelis Jemaat</option>
                  <option value="Seksi Keuangan Sektor">Seksi Keuangan Sektor</option>
                  <option value="Seksi Ibadah Kebaktian">Seksi Ibadah Kebaktian</option>
                </select>
              </div>

              <button
                id="signup-submit-button"
                type="submit"
                className="w-full bg-[#eca83c] hover:bg-[#de9729] text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Daftarkan Akun Baru &amp; Seed Template</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f7] flex flex-col font-sans select-none antialiased">
      {/* Top Navbar */}
      <Header onCetakLaporan={() => {
        setCurrentView('laporan');
        setTimeout(() => {
          window.print();
        }, 350);
      }} />

      {/* Primary body layout structure */}
      <div className="flex flex-1">
        
        {/* Left Side menu column */}
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onLogout={handleLockSession}
          currentUser={currentUser}
        />

        {/* Core changing panel of routing views */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative" id="main-content-view">
          {renderContentView()}
        </main>

      </div>

      {/* CHANGE PASSWORD MODAL DIALOG OVERLAY */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded border border-slate-200 max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
              <span>Keamanan: Ganti Kata Sandi</span>
            </h3>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Kata Sandi Lama *
                </label>
                <input
                  id="modal-old-pass"
                  type="password"
                  required
                  placeholder="Ketik kata sandi saat ini..."
                  value={oldPasswordInput}
                  onChange={(e) => setOldPasswordInput(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Kata Sandi Baru *
                </label>
                <input
                  id="modal-new-pass"
                  type="password"
                  required
                  placeholder="Ketik kata sandi yang baru..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#3875d7] focus:outline-hidden font-mono"
                />
              </div>

              {passwordMessage && (
                <div className={`p-2 rounded text-[11px] font-semibold text-center ${
                  passwordMessage.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-1.5 rounded font-bold transition-colors cursor-pointer"
                >
                  Tutup Batal
                </button>
                <button
                  id="modal-save-pass"
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded font-bold transition-colors cursor-pointer"
                >
                  Simpan Rahasiakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM FACTORY RESET CUSTOM CONFIRMATION DIALOG MODAL */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-sm w-full shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 rounded-full text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950 font-sans tracking-tight">
                  {resetType === 'purge' ? 'Konfirmasi Kosongkan Database' : 'Konfirmasi Setel Ulang Pabrik'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {resetType === 'purge' 
                    ? 'Apakah Anda yakin ingin menghapus BERSIH seluruh data jemaat, transaksi, aset, tagihan, jadwal, kepanitiaan, dan anggaran belanja dari Cloud Firestore & LocalStorage? Tindakan ini tidak dapat dibatalkan.' 
                    : 'Apakah Anda yakin ingin menyetel ulang database ke data contoh bawaan? Seluruh data kustom Anda saat ini akan ditimpa dengan data jemaat & transaksi sample awal.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  setResetType(null);
                }}
                className="px-3 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (resetType === 'purge') {
                    handlePurgeData();
                  } else {
                    handleResetData();
                  }
                  setIsResetConfirmOpen(false);
                  setResetType(null);
                }}
                className={`px-3 py-1.5 text-white font-bold rounded text-xs transition-colors cursor-pointer ${
                  resetType === 'purge' ? 'bg-red-650 hover:bg-red-750' : 'bg-rose-650 hover:bg-rose-750'
                }`}
              >
                {resetType === 'purge' ? 'Ya, Kosongkan Semua' : 'Ya, Setel Ulang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
