import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ContractsPage } from '../features/contracts/ContractsPage';
import { ShipmentsPage } from '../features/shipments/ShipmentsPage';
import { LogisticsCostsPage } from '../features/logistics-costs/LogisticsCostsPage';
import { PaymentsPage } from '../features/payments/PaymentsPage';
import { PnLReportsPage } from '../features/reports-pnl/PnLReportsPage';
import { MasterDataPage } from '../features/master-data/MasterDataPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="costs" element={<LogisticsCostsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="reports" element={<PnLReportsPage />} />
        <Route path="master" element={<MasterDataPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
