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
      <div className="bg-[#f8faf9] pt-2 px-5 pb-1 flex items-center justify-between select-none relative z-20">
        {/* Time */}
        <span className="text-slate-900 text-xs font-bold tracking-tight">{time}</span>

        {/* Dynamic Island Capsule */}
        <div className="w-24 sm:w-28 h-6 bg-black rounded-full flex items-center justify-end pr-2.5 shadow-xs">
          <div className="w-2 h-2 rounded-full bg-[#151515] border border-slate-800" />
        </div>

        {/* Right Status Icons: 4G (green), Wi-Fi, battery 100% */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-emerald-600 font-extrabold text-[11px] tracking-tight">4G</span>
          <Wifi className="w-3.5 h-3.5 text-slate-700" />
          <div className="flex items-center gap-1 font-semibold text-[11px] text-slate-800">
            <div className="w-5 h-2.5 border border-slate-700 rounded-xs p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-800 rounded-2xs" />
            </div>
            <span>100%</span>
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
