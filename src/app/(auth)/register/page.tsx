'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Factory, LoaderCircle, TriangleAlert } from 'lucide-react';

const inputCls =
  'w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ factoryName: '', crNumber: '', adminName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, crNumber: form.crNumber || undefined }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'تعذّر إنشاء الحساب — حاول مجدداً');
      return;
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
            <Factory size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">تسجيل مصنع جديد</h1>
            <p className="text-xs text-slate-500">يُنشأ حسابك كمدير نظام (ADMIN)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-8 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm rounded-xl p-3 border border-rose-100 dark:border-rose-500/20">
              <TriangleAlert size={16} className="shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">اسم المصنع</label>
            <input value={form.factoryName} onChange={set('factoryName')} className={inputCls} placeholder="مصنع الوسام للألمنيوم" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">السجل التجاري (اختياري)</label>
            <input value={form.crNumber} onChange={set('crNumber')} dir="ltr" className={`${inputCls} text-end`} placeholder="1010123456" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">اسمك الكامل</label>
            <input value={form.adminName} onChange={set('adminName')} className={inputCls} placeholder="محمد العتيبي" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
            <input type="email" value={form.email} onChange={set('email')} dir="ltr" className={`${inputCls} text-end`} placeholder="name@factory.sa" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">كلمة المرور</label>
            <input type="password" value={form.password} onChange={set('password')} dir="ltr" className={`${inputCls} text-end`} placeholder="10 خانات على الأقل — حروف وأرقام" />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !form.factoryName || !form.adminName || !form.email || !form.password}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white p-3 rounded-xl font-semibold transition shadow-sm"
          >
            {loading ? <LoaderCircle size={18} className="animate-spin" /> : 'إنشاء حساب المصنع'}
          </button>

          <p className="text-center text-xs text-slate-400 pt-1">
            لديك حساب؟ <a href="/login" className="text-blue-600 font-semibold hover:underline">سجّل الدخول</a>
          </p>
        </div>
      </div>
    </div>
  );
}
