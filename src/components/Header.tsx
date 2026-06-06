import { HeartHandshake, Printer } from 'lucide-react';

interface HeaderProps {
  onCetakLaporan?: () => void;
}

export default function Header({ onCetakLaporan }: HeaderProps) {
  return (
    <header className="bg-[#12427f] text-white py-3 px-6 flex items-center justify-between border-b border-[#0e3566] print:hidden">
      <div className="flex items-center gap-2">
        <div className="flex items-baseline font-serif select-none">
          <span className="text-2xl font-bold italic tracking-wide">e-</span>
          <span className="text-2xl font-semibold tracking-wide">Yayasan</span>
        </div>
        <HeartHandshake className="w-6 h-6 text-white pb-0.5" strokeWidth={1.8} />
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        {onCetakLaporan && (
          <button
            id="global-btn-print-laporan"
            onClick={onCetakLaporan}
            className="bg-[#eca83c] hover:bg-[#de9729] active:bg-[#ce8718] text-white font-bold py-1 px-3 rounded flex items-center gap-1.5 transition-colors cursor-pointer text-[10.5px]"
            title="Satu-klik untuk mencetak global laporan keuangan kas dari mana saja"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Ekspor PDF Laporan</span>
          </button>
        )}
        <div className="hidden md:flex items-center gap-2 text-[#b0cde8]">
          <span>Server Time:</span>
          <span className="font-mono bg-[#0f3463] px-2 py-0.5 rounded text-white text-[11px]">
            2026-06-04 03:24:08 UTC
          </span>
        </div>
        <div className="bg-[#17529c] hover:bg-[#1c5fb4] transition-colors py-1 px-3 rounded-full text-[11px] font-medium flex items-center gap-1.5 cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Enterprise Connection
        </div>
      </div>
    </header>
  );
}
