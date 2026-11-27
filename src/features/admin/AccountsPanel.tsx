import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthProvider';
import { useConfirmation } from '@/ui/Confirmation';
import { fetchAccounts, setAccountRole, exportCsv } from './controlApi';
import { useAdminToast } from './AdminUi';

export function AccountsPanel() {
 const { t, i18n }=useTranslation();const { session }=useAuth();const confirm=useConfirmation();const {showToast}=useAdminToast();
 const cache=useQueryClient();const [search,setSearch]=useState('');const [role,setRole]=useState('all');
 const query=useQuery({queryKey:['admin','accounts'],queryFn:fetchAccounts});
 const change=useMutation({mutationFn:({id,role}:{id:string;role:string})=>setAccountRole(id,role),
  onSuccess:()=>{void cache.invalidateQueries({queryKey:['admin']});showToast(t('admin.saved'));},
  onError:e=>showToast(e.message,'danger')});
 const users=useMemo(()=>(query.data??[]).filter(u=>(role==='all'||u.role===role)&&[u.display_name,u.user_id].join(' ').toLowerCase().includes(search.toLowerCase())),[query.data,search,role]);
 return <div className="admin-control-page">
  <header className="admin-page-heading"><div><p className="admin-eyebrow">{t('admin.control.access')}</p><h1>{t('admin.nav.accounts')}</h1><p>{t('admin.control.accountsSubtitle')}</p></div><button className="admin-soft-button" onClick={()=>exportCsv('skochko-accounts.csv',users)}>{t('admin.control.export')}</button></header>
  <section className="admin-control-card">
   <div className="admin-table-tools"><input aria-label={t('common.search')} placeholder={t('admin.control.searchAccounts')} value={search} onChange={e=>setSearch(e.target.value)} /><select aria-label={t('admin.control.role')} value={role} onChange={e=>setRole(e.target.value)}><option value="all">{t('admin.control.allRoles')}</option><option value="member">{t('admin.control.member')}</option><option value="admin">{t('admin.control.administrator')}</option></select></div>
   {query.isError?<p role="alert">{t('admin.control.loadError')}</p>:query.isPending?<p>{t('common.loading')}</p>:<>
    <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>{t('admin.control.account')}</th><th>{t('admin.control.role')}</th><th>{t('admin.control.joined')}</th><th>{t('admin.control.actions')}</th></tr></thead><tbody>{users.map(u=><tr key={u.user_id}>
      <td><strong>{u.display_name||t('admin.control.unnamed')}</strong><small>{u.user_id}</small></td>
      <td><span className={'admin-status-badge '+(u.role==='admin'?'is-admin':'')}>{t(u.role==='admin'?'admin.control.administrator':'admin.control.member')}</span></td>
      <td>{new Intl.DateTimeFormat(i18n.language,{dateStyle:'medium',timeZone:'Europe/Skopje'}).format(new Date(u.created_at))}</td>
      <td>{u.user_id===session?.user.id?<span>{t('admin.control.you')}</span>:<button className="admin-soft-button" disabled={change.isPending} onClick={()=>confirm({
        title:t('admin.control.changeRole'),message:t('admin.control.roleConfirm',{name:u.display_name||u.user_id}),confirmLabel:t('common.confirm'),
        onConfirm:()=>change.mutate({id:u.user_id,role:u.role==='admin'?'member':'admin'})})}>{t(u.role==='admin'?'admin.control.makeMember':'admin.control.makeAdmin')}</button>}</td>
    </tr>)}</tbody></table></div>{!users.length&&<p className="admin-footnote">{t('admin.control.noAccounts')}</p>}
   </>}
  </section><p className="admin-footnote">{t('admin.control.roleNote')}</p>
 </div>;
}
