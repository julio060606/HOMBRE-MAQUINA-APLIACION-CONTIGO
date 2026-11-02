import { ReactNode } from 'react';
import { Wifi } from 'lucide-react';

export function PhoneDeviceFrame({
  children,
  width = 390,
  time = '08:05',
}: {
  children: ReactNode;
  width?: number;
  time?: string;
}) {
  return (
    <div
      className="mx-auto rounded-[46px] border-[10px] border-[#18202b] bg-[#18202b] shadow-2xl overflow-hidden relative transition-all duration-300"
      style={{ maxWidth: width, width: '100%' }}
    >
      {/* Top Phone Bezel & Status Bar (Image 2) */}
      <div aria-hidden="true" className="bg-[#f8faf9] flex items-center justify-between select-none relative z-20" style={{ padding: '8px 20px 4px', gap: 4, fontSize: 12 }}>
        {/* Time */}
        <span className="text-slate-900 font-bold tracking-tight" style={{ fontSize: 'inherit', whiteSpace: 'nowrap' }}>{time}</span>

        {/* Dynamic Island Capsule */}
        <div className="bg-black rounded-full flex items-center justify-end shadow-xs" style={{ width: 96, height: 24, paddingRight: 10, flexShrink: 1 }}>
          <div className="w-2 h-2 rounded-full bg-[#151515] border border-slate-800" />
        </div>

        {/* Right Status Icons: 4G (green), Wi-Fi, battery 100% */}
        <div className="flex items-center" style={{ gap: 6, flexShrink: 0, fontSize: 11 }}>
          <span className="text-emerald-800 font-extrabold tracking-tight" style={{ fontSize: 'inherit' }}>4G</span>
          <Wifi className="text-slate-700" style={{ width: 14, height: 14 }} />
          <div className="flex items-center font-semibold text-slate-800" style={{ gap: 4, fontSize: 'inherit' }}>
            <div className="border border-slate-700 rounded-xs flex items-center" style={{ width: 20, height: 10, padding: 2 }}>
              <div className="w-full h-full bg-slate-800 rounded-2xs" />
            </div>
            <span style={{ fontSize: 'inherit', whiteSpace: 'nowrap' }}>100%</span>
          </div>
        </div>
      </div>

      {/* Screen Body */}
      <div className="bg-[#f8faf9] overflow-hidden">
        {children}
      </div>

      {/* Bottom Home Indicator Bar */}
      <div className="w-full py-2 flex justify-center bg-[#f8faf9]">
        <div className="w-28 sm:w-32 h-1 bg-slate-400/80 rounded-full" />
      </div>
    </div>
  );
}
