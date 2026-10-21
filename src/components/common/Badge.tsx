import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'green' | 'blue' | 'yellow' | 'purple' | 'red' | 'gray' | 'indigo' | 'amber';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, children }) => {
  const getStyle = () => {
    if (variant) {
      switch (variant) {
        case 'green': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'blue': return 'bg-sky-50 text-sky-700 border-sky-200';
        case 'yellow':
        case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'indigo': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'red': return 'bg-rose-50 text-rose-700 border-rose-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }

    switch (status) {
      case 'ACTIVE':
      case 'DA_LEN_TAU':
      case 'DA_THONG_QUAN':
      case 'DA_THANH_TOAN':
      case 'PAID':
      case 'HOAN_TAT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DRAFT':
      case 'DANG_DONG_HANG':
      case 'CHUA_THANH_TOAN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'COMPLETED':
      case 'DA_DEN_CANG':
      case 'LOGISTICS':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'BOC_XEP':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MOI_GIOI':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'NGAN_HANG':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'KHAC':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'ALL_IN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
      case 'XE_LE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'ACTIVE': return 'Đang thực hiện';
      case 'DRAFT': return 'Bản nháp';
      case 'COMPLETED': return 'Hoàn tất';
      case 'CANCELLED': return 'Đã hủy';
      case 'DANG_DONG_HANG': return 'Đang đóng hàng';
      case 'DA_LEN_TAU': return 'Đã lên tàu';
      case 'DA_THONG_QUAN': return 'Đã thông quan';
      case 'DA_DEN_CANG': return 'Đã đến cảng';
      case 'DA_THANH_TOAN':
      case 'PAID': return 'Đã thanh toán';
      case 'CHUA_THANH_TOAN': return 'Chưa thanh toán';
      case 'LOGISTICS': return 'Logistics theo lô';
      case 'BOC_XEP': return 'Bốc xếp';
      case 'MOI_GIOI': return 'Môi giới / Cò';
      case 'NGAN_HANG': return 'L/C & Ngân hàng';
      case 'KHAC': return 'Phí khác';
      case 'ALL_IN': return 'All-in (1 NCC)';
      case 'XE_LE': return 'Xé lẻ (Nhiều NCC)';
      case 'TRON_GOI': return 'Trọn gói';
      case 'TACH_LE': return 'Tách lẻ';
      default: return children || status;
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap leading-tight ${getStyle()}`}>
      {getLabel()}
    </span>
  );
};
