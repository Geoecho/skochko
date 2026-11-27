import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const db = supabase as SupabaseClient;
export type DailyActivity = { day: string; users: number; routes: number; sessions: number };
export type Overview = {
 users: number; new_users: number; venues: number; active_venues: number; events: number; routes: number;
 public_routes: number; sessions: number; completed: number; active_users: number; checkins: number;
 favourites: number; reports: number; errors: number;
 quality: { photos: number; ratings: number; hours: number; stale: number };
 daily: DailyActivity[]; popular: { name: string; favourites: number }[];
};
export type AdminAccount = { user_id: string; display_name: string | null; role: 'admin' | 'member'; locale: string | null; created_at: string };
export type AppSettings = { id: string; featured_enabled: boolean; featured_venue_id: string | null; featured_title_mk: string; featured_title_en: string; updated_at?: string };
export type ClientError = { id: string; created_at: string; kind: string; message: string; path: string | null; app_version: string | null };
export type AuditEntry = { id: string; action: string; target_type: string; target_id: string; actor_id: string | null; created_at: string };
export async function fetchOverview(): Promise<Overview> {
 const { data, error } = await db.rpc('admin_overview'); if (error) throw error; return data as Overview;
}
export async function fetchAccounts(): Promise<AdminAccount[]> {
 const { data, error } = await db.from('profiles').select('user_id,display_name,role,locale,created_at').order('created_at', { ascending: false }).limit(1000);
 if (error) throw error; return data ?? [];
}
export async function setAccountRole(userId: string, role: string) {
 const { error } = await db.rpc('admin_set_user_role', { p_user_id: userId, p_role: role }); if (error) throw error;
}
export async function fetchAppSettings(): Promise<AppSettings | null> {
 const { data, error } = await db.from('app_settings').select('*').eq('id', 'public').maybeSingle(); if (error) throw error; return data;
}
export async function saveAppSettings(settings: AppSettings) {
 const { error } = await db.from('app_settings').upsert({ ...settings, id: 'public', updated_at: new Date().toISOString() });
 if (error) throw error;
}
export async function fetchClientErrors(): Promise<ClientError[]> {
 const { data, error } = await db.from('client_errors').select('id,created_at,kind,message,path,app_version').neq('kind','diag').order('created_at',{ascending:false}).limit(100);
 if (error) throw error; return data ?? [];
}
export async function fetchAudit(): Promise<AuditEntry[]> {
 const { data, error } = await db.from('admin_audit_log').select('*').order('created_at',{ascending:false}).limit(100);
 if (error) throw error; return data ?? [];
}
export function exportCsv(filename: string, rows: object[]) {
 if (!rows.length) return;
 const keys = Object.keys(rows[0]);
 const cell = (value: unknown) => {
   let s = String(value ?? '');
   if (/^\s*[=+@-]/.test(s)) s = "'" + s;
   return '"' + s.replaceAll('"','""') + '"';
 };
 const csv = [keys.map(cell).join(','),...rows.map(row=>keys.map(k=>cell((row as Record<string, unknown>)[k])).join(','))].join('\r\n');
 const url = URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}));
 const link = document.createElement('a'); link.href=url; link.download=filename; link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
