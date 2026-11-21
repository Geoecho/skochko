import { useState } from 'react';
import { AdminShell, type AdminTab } from '@/features/admin/AdminUi';
import { EventManager } from '@/features/admin/EventManager';
import { ModerationManager } from '@/features/admin/ModerationManager';
import { PromotionManager } from '@/features/admin/PromotionManager';
import { VenueManager } from '@/features/admin/VenueManager';

export default function AdminHome() {
  const [tab, setTab] = useState<AdminTab>('venues');
  return <AdminShell tab={tab} onTabChange={setTab}>{tab === 'venues' ? <VenueManager /> : tab === 'events' ? <EventManager /> : tab === 'promotions' ? <PromotionManager /> : <ModerationManager />}</AdminShell>;
}
