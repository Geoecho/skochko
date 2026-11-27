import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchOverview, exportCsv, type DailyActivity } from './controlApi';

export function OverviewPanel() {
 const { t, i18n } = useTranslation();
 const [metric,setMetric] = useState<'users'|'routes'|'sessions'>('sessions');
 const query = useQuery({queryKey:['admin','overview'],queryFn:fetchOverview,refetchInterval:60000});
 const data=query.data;
 if(query.isPending) return <div className="admin-control-page"><p>{t('common.loading')}</p></div>;
 if(query.isError) return <div className="admin-control-page"><p role="alert">{t('admin.control.loadError')}</p><button onClick={()=>void query.refetch()}>{t('common.retry')}</button></div>;
 if(!data) return null;
 const stats: [string,number,string][] = [
 ['users',data.users,t('admin.control.newThisWeek',{count:data.new_users})],
 ['activeUsers',data.active_users,t('admin.control.last7Days')],
 ['sessions',data.sessions,t('admin.control.completedCount',{count:data.completed})],
 ['routes',data.routes,t('admin.control.publicCount',{count:data.public_routes})],
 ['venues',data.active_venues,t('admin.control.totalCount',{count:data.venues})],
 ['events',data.events,t('admin.control.upcoming')],
 ['favourites',data.favourites,t('admin.control.savedPlaces')],
 ['reports',data.reports,t('admin.control.awaitingReview')],
 ];
 const max=Math.max(1,...data.daily.map(d=>d[metric]));
 return <div className="admin-control-page">
  <header className="admin-page-heading"><div><p className="admin-eyebrow">{t('admin.control.workspace')}</p><h1>{t('admin.nav.overview')}</h1><p>{t('admin.control.overviewSubtitle')}</p></div>
   <div className="admin-heading-actions"><button className="admin-soft-button" onClick={()=>exportCsv('skochko-activity.csv',data.daily)}>{t('admin.control.export')}</button><button className="admin-dark-button" disabled={query.isFetching} onClick={()=>void query.refetch()}>{t('admin.control.refresh')}</button></div>
  </header>
  <div className="admin-stat-grid">{stats.map(([key,value,detail])=><article className="admin-stat-card" key={key}><span>{t('admin.control.'+key)}</span><strong>{value.toLocaleString(i18n.language)}</strong><small>{detail}</small></article>)}</div>
  <div className="admin-dashboard-columns">
   <section className="admin-control-card"><div className="admin-card-heading"><div><h2>{t('admin.control.activity')}</h2><p>{t('admin.control.last14Days')}</p></div><select aria-label={t('admin.control.metric')} value={metric} onChange={e=>setMetric(e.target.value as keyof Pick<DailyActivity,'users'|'routes'|'sessions'>)}>{['sessions','routes','users'].map(m=><option key={m} value={m}>{t('admin.control.'+m)}</option>)}</select></div>
    <div className="admin-activity-chart" role="img" aria-label={t('admin.control.activityDescription',{count:data.daily.reduce((n,d)=>n+d[metric],0)})}>
     {data.daily.map(d=><div key={d.day} className="admin-chart-day" title={d.day+': '+d[metric]}><span className="admin-chart-value">{d[metric]}</span><div className="admin-chart-track"><span style={{height:d[metric] ? Math.max(4,d[metric]/max*100)+'%' : '2px',opacity:d[metric]?1:.2}} /></div><small>{new Intl.DateTimeFormat(i18n.language,{day:'2-digit',month:'short',timeZone:'Europe/Skopje'}).format(new Date(d.day+'T12:00:00Z'))}</small></div>)}
    </div><p className="admin-footnote">{t('admin.control.trackingNote')}</p>
   </section>
   <section className="admin-control-card"><h2>{t('admin.control.contentHealth')}</h2>{(['photos','ratings','hours'] as const).map(key=><div className="admin-quality-row" key={key}><div><span>{t('admin.control.'+key)}</span><strong>{data.quality[key]} / {data.venues}</strong></div><progress value={data.quality[key]} max={Math.max(1,data.venues)} /></div>)}<div className="admin-health-note"><strong>{data.quality.stale}</strong><span>{t('admin.control.staleGoogle')}</span></div><div className="admin-health-note"><strong>{data.errors}</strong><span>{t('admin.control.errors7Days')}</span></div></section>
  </div>
  <section className="admin-control-card"><h2>{t('admin.control.popular')}</h2>{data.popular.length?data.popular.map((v,n)=><div className="admin-simple-row" key={v.name}><span>{n+1}. {v.name}</span><strong>{v.favourites} ♥</strong></div>):<p className="admin-footnote">{t('admin.control.noActivity')}</p>}</section>
 </div>;
}
