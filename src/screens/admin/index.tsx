import { useState } from 'react';
import { OverviewPanel } from '@/features/admin/OverviewPanel';
import { AccountsPanel } from '@/features/admin/AccountsPanel';
import { SystemPanel } from '@/features/admin/SystemPanel';
import { SettingsPanel } from '@/features/admin/SettingsPanel';
import { AdminShell, type AdminTab } from '@/features/admin/AdminUi';
import { EventManager } from '@/features/admin/EventManager';
import { ModerationManager } from '@/features/admin/ModerationManager';
import { PromotionManager } from '@/features/admin/PromotionManager';
import { VenueManager } from '@/features/admin/VenueManager';

export default function AdminHome() {
  const [tab, setTab] = useState<AdminTab>('overview');
  return <AdminShell tab={tab} onTabChange={setTab}>{tab === 'overview' ? <OverviewPanel /> : tab === 'accounts' ? <AccountsPanel /> : tab === 'system' ? <SystemPanel /> : tab === 'settings' ? <SettingsPanel /> : tab === 'venues' ? <VenueManager /> : tab === 'events' ? <EventManager /> : tab === 'promotions' ? <PromotionManager /> : <ModerationManager />}</AdminShell>;
}
