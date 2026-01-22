/**
 * StatsFooter - Footer stats bar showing CRO price, gas, total settled, agent status
 * Matches the design from nova-x402_agentic_dashboard
 */

'use client'

export function StatsFooter() {
  return (
    <footer className="mt-20 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">CRO Price</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">$0.0842</span>
          <span className="text-xs text-emerald-500">+2.4%</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Gas Price (Fast)</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">42 Gwei</span>
          <span className="text-xs text-slate-400">~0.12 CRO</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total Settled</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">$4.2M</span>
          <span className="text-xs text-slate-400">Past 30d</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Agent Status</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xl font-bold text-white uppercase text-sm tracking-wide">Nominal</span>
        </div>
      </div>
    </footer>
  )
}
