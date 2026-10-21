import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Bảng Điều Khiển Tổng Quan';
      case '/contracts': return 'Quản Lý Hợp Đồng Bán';
      case '/shipments': return 'Theo Dõi Đợt Xuất Hàng';
      case '/costs': return 'Chi Phí Vận Tải & Tàu Bè';
      case '/payments': return 'Theo Dõi Tiền Về & Thu Nợ';
      case '/reports': return 'Báo Cáo Hiệu Quả & P&L';
      case '/master': return 'Danh Mục Dữ Liệu Nguồn';
      default: return 'Quản Lý Hợp Đồng Bán Hàng';
    }
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 print:bg-white print:min-h-0">
      {/* Sidebar for Desktop */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 print:w-full">
        <div className="print:hidden">
          <Header title={title} />
        </div>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none">
          <Outlet />
        </main>

        {/* Bottom Navigation for Mobile */}
        <div className="print:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};
