'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, LoaderCircle, TriangleAlert } from 'lucide-react';

const inputCls =
  'w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition';

function JoinForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'تعذّر قبول الدعوة');
      return;
    }
    router.push('/login');
  };

  if (!token) {
    return (
      <p className="text-center text-slate-500 text-sm">
        رابط الدعوة غير مكتمل — اطلب رابطاً جديداً من مدير المصنع.
      </p>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-8 space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm rounded-xl p-3 border border-rose-100 dark:border-rose-500/20">
          <TriangleAlert size={16} className="shrink-0" /> {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">اسمك الكامل</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="سالم القحطاني" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">كلمة المرور</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          dir="ltr"
          className={`${inputCls} text-end`}
          placeholder="10 خانات على الأقل — حروف وأرقام"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !name || !password}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white p-3 rounded-xl font-semibold transition shadow-sm"
      >
        {loading ? <LoaderCircle size={18} className="animate-spin" /> : 'انضمام للفريق'}
      </button>
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
            <UserPlus size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">الانضمام لفريق المصنع</h1>
            <p className="text-xs text-slate-500">أكمل بياناتك لتفعيل حسابك بالدور المحدد لك</p>
          </div>
        </div>
        <Suspense>
          <JoinForm />
        </Suspense>
      </div>
    </div>
  );
}
