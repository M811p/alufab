import Link from 'next/link';
import { Construction, ArrowRight } from 'lucide-react';

/**
 * صفحة مؤقتة لوحدات لم تُبنَ واجهاتها بعد (مكتبة المواد، التقارير...).
 * الـ API الخلفي لهذه الوحدات جاهز — تُستبدل هذه الصفحة بالواجهة الفعلية.
 */
export default async function ModulePlaceholder({ params }: { params: Promise<{ module: string[] }> }) {
  const { module } = await params;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl w-fit mx-auto mb-5">
          <Construction size={32} />
        </div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          واجهة هذه الوحدة قيد البناء
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          المسار <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded" dir="ltr">/{module.join('/')}</span> —
          خدمات الـ API الخلفية جاهزة، وواجهة المستخدم تُضاف في الإصدار القادم.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <ArrowRight size={16} /> العودة للوحة القيادة
        </Link>
      </div>
    </div>
  );
}
