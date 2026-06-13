'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Calculator, FileText, Layers, Maximize, MoveHorizontal, MoveVertical } from 'lucide-react';

type SystemType = 'SLIDING' | 'HINGED' | 'FIXED';

interface DesignerState {
  width: number;
  height: number;
  panelsCount: number;
  mullionsCount: number;
  transomsCount: number;
  systemType: SystemType;
}

export default function VisualDesigner() {
  const router = useRouter();
  const [state, setState] = useState<DesignerState>({
    width: 2000,
    height: 1200,
    panelsCount: 2,
    mullionsCount: 0,
    transomsCount: 0,
    systemType: 'SLIDING',
  });

  const activeProfile = useMemo(() => ({
    frameToSashHorizontal: 42,
    frameToSashVertical: 50,
    overlapAllowance: 30,
    glassDeductionHorizontal: 110,
    glassDeductionVertical: 110,
  }), []);

  const calculations = useMemo(() => {
    let sashWidth = 0;
    let sashHeight = state.height - activeProfile.frameToSashVertical;

    if (state.systemType === 'SLIDING') {
      const totalSlidingWidth = state.width - activeProfile.frameToSashHorizontal + (activeProfile.overlapAllowance * (state.panelsCount - 1));
      sashWidth = totalSlidingWidth / Math.max(state.panelsCount, 1);
    } else if (state.systemType === 'HINGED') {
      sashWidth = (state.width - activeProfile.frameToSashHorizontal) / Math.max(state.panelsCount, 1);
    } else {
      sashWidth = state.width;
      sashHeight = state.height;
    }

    const glassWidth = sashWidth - activeProfile.glassDeductionHorizontal;
    const glassHeight = sashHeight - activeProfile.glassDeductionVertical;
    const totalArea = ((glassWidth * glassHeight) / 1000000) * state.panelsCount;

    return { sashWidth, sashHeight, glassWidth, glassHeight, totalArea };
  }, [state, activeProfile]);

  const padding = 300;
  const viewBox = `-${padding} -${padding} ${state.width + padding * 2} ${state.height + padding * 2}`;
  const frameThickness = 45;
  const sashThickness = 35;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* شريط التحكم الجانبي */}
      <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col gap-8 z-10">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">مُصمم الواجهات الفني</h2>
            <p className="text-sm text-slate-500">إعدادات الأبعاد والقطاعات</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Layers size={16} /> نوع النظام المعماري
            </label>
            <select
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={state.systemType}
              onChange={(e) => setState({ ...state, systemType: e.target.value as SystemType })}
            >
              <option value="SLIDING">نظام منزلق (سحاب)</option>
              <option value="HINGED">نظام مفصلي</option>
              <option value="FIXED">نظام ثابت (Fixed Window)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MoveHorizontal size={16} /> العرض (mm)
              </label>
              <input
                type="number"
                value={state.width}
                onChange={(e) => setState({ ...state, width: Math.max(Number(e.target.value), 100) })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MoveVertical size={16} /> الارتفاع (mm)
              </label>
              <input
                type="number"
                value={state.height}
                onChange={(e) => setState({ ...state, height: Math.max(Number(e.target.value), 100) })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">عدد الضلف الهندسية</label>
            <input
              type="number"
              min="1" max="6"
              value={state.panelsCount}
              onChange={(e) => setState({ ...state, panelsCount: Math.min(Math.max(Number(e.target.value), 1), 6) })}
              className="w-20 p-2 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
        </div>

        <div className="mt-auto bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-5">
          <h3 className="text-emerald-800 dark:text-emerald-400 font-bold flex items-center gap-2 mb-4">
            <Calculator size={18} /> الحسابات الهندسية الفورية
          </h3>
          <div className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
            <div className="flex justify-between">
              <span>عرض قص الضلفة:</span>
              <span className="font-mono font-bold" dir="ltr">{calculations.sashWidth.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between">
              <span>طول قص الضلفة:</span>
              <span className="font-mono font-bold" dir="ltr">{calculations.sashHeight.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-500/20 pt-2 mt-2">
              <span>صافي مساحة الزجاج:</span>
              <span className="font-mono font-bold" dir="ltr">{calculations.totalArea.toFixed(2)} m²</span>
            </div>
          </div>
        </div>
      </aside>

      {/* لوحة الرسم الهندسي SVG Canvas */}
      <main className="flex-1 flex flex-col relative bg-slate-100/50 dark:bg-slate-900/50">
        <div className="absolute top-4 right-4 left-4 flex justify-between z-10">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm font-semibold">
            <Maximize size={16} /> 2D Technical view
          </div>
          <button
            onClick={() => router.push('/quotations')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md font-semibold flex items-center gap-2 transition"
            title="انتقل لصفحة عروض الأسعار لتوليد BOM كامل مع التسعير"
          >
            <FileText size={18} /> اعتماد ونقل المواد للـ BOM
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <svg className="w-full h-full max-h-[80vh] drop-shadow-xl" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
            {/* خطوط الأبعاد الفنية — اتجاه ltr صارم لمنع تشوه الأرقام في بيئة RTL */}
            <g>
              <line x1="0" y1="-80" x2={state.width} y2="-80" stroke="#64748b" strokeWidth="4" />
              <line x1="0" y1="-100" x2="0" y2="-60" stroke="#64748b" strokeWidth="6" />
              <line x1={state.width} y1="-100" x2={state.width} y2="-60" stroke="#64748b" strokeWidth="6" />
              <text x={state.width / 2} y="-110" fill="#334155" fontSize="60" fontWeight="bold" textAnchor="middle" className="font-mono">
                W: {state.width} mm
              </text>

              <line x1="-80" y1="0" x2="-80" y2={state.height} stroke="#64748b" strokeWidth="4" />
              <line x1="-100" y1="0" x2="-60" y2="0" stroke="#64748b" strokeWidth="6" />
              <line x1="-100" y1={state.height} x2="-60" y2={state.height} stroke="#64748b" strokeWidth="6" />
              <text x="-120" y={state.height / 2} fill="#334155" fontSize="60" fontWeight="bold" textAnchor="middle" transform={`rotate(-90, -120, ${state.height / 2})`} className="font-mono">
                H: {state.height} mm
              </text>
            </g>

            {/* الحلق الخارجي */}
            <rect x="0" y="0" width={state.width} height={state.height} fill="#e2e8f0" stroke="#475569" strokeWidth="8" />
            <rect x={frameThickness} y={frameThickness} width={state.width - frameThickness * 2} height={state.height - frameThickness * 2} fill="#f8fafc" stroke="#64748b" strokeWidth="4" />

            {/* الضلف الديناميكية */}
            {Array.from({ length: state.panelsCount }).map((_, i) => {
              let panelDrawWidth = (state.width - frameThickness * 2) / state.panelsCount;
              let currentX = frameThickness + (i * panelDrawWidth);

              if (state.systemType === 'SLIDING' && i > 0) {
                currentX -= (activeProfile.overlapAllowance * i);
                panelDrawWidth += (activeProfile.overlapAllowance / state.panelsCount);
              }
              const panelDrawHeight = state.height - frameThickness * 2;

              return (
                <g key={`panel-${i}`}>
                  <rect x={currentX} y={frameThickness} width={panelDrawWidth} height={panelDrawHeight} fill={state.systemType === 'SLIDING' && i % 2 !== 0 ? '#f1f5f9' : '#ffffff'} stroke="#94a3b8" strokeWidth="6" />
                  <rect x={currentX + sashThickness} y={frameThickness + sashThickness} width={panelDrawWidth - sashThickness * 2} height={panelDrawHeight - sashThickness * 2} fill="#e0f2fe" fillOpacity="0.6" stroke="#cbd5e1" strokeWidth="2" />
                  <text x={currentX + panelDrawWidth / 2} y={frameThickness + panelDrawHeight / 2} fill="#0369a1" fontSize="35" fontWeight="bold" textAnchor="middle" className="font-mono">
                    G: {calculations.glassWidth.toFixed(0)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </main>
    </div>
  );
}
