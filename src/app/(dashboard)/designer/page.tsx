'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Calculator, ChevronDown, FileText, Layers,
  Maximize, MoveHorizontal, MoveVertical, Plus, Scissors, Settings2,
} from 'lucide-react';

type SystemType = 'SLIDING' | 'HINGED' | 'FIXED' | 'DOOR' | 'CURTAIN_WALL';

interface DesignerState {
  width: number;
  height: number;
  panelsCount: number;
  mullionsCount: number;
  transomsCount: number;
  systemType: SystemType;
  stockBarLength: number;
  activeTab: string;
  activeShape: string;
  glassType: string;
}

const TABS = ['شائع', 'إطار', 'عامود', 'ورقة', 'حشوة ثابتة', 'حاشية'];

const SHAPES = [
  { id: 'rect', label: 'مستطيلي', sym: '▬' },
  { id: 'mullion', label: 'إضافة عامود', sym: '||' },
  { id: 'single-glass', label: 'ورقة زجاج مفردة', sym: '⬜' },
  { id: 'mesh-glass', label: 'ورقة شبكية مفردة', sym: '⊞' },
  { id: 'security-glass', label: 'ورقة أمنية مفردة', sym: '🔐' },
  { id: 'dgu', label: 'زجاج مزدوج (DGU)', sym: '⬛' },
];

const SYSTEM_TYPES: { value: SystemType; label: string }[] = [
  { value: 'SLIDING', label: 'نظام سحاب (Sliding)' },
  { value: 'HINGED', label: 'نظام مفصلي (Hinged)' },
  { value: 'FIXED', label: 'نظام ثابت (Fixed)' },
  { value: 'DOOR', label: 'أبواب (Door)' },
  { value: 'CURTAIN_WALL', label: 'واجهات زجاجية (Curtain Wall)' },
];

const GLASS_TYPES = [
  'زجاج شفاف 6 مم',
  'زجاج مقسّى (سيكوريت) 6 مم',
  'زجاج مقسّى (سيكوريت) 8 مم',
  'زجاج مزدوج (دبل) 24 مم',
  'زجاج مزدوج عاكس Low-E 24 مم',
  'زجاج مصفّح (لامينيت) 6+6 مم',
  'زجاج نيترو 70 — 6 مم',
];

const DEFAULT_BAR = 5800;

const PROF = {
  frameToSashH: 42, frameToSashV: 50, overlapAllowance: 30,
  glassDeductionH: 110, glassDeductionV: 110,
};

const frameT = 40;
const sashT = 28;

