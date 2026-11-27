import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { fetchVenues } from './api';
import { fetchAppSettings, saveAppSettings, type AppSettings } from './controlApi';
import { useAdminToast } from './AdminUi';

export function SettingsPanel() {
 const {t}=useTranslation();const router=useRouter();const cache=useQueryClient();const {showToast}=useAdminToast();
 const config=useQuery({queryKey:['app-settings'],queryFn:fetchAppSettings});
 const venues=useQuery({queryKey:['admin','venues'],queryFn:fetchVenues});
 const [password,setPassword]=useState('');const [savingPassword,setSavingPassword]=useState(false);
 const save=useMutation({mutationFn:saveAppSettings,onSuccess:()=>{void cache.invalidateQueries({queryKey:['app-settings']});showToast(t('admin.saved'));},onError:e=>showToast(e.message,'danger')});
 const changePassword=async(e:FormEvent)=>{
  e.preventDefault();if(password.length<12){showToast(t('admin.control.passwordLength'),'danger');return;}
  setSavingPassword(true);const {error}=await supabase.auth.updateUser({password});setSavingPassword(false);
  if(error)showToast(error.message,'danger');else{setPassword('');showToast(t('admin.control.passwordUpdated'));}
 };
 return <div className="admin-control-page">
  <header className="admin-page-heading"><div><p className="admin-eyebrow">{t('admin.control.configuration')}</p><h1>{t('admin.nav.settings')}</h1><p>{t('admin.control.settingsSubtitle')}</p></div></header>
  {config.isError?<p role="alert">{t('admin.control.loadError')}</p>:config.isPending?<p>{t('common.loading')}</p>:
   <FeaturedForm key={config.data?.updated_at??'new'} config={config.data??{id:'public',featured_enabled:true,featured_venue_id:null,featured_title_mk:'Локално омилено',featured_title_en:'A local favourite'}}
    venues={(venues.data??[]).filter(v=>v.status==='active').map(v=>({id:v.id,name:v.name}))} pending={save.isPending} onSave={draft=>save.mutate(draft)} />}
  <section className="admin-control-card"><h2>{t('admin.control.security')}</h2><p>{t('admin.control.passwordHelp')}</p><form className="admin-settings-form" onSubmit={changePassword}><label>{t('admin.control.newPassword')}<input type="password" minLength={12} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} /></label><button className="admin-dark-button" disabled={savingPassword}>{t('admin.control.updatePassword')}</button></form></section>
 <button className="admin-soft-button" onClick={async()=>{
    const {error}=await supabase.auth.signOut();
    if(error){showToast(error.message,'danger');return;}
    cache.clear();router.replace('/admin/login');
  }}>{t('profile.signOut')}</button>
 </div>;
}
function FeaturedForm({config,venues,pending,onSave}:{config:AppSettings;venues:{id:string;name:string}[];pending:boolean;onSave:(settings:AppSettings)=>void}){
 const {t}=useTranslation();const [draft,setDraft]=useState(config);
 return <section className="admin-control-card"><h2>{t('admin.control.featuredBanner')}</h2><form className="admin-settings-form" onSubmit={e=>{e.preventDefault();onSave(draft);}}>
  <label className="admin-checkbox-label"><input type="checkbox" checked={draft.featured_enabled} onChange={e=>setDraft({...draft,featured_enabled:e.target.checked})} />{t('admin.control.showBanner')}</label>
  <label>{t('admin.control.featuredPlace')}<select value={draft.featured_venue_id??''} onChange={e=>setDraft({...draft,featured_venue_id:e.target.value||null})}><option value="">{t('admin.control.automatic')}</option>{venues.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
  <label>{t('admin.control.titleMk')}<input maxLength={120} required value={draft.featured_title_mk} onChange={e=>setDraft({...draft,featured_title_mk:e.target.value})} /></label>
  <label>{t('admin.control.titleEn')}<input maxLength={120} required value={draft.featured_title_en} onChange={e=>setDraft({...draft,featured_title_en:e.target.value})} /></label>
  <button className="admin-dark-button" disabled={pending}>{t('common.save')}</button>
 </form></section>;
}
