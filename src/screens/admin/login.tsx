import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';
import { Icon } from '@/ui';

export default function AdminLogin() {
 const {t}=useTranslation();const router=useRouter();const {isAdmin,session,signOut}=useAuth();
 const [username,setUsername]=useState('admin');const [password,setPassword]=useState('');const [shown,setShown]=useState(false);
 const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{if(isAdmin)router.replace('/admin');},[isAdmin,router]);
 const submit=async(e:FormEvent)=>{
  e.preventDefault();setError('');setLoading(true);
  const email=username.trim().toLowerCase()==='admin'?'admin@skochko.invalid':username.trim();
  const {error}=await supabase.auth.signInWithPassword({email,password});
  setLoading(false);if(error)setError(t('admin.control.loginError'));
 };
 return <main className="admin-login-page"><section className="admin-login-card">
  <a href="/" className="admin-back-link">← {t('admin.control.backToMap')}</a><p className="admin-eyebrow">SKOCHKO · {t('admin.control.workspace')}</p>
  <h1>{t('admin.control.adminSignIn')}</h1><p>{t('admin.control.adminLoginSubtitle')}</p>
  {session&&!isAdmin?<div className="admin-access-note"><p>{t('admin.control.switchAccount')}</p><button className="admin-dark-button" onClick={()=>void signOut()}>{t('profile.signOut')}</button></div>:
  <form className="admin-settings-form" onSubmit={submit}>
   <label>{t('admin.control.username')}<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required /></label>
   <label>{t('auth.password')}<span className="admin-password-field"><input type={shown?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /><button type="button" aria-label={t(shown?'auth.hidePassword':'auth.showPassword')} onClick={()=>setShown(!shown)}><Icon key={String(shown)} name={shown?'eyeOff':'eye'} size={20} playOnMount /></button></span></label>
   {error&&<p role="alert" className="admin-form-error">{error}</p>}
   <button className="admin-dark-button" disabled={loading}>{loading?t('common.loading'):t('auth.signInButton')}</button>
  </form>}
 </section></main>;
}