export default function VisualDesigner() {
  const router = useRouter();
  const [s, setS] = useState<DesignerState>({
    width: 2040, height: 1200, panelsCount: 2,
    mullionsCount: 0, transomsCount: 0,
    systemType: 'SLIDING', stockBarLength: DEFAULT_BAR,
    activeTab: 'شائع', activeShape: 'rect',
    glassType: 'زجاج شفاف 6 مم',
  });

  const patch = (p: Partial<DesignerState>) => setS((prev) => ({ ...prev, ...p }));
  const barChanged = s.stockBarLength !== DEFAULT_BAR;

  const calc = useMemo(() => {
    let sashW = 0;
    let sashH = s.height - PROF.frameToSashV;

    if (s.systemType === 'SLIDING') {
      sashW = (s.width - PROF.frameToSashH + PROF.overlapAllowance * (s.panelsCount - 1)) / Math.max(s.panelsCount, 1);
    } else if (s.systemType === 'HINGED' || s.systemType === 'DOOR') {
      sashW = (s.width - PROF.frameToSashH) / Math.max(s.panelsCount, 1);
    } else {
      sashW = s.width; sashH = s.height;
    }

    const gW = Math.max(sashW - PROF.glassDeductionH, 0);
    const gH = Math.max(sashH - PROF.glassDeductionV, 0);
    const totalArea = ((gW * gH) / 1_000_000) * s.panelsCount;

    const cuts = [
      s.width, s.width, s.height, s.height,
      ...(s.systemType !== 'FIXED' && s.systemType !== 'CURTAIN_WALL'
        ? Array(s.panelsCount).fill(null).flatMap(() => [sashW, sashW, sashH, sashH])
        : []),
      ...(s.systemType === 'DOOR' ? Array(s.panelsCount).fill(sashW) : []),
    ].sort((a, b) => b - a);

    let rem = [...cuts];
    let bars = 0;
    while (rem.length) {
      let cap = s.stockBarLength;
      rem = rem.filter((c) => { if (c <= cap) { cap -= c + 4; return false; } return true; });
      bars++;
    }

    return { sashW, sashH, gW, gH, totalArea, bars };
  }, [s]);

  const PAD = 220;
  const viewBox = `-${PAD} -${PAD} ${s.width + PAD * 2} ${s.height + PAD * 2}`;

  const panels = Array.from({ length: s.panelsCount }, (_, i) => {
    let pW = (s.width - frameT * 2) / s.panelsCount;
    let pX = frameT + i * pW;
    if (s.systemType === 'SLIDING' && i > 0) {
      pX -= PROF.overlapAllowance * i;
      pW += PROF.overlapAllowance / s.panelsCount;
    }
    return { x: pX, w: pW, back: s.systemType === 'SLIDING' && i % 2 !== 0 };
  });

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0b1329] text-white overflow-hidden" dir="rtl">

      <aside className="w-full lg:w-[380px] shrink-0 bg-[#111c44] border-l border-slate-800/70 flex flex-col overflow-y-auto">

        <div className="p-4 border-b border-slate-800/60 flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg shrink-0"><Settings2 size={16} /></div>
          <div>
            <p className="font-bold text-sm">مصمم الهياكل والقطاعات</p>
            <p className="text-[10px] text-slate-400">المقاسات · الأطوال · الزجاج</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 flex-1">

          {barChanged && (
            <div className="flex gap-2 bg-amber-950/50 border border-amber-500/30 rounded-xl p-3 text-amber-400 text-[11px] leading-relaxed">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong className="block mb-0.5">تنبيه إخلاء مسؤولية:</strong>
                تم تغيير طول العود القياسي، يرجى مطابقة طلب التوريد مع مصنع السحب لتجنب نسب هدر غير دقيقة.
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Layers size={11} /> نوع النظام</label>
            <div className="relative">
              <select
                value={s.systemType}
                onChange={(e) => patch({ systemType: e.target.value as SystemType })}
                className="w-full appearance-none bg-[#1b254b] border border-slate-700 rounded-xl p-3 text-sm pr-9 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {SYSTEM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'العرض (mm)', key: 'width' as const, icon: <MoveHorizontal size={11} /> },
              { label: 'الارتفاع (mm)', key: 'height' as const, icon: <MoveVertical size={11} /> },
            ].map(({ label, key, icon }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">{icon} {label}</label>
                <input
                  type="number"
                  value={s[key]}
                  onChange={(e) => patch({ [key]: Math.max(Number(e.target.value), 100) })}
                  className="w-full bg-[#1b254b] border border-slate-700 rounded-xl p-2.5 text-sm font-mono text-center focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'الضلف', key: 'panelsCount' as const, min: 1, max: 6 },
              { label: 'أعمدة', key: 'mullionsCount' as const, min: 0, max: 8 },
              { label: 'عوارض', key: 'transomsCount' as const, min: 0, max: 4 },
            ].map(({ label, key, min, max }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 block">{label}</label>
                <input
                  type="number" min={min} max={max} value={s[key]}
                  onChange={(e) => patch({ [key]: Math.min(Math.max(Number(e.target.value), min), max) })}
                  className="w-full bg-[#1b254b] border border-slate-700 rounded-xl p-2.5 text-sm font-mono text-center focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Scissors size={11} /> طول العود في المستودع (mm)</label>
            <div className="flex gap-2">
              <input
                type="number" value={s.stockBarLength}
                onChange={(e) => patch({ stockBarLength: Math.max(Number(e.target.value), 500) })}
                className={`flex-1 bg-[#1b254b] border rounded-xl p-2.5 text-sm font-mono text-center focus:ring-2 outline-none transition ${barChanged ? 'border-amber-500/60 focus:ring-amber-500' : 'border-slate-700 focus:ring-blue-500'}`}
              />
              {barChanged && (
                <button onClick={() => patch({ stockBarLength: DEFAULT_BAR })} className="px-2.5 text-[11px] bg-amber-700/20 border border-amber-500/30 text-amber-400 rounded-xl hover:bg-amber-700/30 transition">
                  ↺ 5800
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-600">القياسي: 5800 مم — ALUPCO / Gulf Extrusions / سراياس</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400">مواصفة الزجاج</label>
            <div className="relative">
              <select
                value={s.glassType}
                onChange={(e) => patch({ glassType: e.target.value })}
                className="w-full appearance-none bg-[#1b254b] border border-slate-700 rounded-xl p-2.5 text-sm pr-9 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {GLASS_TYPES.map((g) => <option key={g}>{g}</option>)}
              </select>
              <ChevronDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Plus size={11} /> شريط المكونات النشطة</label>
            <div className="bg-[#0b1329] rounded-xl p-1 flex gap-0.5 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => patch({ activeTab: tab })}
                  className={`shrink-0 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition ${s.activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400">الأشكال والعناصر السريعة</label>
            <div className="grid grid-cols-2 gap-1.5">
              {SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => patch({ activeShape: shape.id })}
                  className={`p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${s.activeShape === shape.id ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-[#1b254b]/50 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                >
                  <span className="text-base opacity-60 shrink-0">{shape.sym}</span>
                  <span className="text-[10px] font-semibold leading-tight">{shape.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-3.5">
            <p className="text-emerald-400 font-bold flex items-center gap-1.5 mb-2.5 text-[11px]">
              <Calculator size={12} /> الحسابات الهندسية الفورية
            </p>
            <div className="space-y-1.5 text-[11px]">
              <CalcRow label="عرض قص الضلفة" val={`${calc.sashW.toFixed(1)} mm`} />
              <CalcRow label="طول قص الضلفة" val={`${calc.sashH.toFixed(1)} mm`} />
              <CalcRow label="صافي الزجاج عرضاً" val={`${calc.gW.toFixed(1)} mm`} />
              <CalcRow label="صافي الزجاج ارتفاعاً" val={`${calc.gH.toFixed(1)} mm`} />
              <div className="border-t border-emerald-500/20 pt-1.5 mt-1.5 space-y-1.5">
                <CalcRow label="مساحة الزجاج الإجمالية" val={`${calc.totalArea.toFixed(3)} م²`} hi />
                <CalcRow label="أعواد ألمنيوم (تقديري)" val={`~${calc.bars} عود × ${(s.stockBarLength / 1000).toFixed(2)} م`} hi />
              </div>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-slate-800/60">
          <button
            onClick={() => router.push('/quotations')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition"
          >
            <FileText size={14} /> اعتماد ونقل المواد للـ BOM
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#0a1128] flex flex-col p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 bg-[#111c44] border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
            <Maximize size={12} /> لوحة الرسم الهندسية ثنائية الأبعاد
          </span>
          <div className="flex gap-2 text-[11px]">
            <span className="bg-[#111c44] border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
              {s.width} × {s.height} mm
            </span>
            <span className={`px-3 py-1.5 rounded-lg border ${barChanged ? 'bg-amber-950/30 border-amber-500/30 text-amber-400' : 'bg-[#111c44] border-slate-800 text-slate-400'}`}>
              عود: {(s.stockBarLength / 1000).toFixed(2)} م
            </span>
          </div>
        </div>

        <div className="flex-1 bg-[#0d1733] border border-slate-800/50 rounded-2xl flex items-center justify-center overflow-hidden p-6">
          <svg className="w-full h-full max-h-[80vh]" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
            <g>
              <line x1="0" y1={-70} x2={s.width} y2={-70} stroke="#334155" strokeWidth="3" />
              <line x1="0" y1={-88} x2="0" y2={-52} stroke="#334155" strokeWidth="4" />
              <line x1={s.width} y1={-88} x2={s.width} y2={-52} stroke="#334155" strokeWidth="4" />
              <text x={s.width / 2} y={-95} fill="#64748b" fontSize="46" fontWeight="700" textAnchor="middle">
                {s.width} mm
              </text>
              <line x1={-70} y1="0" x2={-70} y2={s.height} stroke="#334155" strokeWidth="3" />
              <line x1={-88} y1="0" x2={-52} y2="0" stroke="#334155" strokeWidth="4" />
              <line x1={-88} y1={s.height} x2={-52} y2={s.height} stroke="#334155" strokeWidth="4" />
              <text
                x={-108} y={s.height / 2} fill="#64748b" fontSize="46" fontWeight="700" textAnchor="middle"
                transform={`rotate(-90, -108, ${s.height / 2})`}
              >
                {s.height} mm
              </text>
            </g>

            <rect x="0" y="0" width={s.width} height={s.height} fill="#1e293b" stroke="#475569" strokeWidth="12" rx="6" />
            <rect x={frameT} y={frameT} width={s.width - frameT * 2} height={s.height - frameT * 2} fill="none" stroke="#2d3f5c" strokeWidth="2" />

            {panels.map((p, i) => (
              <g key={i}>
                <rect
                  x={p.x} y={frameT} width={p.w} height={s.height - frameT * 2}
                  fill={p.back ? '#162032' : '#0f1f30'}
                  stroke="#3b82f6" strokeWidth="5" strokeOpacity="0.65"
                />
                <rect
                  x={p.x + sashT} y={frameT + sashT}
                  width={Math.max(p.w - sashT * 2, 0)} height={Math.max(s.height - frameT * 2 - sashT * 2, 0)}
                  fill="#0ea5e915" stroke="#0ea5e930" strokeWidth="2"
                />
                <text x={p.x + p.w / 2} y={frameT + (s.height - frameT * 2) * 0.42} fill="#38bdf8" fontSize="40" fontWeight="700" textAnchor="middle">
                  G{i + 1}
                </text>
                <text x={p.x + p.w / 2} y={frameT + (s.height - frameT * 2) * 0.42 + 50} fill="#475569" fontSize="26" textAnchor="middle">
                  {calc.gW.toFixed(0)}×{calc.gH.toFixed(0)}
                </text>
              </g>
            ))}

            {Array.from({ length: s.mullionsCount }).map((_, i) => {
              const mx = frameT + ((s.width - frameT * 2) / (s.mullionsCount + 1)) * (i + 1);
              return <line key={`m${i}`} x1={mx} y1={frameT} x2={mx} y2={s.height - frameT} stroke="#64748b" strokeWidth="9" />;
            })}

            {Array.from({ length: s.transomsCount }).map((_, i) => {
              const ty = frameT + ((s.height - frameT * 2) / (s.transomsCount + 1)) * (i + 1);
              return <line key={`t${i}`} x1={frameT} y1={ty} x2={s.width - frameT} y2={ty} stroke="#64748b" strokeWidth="9" />;
            })}

            {s.systemType === 'DOOR' && (
              <rect
                x={frameT} y={s.height - frameT - 22}
                width={s.width - frameT * 2} height={22}
                fill="#92400e70" stroke="#b45309" strokeWidth="3"
              />
            )}
          </svg>
        </div>
      </main>
    </div>
  );
}

function CalcRow({ label, val, hi }: { label: string; val: string; hi?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono font-bold ${hi ? 'text-emerald-300' : 'text-emerald-500'}`} dir="ltr">{val}</span>
    </div>
  );
}
