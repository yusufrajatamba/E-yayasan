import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Database, 
  Users, 
  ArrowLeftRight, 
  BookOpen, 
  DollarSign, 
  Package, 
  Award, 
  Printer, 
  Receipt,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  LogOut,
  KeyRound
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  currentUser?: {
    username: string;
    nama: string;
    role: string;
  } | null;
}

export default function Sidebar({ currentView, onViewChange, onOpenChangePassword, onLogout, currentUser }: SidebarProps) {
  // Simulating countdown timers seen on the image "Logout [ 019 : 13 ]" which decreases over time as session expiry!
  const [minutes, setMinutes] = useState(19);
  const [seconds, setSeconds] = useState(13);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev === 0) {
          if (minutes === 0) {
            // Reset to keep the visual look of the button
            setMinutes(20);
            return 0;
          }
          setMinutes(m => m - 1);
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [minutes]);

  // Expandable state for folders corresponding to arrows in the image
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'sistem-utility': false,
    'data-master': false,
    'keanggotaan': true, // Keep open by default for interactive ease
    'transaksi': true,
    'tata-ibadah': false,
    'budgeting': false,
    'manajemen-aset': false,
  });

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      hasArrow: false 
    },
    { 
      id: 'sistem-utility', 
      label: 'Sistem Utility', 
      icon: Settings, 
      hasArrow: true,
      subItems: [
        { id: 'change-password', label: 'Ganti Kata Sandi' },
        { id: 'system-info', label: 'Informasi Server' },
      ]
    },
    { 
      id: 'data-master', 
      label: 'Data Master', 
      icon: Database, 
      hasArrow: true,
      subItems: [
        { id: 'sektor-list', label: 'Wilayah Kerja Sektor' },
        { id: 'kategori-persembahan', label: 'Kategori Keuangan' },
      ]
    },
    { 
      id: 'keanggotaan', 
      label: 'Keanggotaan', 
      icon: Users, 
      hasArrow: true,
      subItems: [
        { id: 'keanggotaan', label: 'Daftar Anggota' },
        { id: 'add-member', label: 'Tambah Anggota Baru' }
      ]
    },
    { 
      id: 'transaksi', 
      label: 'Transaksi', 
      icon: ArrowLeftRight, 
      hasArrow: true,
      subItems: [
        { id: 'transaksi', label: 'Kas & Donasi Yayasan' },
        { id: 'add-transaction', label: 'Input Transaksi Baru' }
      ]
    },
    { 
      id: 'tata-ibadah', 
      label: 'Kegiatan & Roster', 
      icon: BookOpen, 
      hasArrow: true,
      subItems: [
        { id: 'tata-ibadah', label: 'Jadwal Pelayanan / Kegiatan' },
        { id: 'buletin-bulanan', label: 'Warta Bulanan & WA Blast' }
      ]
    },
    { 
      id: 'budgeting', 
      label: 'Budgeting', 
      icon: DollarSign, 
      hasArrow: true,
      subItems: [
        { id: 'budget-plan', label: 'Rancangan Anggaran Belanja (RAB)' }
      ]
    },
    { 
      id: 'manajemen-aset', 
      label: 'Manajemen Aset', 
      icon: Package, 
      hasArrow: true,
      subItems: [
        { id: 'manajemen-aset', label: 'Inventaris Yayasan' }
      ]
    },
    { 
      id: 'kepanitiaan', 
      label: 'Kepanitiaan & Program', 
      icon: Award, 
      hasArrow: false 
    },
    { 
      id: 'laporan', 
      label: 'Laporan Keuangan', 
      icon: Printer, 
      hasArrow: false 
    },
    { 
      id: 'daftar-bill', 
      label: 'Daftar Tagihan', 
      icon: Receipt, 
      hasArrow: false 
    }
  ];

  return (
    <aside className="w-64 bg-[#f1f3f7] flex flex-col justify-between border-r border-[#d5dae2] h-[calc(100vh-53px)] overflow-y-auto select-none">
      <div className="flex flex-col py-1">
        {navItems.map((item) => {
          const isMainActive = currentView === item.id;
          const isExpanded = expandedItems[item.id] || false;
          
          return (
            <div key={item.id} className="w-full">
              {/* Main Sidebar Row */}
              <div 
                id={`sidebar-item-${item.id}`}
                onClick={() => {
                  if (item.hasArrow) {
                    setExpandedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                  }
                  onViewChange(item.id);
                }}
                className={`flex items-center justify-between px-4 py-2.5 text-xs font-semibold cursor-pointer border-b border-[#e5e8ef] transition-all duration-150 ${
                  isMainActive 
                    ? 'bg-white text-[#3875d7] border-l-4 border-l-[#3875d7] shadow-sm' 
                    : 'text-[#36597a] hover:bg-[#e8ebf0] hover:text-[#183a5c]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 ${isMainActive ? 'text-[#3875d7]' : 'text-[#7e99b2]'}`} />
                  <span>{item.label}</span>
                </div>
                
                {item.hasArrow && (
                  <button 
                    onClick={(e) => toggleExpand(item.id, e)}
                    className="p-0.5 hover:bg-[#d9dee6] rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                )}
              </div>

              {/* Sub-Items Expandable Panel */}
              {item.hasArrow && isExpanded && item.subItems && (
                <div className="bg-[#e9ebef] text-[11px] border-b border-[#dcdfe5] shadow-inner">
                  {item.subItems.map((sub) => {
                    const isSubActive = currentView === sub.id;
                    return (
                      <div
                        key={sub.id}
                        id={`sidebar-subitem-${sub.id}`}
                        onClick={() => onViewChange(sub.id)}
                        className={`pl-10 pr-4 py-2 cursor-pointer font-medium transition-colors border-l-2 ${
                          isSubActive
                            ? 'text-[#3875d7] font-semibold border-l-[#3875d7] bg-white/50'
                            : 'text-[#506e8b] hover:text-[#183a5c] hover:bg-[#e1e4e9] border-l-transparent'
                        }`}
                      >
                        {sub.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Profile Box, matching user's image exactly */}
      <div className="p-4 bg-[#e9edf3] border-t border-[#d8dee7]">
        <div className="text-center mb-3">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="font-mono text-slate-500">{currentUser?.username || 'gloria'}</span>
            <span className="font-bold text-slate-800">({currentUser?.nama || 'gloria'})</span>
          </div>
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <ShieldCheck className="w-3 h-3 text-[#12427f] shrink-0" />
            {currentUser?.role || 'Administrator Kantor'}
          </p>
        </div>

        {/* Action Button: Ganti Password */}
        <button
          id="btn-ganti-password"
          onClick={onOpenChangePassword}
          className="w-full bg-[#eca83c] hover:bg-[#de9729] active:bg-[#ce8718] text-white py-1.5 px-3 rounded text-[11px] font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 mb-2 cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Ganti Pasword</span>
        </button>

        {/* Action Button: Logout [ 019 : 13 ] */}
        <button
          id="btn-logout"
          onClick={onLogout}
          className="w-full bg-[#4abdd5] hover:bg-[#34aac2] active:bg-[#2c98af] text-white py-1.5 px-3 rounded text-[11px] font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>
            Logout [ {minutes.toString().padStart(3, '0')} : {seconds.toString().padStart(2, '0')} ]
          </span>
        </button>
      </div>
    </aside>
  );
}
