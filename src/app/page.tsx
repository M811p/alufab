import Link from 'next/link';
import { Factory, PenTool, Scissors, Receipt, ArrowLeft } from 'lucide-react';

const FEATURES = [
  { icon: PenTool, title: 'مصمم مرئي ثنائي الأبعاد', desc: 'ارسم النوافذ والواجهات وشاهد مقاسات القص والزجاج لحظياً' },
  { icon: Scissors, title: 'تقطيع ذكي للقطاعات', desc: 'خوارزمية 1D Nesting تحسب عدد قضبان 6 متر الفعلي وتقلل الهدر' },
  { icon: Receipt, title: 'تسعير وفوترة سعودية', desc: 'ضريبة 15% تلقائياً، عروض أسعار بالواتساب، وفواتير مرقّمة' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-16">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl">
            <Factory size={24} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">AluFab Cloud</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight max-w-2xl">
          منصة المصنع الكاملة لتصنيع
          <span className="text-blue-600"> الألمنيوم والزجاج</span>
        </h1>
        <p className="text-lg text-slate-500 mt-5 max-w-xl leading-relaxed">
          من الرسم الفني إلى الفاتورة النهائية: تصميم، تسعير تلقائي، قوائم تقطيع محسّنة، وإدارة إنتاج ومخزون — مصمّمة للسوق السعودي والخليجي.
        </p>

        <div className="flex flex-wrap gap-3 mt-8">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md shadow-blue-600/20 transition"
          >
            سجّل مصنعك مجاناً <ArrowLeft size={18} />
          </Link>
          <Link
            href="/login"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-semibold transition"
          >
            تسجيل الدخول
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mt-20">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl w-fit mb-4">
                <f.icon size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
