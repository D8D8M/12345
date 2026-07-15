import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Auth({ onClose }: { onClose?: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);
    if (mode === 'signup' && password !== confirmation) {
      setMessage('Пароли не совпадают.');
      return;
    }
    setBusy(true);
    try {
      const { error } = mode === 'signup'
        ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() } } })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage(error.message.includes('already registered') ? 'Аккаунт с такой почтой уже существует.' : error.message.includes('Invalid login credentials') ? 'Неверная почта или пароль.' : error.message);
      } else if (mode === 'signup') {
        setSuccess(true);
        setMessage('Аккаунт создан. Если вход не выполнился автоматически, подтвердите почту по ссылке в письме.');
      }
    } catch {
      setMessage('Не удалось связаться с сервером. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleAuth() {
    setBusy(true);
    setMessage('');
    setSuccess(false);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) setMessage(error.message);
    } catch {
      setMessage('Не удалось открыть вход через Google. Попробуйте ещё раз.');
      setBusy(false);
    }
  }

  function switchMode() {
    setMode((current) => current === 'signin' ? 'signup' : 'signin');
    setMessage(''); setSuccess(false); setConfirmation('');
  }

  const inputClass = 'mt-2 w-full border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-teal-300/60';
  const labelClass = 'block text-[10px] font-bold uppercase tracking-[.2em] text-slate-400';

  return (
    <main className={`grid place-items-center overflow-y-auto bg-[#070b0f] px-4 py-10 text-slate-100 ${onClose ? 'fixed inset-0 z-50 min-h-full bg-[#070b0f]/95 backdrop-blur-sm' : 'min-h-screen'}`}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(45,212,191,.12),transparent_38%)]" />
      <section className="relative w-full max-w-md border border-white/10 bg-[#0d151b]/95 p-7 shadow-[0_30px_100px_rgba(0,0,0,.7)] md:p-10">
        {onClose && <button type="button" onClick={onClose} aria-label="Закрыть" className="absolute right-4 top-4 grid h-8 w-8 place-items-center border border-white/10 text-lg text-slate-500 transition hover:border-teal-300/40 hover:text-teal-200">×</button>}
        <div className="mb-8 text-center">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[.45em] text-teal-300">Ashfall</p>
          <h1 className="text-3xl font-black uppercase tracking-tight">{mode === 'signup' ? 'Создать аккаунт' : 'Вернуться в бой'}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{mode === 'signup' ? 'Зарегистрируйтесь, чтобы начать спуск.' : 'Войдите в свой аккаунт, чтобы продолжить.'}</p>
        </div>
        <button type="button" onClick={handleGoogleAuth} disabled={busy} className="flex w-full items-center justify-center gap-3 border border-white/15 bg-white px-5 py-3.5 text-xs font-black uppercase tracking-[.16em] text-slate-900 transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-50">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-base font-black normal-case tracking-normal text-[#4285f4]">G</span>
          Продолжить с Google
        </button>
        <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-white/10"/><span className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">или по почте</span><span className="h-px flex-1 bg-white/10"/></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && <label className={labelClass}>Имя игрока<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Странник" minLength={2} maxLength={24} required /></label>}
          <label className={labelClass}>Электронная почта<input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
          <label className={labelClass}>Пароль<input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Минимум 6 символов" minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required /></label>
          {mode === 'signup' && <label className={labelClass}>Повторите пароль<input className={inputClass} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Введите пароль ещё раз" minLength={6} autoComplete="new-password" required /></label>}
          {message && <p role="status" className={`border px-3 py-2 text-xs leading-5 ${success ? 'border-teal-300/20 bg-teal-300/5 text-teal-200' : 'border-rose-400/20 bg-rose-400/5 text-rose-300'}`}>{message}</p>}
          <button className="w-full border border-teal-300/60 bg-teal-300/10 px-5 py-3.5 text-xs font-black uppercase tracking-[.25em] text-teal-100 transition hover:bg-teal-300/20 disabled:cursor-wait disabled:opacity-50" type="submit" disabled={busy}>{busy ? 'Подождите…' : mode === 'signup' ? 'Зарегистрироваться' : 'Войти'}</button>
        </form>
        <button className="mt-6 w-full text-xs text-slate-500 transition hover:text-teal-200" type="button" onClick={switchMode}>{mode === 'signup' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}</button>
      </section>
    </main>
  );
}
