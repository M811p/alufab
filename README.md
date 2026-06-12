#!/usr/bin/env node
/**
 * إعداد تلقائي كامل: npm run setup
 * 1. ينشئ .env من .env.example إن لم يوجد
 * 2. يولّد AUTH_SECRET تلقائياً
 * 3. يتحقق من DATABASE_URL
 * 4. prisma generate + db push + seed
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const log = (msg) => console.log(`\x1b[36m[setup]\x1b[0m ${msg}`);
const fail = (msg) => {
  console.error(`\x1b[31m[setup] ✗ ${msg}\x1b[0m`);
  process.exit(1);
};
const run = (cmd) => {
  log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

// ── 1. ملف البيئة ──────────────────────────────────────────────
if (!existsSync('.env')) {
  if (!existsSync('.env.example')) fail('.env.example مفقود');
  copyFileSync('.env.example', '.env');
  log('تم إنشاء .env من .env.example');
}

let env = readFileSync('.env', 'utf8');

// ── 2. توليد AUTH_SECRET ───────────────────────────────────────
if (/AUTH_SECRET="?(CHANGE_ME)?"?\s*$/m.test(env) || !/AUTH_SECRET=.{20,}/.test(env)) {
  const secret = randomBytes(32).toString('base64');
  env = env.replace(/AUTH_SECRET=.*$/m, `AUTH_SECRET="${secret}"`);
  writeFileSync('.env', env);
  log('تم توليد AUTH_SECRET تلقائياً');
}

// ── 3. التحقق من قاعدة البيانات ────────────────────────────────
if (env.includes('USER:PASSWORD@HOST')) {
  fail(
    'عدّل DATABASE_URL في ملف .env أولاً ثم أعد تشغيل: npm run setup\n' +
      '  محلياً:   postgresql://postgres:postgres@localhost:5432/alufab\n' +
      '  Supabase: انسخه من Project Settings → Database → Connection string (URI)'
  );
}

// ── 4. قاعدة البيانات والبذور ──────────────────────────────────
try {
  run('npx prisma generate');
  run('npx prisma db push');
  run('npx tsx prisma/seed.ts');
} catch {
  fail('فشل الاتصال بقاعدة البيانات — تأكد أن PostgreSQL يعمل وأن DATABASE_URL صحيح');
}

console.log(`
\x1b[32m✔ اكتمل الإعداد بنجاح!\x1b[0m

  شغّل المنصة:   npm run dev
  ثم افتح:        http://localhost:3000

  حساب تجريبي جاهز:
    البريد:        admin@demo.sa
    كلمة المرور:   Demo12345678
`);
