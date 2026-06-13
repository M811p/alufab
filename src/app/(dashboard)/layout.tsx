'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, PenTool, Layers, FileText, Briefcase, Users, Factory,
  Package, Receipt, BarChart3, Settings, LogOut, Menu, X, UserCog,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'لوحة القيادة', icon: LayoutDashboard },
  { href: '/designer', label: 'المصمم المرئي', icon: PenTool },
  { href: '/materials', label: 'مكتبة المواد', icon: Layers },
  { href: '/quotations', label: 'عروض الأسعار', icon: FileText },
  { href: '/projects', label: 'المشاريع', icon: Briefcase },
  { href: '/clients', label: 'العملاء', icon: Users },
  { href: '/production', label: 'الإنتاج', icon: Factory },
  { href: '/inventory', label: 'المخزون', icon: Package },
  { href: '/invoices', label: 'الفواتير', icon: Receipt },
  { href: '/reports', label: 'التقارير', icon: BarChart3 },
] as const;

const ADMIN_ITEMS = [
  { href: '/admin/team', label: 'إدارة الفريق', icon: UserCog },
  { href: '/admin', label: 'الإعدادات', icon: Settings },
] as const;

interface NavLinkProps {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate: () => void;
}

function NavLink({ href, label, icon: Icon, active, onNavigate }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
        active
          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} className="shrink-0" />
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="p-2 bg-blue-600 text-white rounded-xl">
          <Factory size={22} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 dark:text-white text-sm">AluFab Cloud</p>
          <p className="text-xs text-slate-400 truncate">{session?.user?.tenantName ?? 'منصة المصنع'}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
        {isAdmin && (
          <>
            <p className="px-3.5 pt-5 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">الإدارة</p>
            {ADMIN_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={pathname === item.href || pathname.startsWith(item.href + '/')}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{session?.user?.name}</p>
            <p className="text-xs text-slate-400">{session?.user?.role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="تسجيل الخروج"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* الشريط الجانبي — سطح المكتب */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 p-4 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* الشريط الجانبي — جوال */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] flex flex-col bg-white dark:bg-slate-900 p-4 h-full shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 start-4 p-1.5 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* الترويسة العلوية للجوال */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-slate-600 dark:text-slate-300">
            <Menu size={22} />
          </button>
          <span className="font-bold text-slate-900 dark:text-white text-sm">AluFab Cloud</span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
