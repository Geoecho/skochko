import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchClientErrors, fetchAudit, exportCsv } from './controlApi';

export function SystemPanel() {
 const { t, i18n }=useTranslation();const [view,setView]=useState<'errors'|'audit'>('errors');
 const errors=useQuery({queryKey:['admin','errors'],queryFn:fetchClientErrors,refetchInterval:60000});
 const audit=useQuery({queryKey:['admin','audit'],queryFn:fetchAudit,refetchInterval:60000});
 const date=(value:string)=>new Intl.DateTimeFormat(i18n.language,{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Skopje'}).format(new Date(value));
 const current=view==='errors'?errors:audit;
 return <div className="admin-control-page">
  <header className="admin-page-heading"><div><p className="admin-eyebrow">{t('admin.control.monitoring')}</p><h1>{t('admin.nav.system')}</h1><p>{t('admin.control.systemSubtitle')}</p></div><button className="admin-soft-button" onClick={()=>exportCsv('skochko-'+view+'.csv',view==='errors'?(errors.data??[]):(audit.data??[]))}>{t('admin.control.export')}</button></header>
  <div className="admin-segmented">{(['errors','audit'] as const).map(item=><button key={item} aria-pressed={view===item} onClick={()=>setView(item)}>{t('admin.control.'+item)}</button>)}</div>
  <section className="admin-control-card">
   {current.isPending?<p>{t('common.loading')}</p>:current.isError?<p role="alert">{t('admin.control.loadError')}</p>:view==='errors'?
    errors.data?.length?errors.data.map(e=><details className="admin-error-row" key={e.id}><summary><span className="admin-status-badge">{e.kind}</span><strong>{e.message.slice(0,140)}</strong><time>{date(e.created_at)}</time></summary><pre>{e.message}</pre><small>{e.path||'/'} · {e.app_version}</small></details>):<p>{t('admin.control.noErrors')}</p>
    :audit.data?.length?<div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>{t('admin.control.action')}</th><th>{t('admin.control.target')}</th><th>{t('admin.control.when')}</th></tr></thead><tbody>{audit.data.map(a=><tr key={a.id}><td>{a.action}</td><td><strong>{a.target_type}</strong><small>{a.target_id}</small></td><td>{date(a.created_at)}</td></tr>)}</tbody></table></div>:<p>{t('admin.control.noAudit')}</p>}
  </section><p className="admin-footnote">{t('admin.control.monitoringNote')}</p>
 </div>;
}
