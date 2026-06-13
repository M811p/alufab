import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AluFab Cloud — منصة تصنيع الألمنيوم والزجاج',
  description: 'منصة سحابية متكاملة لمصانع الألمنيوم والزجاج: تصميم مرئي، تسعير تلقائي، قوائم تقطيع محسّنة، وإدارة إنتاج ومخزون.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const dir: 'rtl' | 'ltr' = 'rtl';
  const lang = dir === 'rtl' ? 'ar' : 'en';

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${plexArabic.variable} ${mono.variable} font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
