import React, { useState } from 'react';
import { Sidebar, AdminTab } from '../components/layout/Sidebar';
import { Overview } from '../components/dashboard/Overview';
import { ProductsManager } from '../components/dashboard/ProductsManager';
import { OrdersManager } from '../components/dashboard/OrdersManager';
import { InventoryManager } from '../components/dashboard/InventoryManager';
import { CouponsManager } from '../components/dashboard/CouponsManager';
import { AuditLogManager } from '../components/dashboard/AuditLogManager';
import { UnmatchedPaymentsManager } from '../components/dashboard/UnmatchedPaymentsManager';
import { PosMonitoring } from '../components/pos/PosMonitoring';
import { HardwareDevicesManager } from '../components/pos/HardwareDevicesManager';

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
        {activeTab === 'overview'   && <Overview />}
        {activeTab === 'pos'        && <PosMonitoring />}
        {activeTab === 'products'   && <ProductsManager />}
        {activeTab === 'orders'     && <OrdersManager />}
        {activeTab === 'inventory'  && <InventoryManager />}
        {activeTab === 'coupons'    && <CouponsManager />}
        {activeTab === 'unmatched'  && <UnmatchedPaymentsManager />}
        {activeTab === 'audit'      && <AuditLogManager />}
        {activeTab === 'hardware'   && <HardwareDevicesManager />}
      </main>
    </div>
  );
};
