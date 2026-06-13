'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, FileClock, Banknote, Factory, PackageSearch, ListChecks,
  TrendingUp, Plus, PenTool, Users, ArrowUpRight, CircleDot,
} from 'lucide-react';

const kpis = [
  { label: 'المشاريع النشطة', value: '14', delta: '+2 هذا الشهر', icon: Briefcase, tone: 'blue' },
  { label: 'عروض بانتظار الرد', value: '7', delta: '3 تنتهي خلال أسبوع', icon: FileClock, tone: 'amber' },
  { label: 'إيرادات الشهر', value: '486,250 ر.س', delta: '+18% عن مايو', icon: Banknote, tone: 'emerald' },
  { label: 'وحدات قيد التصنيع', value: '62', delta: '9 تسلّم هذا الأسبوع', icon: Factory, tone: 'blue' },
  { label: 'أصناف تحت الحد الأدنى', value: '4', delta: 'تتطلب طلب شراء', icon: PackageSearch, tone: 'rose' },
  { label: 'مهام مفتوحة', value: '23', delta: '5 متأخرة', icon: ListChecks, tone: 'slate' },
] as const;

const revenueByMonth = [
  { m: 'يناير', v: 310 }, { m: 'فبراير', v: 285 }, { m: 'مارس', v: 402 },
  { m: 'أبريل', v: 368 }, { m: 'مايو', v: 412 }, { m: 'يونيو', v: 486 },
];

const activities = [
  { time: 'قبل 20 دقيقة', text: 'اعتمد العميل "شركة البنيان" عرض السعر Q-2026-0142 — خُصم المخزون تلقائياً', tone: 'emerald' },
  { time: 'قبل ساعتين', text: 'أُنشئت قائمة تقطيع جديدة: 38 قضيب ALUPCO SG (استفادة 91.4%)', tone: 'blue' },
  { time: 'صباح اليوم', text: 'انتقل مشروع "فلل النرجس" إلى مرحلة التركيب', tone: 'slate' },
  { time: 'أمس', text: 'تنبيه مخزون: زجاج دبل 24 مم وصل للحد الأدنى (50 م²)', tone: 'rose' },
] as const;

const toneMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
};

export default function DashboardPage() {
  const router = useRouter();
  const maxRevenue = Math.max(...revenueByMonth.map((r) => r.v));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">لوحة القيادة التنفيذية</h1>
          <p className="text-sm text-slate-500 mt-1">نظرة شاملة على المصنع — يونيو 2026</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/quotations')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Plus size={16} /> عرض سعر جديد
          </button>
          <button
            onClick={() => router.push('/designer')}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <PenTool size={16} /> فتح المصمم المرئي
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-xl ${toneMap[kpi.tone]}`}>
                <kpi.icon size={20} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300" />
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white" dir="ltr" style={{ textAlign: 'end' }}>
              {kpi.value}
            </p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">{kpi.label}</p>
            <p className="text-xs text-slate-400 mt-1">{kpi.delta}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" /> الإيرادات الشهرية (ألف ر.س)
            </h2>
            <span className="text-xs text-slate-400">النصف الأول 2026</span>
          </div>
          <div className="flex items-end gap-3 h-48" dir="ltr">
            {revenueByMonth.map((r) => (
              <div key={r.m} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-500">{r.v}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-700 dark:to-blue-500 transition-all"
                  style={{ height: `${(r.v / maxRevenue) * 100}%` }}
                />
                <span className="text-xs text-slate-400">{r.m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
            <Users size={18} className="text-blue-600" /> آخر الأنشطة
          </h2>
          <ol className="space-y-5">
            {activities.map((a, i) => (
              <li key={i} className="flex gap-3">
                <CircleDot size={16} className={`mt-0.5 shrink-0 ${toneMap[a.tone].split(' ')[1]}`} />
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{a.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
