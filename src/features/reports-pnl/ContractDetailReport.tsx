import React, { useState } from 'react';
import { 
  Printer, 
  ChevronRight, 
  ChevronLeft, 
  Ship, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  Anchor, 
  FileText, 
  Wallet 
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { 
  formatUSD, 
  formatVND, 
  formatNumber, 
  formatDateVN, 
  formatShortBankName 
} from '../../utils/formatters';
import type { 
  Contract, 
  Shipment, 
  LogisticsCost, 
  PaymentTransaction,
  Customer
} from '../../types';

interface Props {
  contracts: Contract[];
  shipments: Shipment[];
  costs: LogisticsCost[];
  payments: PaymentTransaction[];
  customers?: Customer[];
  selectedSoHD?: string;
  onSelectSoHD?: (soHD: string) => void;
  onBackToOverview?: () => void;
  onEditContract?: (contract: Contract) => void;
}

export const ContractDetailReport: React.FC<Props> = ({
  contracts,
  shipments,
  costs,
  payments,
  customers = [],
  selectedSoHD,
  onSelectSoHD,
  onBackToOverview,
  onEditContract,
}) => {
  // If no soHD selected, default to the first contract
  const currentSoHD = selectedSoHD || contracts[0]?.soHD || '';
  const currentContract = contracts.find((c) => c.soHD === currentSoHD) || contracts[0];

  const [activeTab, setActiveTab] = useState<'ALL' | 'SHIPMENTS' | 'PAYMENTS' | 'COSTS' | 'FINANCE'>('ALL');

  if (!currentContract) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-base font-semibold">Chưa có hợp đồng nào trong hệ thống</p>
        <p className="text-xs text-slate-400 mt-1">Vui lòng tạo hợp đồng mới để xem báo cáo chi tiết.</p>
      </div>
    );
  }

  // Contract specs
  const c = currentContract;
  const matchedCustomer = customers.find(cust => cust.maKH === c.maKH || cust.tenKH.toLowerCase() === c.tenKH.toLowerCase());
  const sanLuongKy = c.sanLuongKy || 0;
  const dungSaiPercent = c.dungSaiPercent || 5;
  const sanLuongMin = sanLuongKy * (1 - dungSaiPercent / 100);
  const sanLuongMax = sanLuongKy * (1 + dungSaiPercent / 100);
  const donGiaUSD = c.donGiaUSD || 0;
  const tongGiaTriUSD = c.tongGiaTriUSD || (sanLuongKy * donGiaUSD);

  // Shipments for this contract
  const contractShipments = shipments.filter((s) => s.soHD === c.soHD);
  const totalShippedMT = contractShipments.reduce((sum, s) => sum + (s.sanLuongThucXuat || 0), 0);
  const totalShippedConts = contractShipments.reduce((sum, s) => sum + (s.soLuongCont || 0), 0);
  const shippedPercent = sanLuongKy > 0 ? (totalShippedMT / sanLuongKy) * 100 : 0;
  const remainingMT = Math.max(0, sanLuongKy - totalShippedMT);
  const isWithinTolerance = totalShippedMT >= sanLuongMin && totalShippedMT <= sanLuongMax;

  // Payments for this contract
  const contractPayments = payments.filter((p) => p.soHD === c.soHD);
  const totalPaidUSD = contractPayments.reduce((sum, p) => sum + (p.soTienUSD || 0), 0);
  const totalPaidVND = contractPayments.reduce((sum, p) => sum + (p.thanhTienVND || 0), 0);
  const paidPercent = tongGiaTriUSD > 0 ? (totalPaidUSD / tongGiaTriUSD) * 100 : 0;
  const remainingUSD = Math.max(0, tongGiaTriUSD - totalPaidUSD);
  const avgReceivedRate = totalPaidUSD > 0 ? totalPaidVND / totalPaidUSD : 25465;

  // Costs for this contract
  const contractCosts = costs.filter((cost) => cost.soHD === c.soHD);
  
  // 1. Logistics theo lô
  const logisticsCosts = contractCosts.filter((cost) => {
    if (cost.nhomChiPhi) return cost.nhomChiPhi === 'LOGISTICS';
    const k = cost.khoanMucChiPhi.toLowerCase();
    return k.includes('tàu') || k.includes('ocean') || k.includes('trucking') || 
           k.includes('vận tải') || k.includes('nâng hạ') || k.includes('cảng') || 
           k.includes('trọn gói') || k.includes('kiểm dịch') || k.includes('c/o') || k.includes('chứng từ');
  });
  const sumLogisticsVND = logisticsCosts.reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

  // 2. Bốc xếp
  const bocXepCosts = contractCosts.filter((cost) => {
    if (cost.nhomChiPhi) return cost.nhomChiPhi === 'BOC_XEP';
    return cost.khoanMucChiPhi.toLowerCase().includes('bốc');
  });
  const sumBocXepVND = bocXepCosts.reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

  // 3. Môi giới
  const moiGioiCosts = contractCosts.filter((cost) => {
    if (cost.nhomChiPhi) return cost.nhomChiPhi === 'MOI_GIOI';
    return cost.khoanMucChiPhi.toLowerCase().includes('cò') || cost.khoanMucChiPhi.toLowerCase().includes('hoa hồng');
  });
  const sumMoiGioiVND = moiGioiCosts.reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

  // 4. L/C & Ngân hàng
  const nganHangCosts = contractCosts.filter((cost) => {
    if (cost.nhomChiPhi) return cost.nhomChiPhi === 'NGAN_HANG';
    return cost.khoanMucChiPhi.toLowerCase().includes('ngân hàng') || cost.khoanMucChiPhi.toLowerCase().includes('l/c');
  });
  const sumNganHangVND = nganHangCosts.reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

  // 5. Chi phí khác
  const khacCosts = contractCosts.filter((cost) => cost.nhomChiPhi === 'KHAC');
  const sumKhacVND = khacCosts.reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

  // Total export cost (5 groups)
  const totalCostsVND = sumLogisticsVND + sumBocXepVND + sumMoiGioiVND + sumNganHangVND + sumKhacVND;
  const paidCostsVND = contractCosts
    .filter((c) => c.tinhTrangThanhToan === 'DA_THANH_TOAN')
    .reduce((sum, c) => sum + (c.thanhTienVND || 0), 0);
  const unpaidCostsVND = totalCostsVND - paidCostsVND;

  // Financial performance
  const expectedRemainingVND = remainingUSD * 25465;
  const finalRevenueVND = totalPaidVND > 0 
    ? (totalPaidVND + expectedRemainingVND) 
    : (tongGiaTriUSD * 25465);
  const netRevenueVND = finalRevenueVND - totalCostsVND;
  const marginPercent = finalRevenueVND > 0 ? (netRevenueVND / finalRevenueVND) * 100 : 0;
  const costPerMT = sanLuongKy > 0 ? totalCostsVND / sanLuongKy : 0;
  const netRevenuePerMT = sanLuongKy > 0 ? netRevenueVND / sanLuongKy : 0;

  // Due date calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let daysDiff: number | null = null;
  if (c.hanGiaoHangCuoi) {
    const dueDate = new Date(c.hanGiaoHangCuoi);
    dueDate.setHours(0, 0, 0, 0);
    daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Navigation handlers
  const currentIndex = contracts.findIndex((item) => item.soHD === currentContract.soHD);
  const prevContract = currentIndex > 0 ? contracts[currentIndex - 1] : null;
  const nextContract = currentIndex < contracts.length - 1 ? contracts[currentIndex + 1] : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4 print:text-black">
      {/* ==================== TOP CONTROLS (HIDDEN WHEN PRINTING) ==================== */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Back button & Contract Selector */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onBackToOverview && (
              <button
                onClick={onBackToOverview}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                title="Quay lại bảng P&L tổng hợp"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Chọn Hợp Đồng Cần Xem Báo Cáo
              </label>
              <select
                value={currentContract.soHD}
                onChange={(e) => onSelectSoHD && onSelectSoHD(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {contracts.map((item) => (
                  <option key={item.id || item.soHD} value={item.soHD}>
                    {item.soHD} • {item.tenKH} • {item.maHang} ({formatNumber(item.sanLuongKy)} MT - {formatUSD(item.tongGiaTriUSD)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons: Prev / Next / Print / Edit */}
          <div className="flex items-center gap-2 shrink-0 justify-end">
            <button
              disabled={!prevContract}
              onClick={() => prevContract && onSelectSoHD && onSelectSoHD(prevContract.soHD)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Hợp đồng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={!nextContract}
              onClick={() => nextContract && onSelectSoHD && onSelectSoHD(nextContract.soHD)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Hợp đồng kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {onEditContract && (
              <button
                onClick={() => onEditContract(currentContract)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                Sửa HĐ
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>In Báo Cáo (A4)</span>
            </button>
          </div>
        </div>

        {/* Filter Sub-Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất Cả Chi Tiết (Toàn Diện)
          </button>
          <button
            onClick={() => setActiveTab('SHIPMENTS')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'SHIPMENTS'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đợt Xuất Hàng ({contractShipments.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'PAYMENTS'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tiền Về & Công Nợ ({contractPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('COSTS')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'COSTS'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bảng Kê Chi Phí ({contractCosts.length})
          </button>
          <button
            onClick={() => setActiveTab('FINANCE')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'FINANCE'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Hiệu Quả & Doanh Thu Thuần
          </button>
        </div>
      </div>

      {/* ==================== PRINT FORM HEADER (ONLY VISIBLE ON PRINT) ==================== */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              BÁO CÁO TỔNG HỢP VÀ CHI TIẾT HỢP ĐỒNG BÁN
            </h1>
            <p className="text-xs text-slate-600 mt-1">Hệ Thống Quản Lý Xuất Khẩu Nông Sản & Tinh Bột Sắn</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-bold text-slate-900">Số HĐ: {c.soHD}</p>
            <p>Ngày in: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* ==================== 4 TOP KPI SUMMARY CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
        {/* Card 1: Giao hàng */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs print:p-2.5 print:rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Tiến Độ Giao Hàng</span>
            <Ship className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-extrabold text-slate-900">{formatNumber(totalShippedMT)} MT</span>
            <span className="text-[10.5px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
              {shippedPercent.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Mục tiêu: <strong className="text-slate-800">{formatNumber(sanLuongKy)} MT</strong> (±{dungSaiPercent}%)
          </p>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full transition-all duration-500 ${
                isWithinTolerance ? 'bg-emerald-500' : totalShippedMT > sanLuongMax ? 'bg-rose-500' : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(100, shippedPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-slate-400 mt-1">
            <span>Đã xuất {totalShippedConts} cont</span>
            <span>Còn thiếu: {formatNumber(remainingMT)} MT</span>
          </div>
        </div>

        {/* Card 2: Tiền về */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs print:p-2.5 print:rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Tiền Về & Công Nợ</span>
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-extrabold text-emerald-600">{formatUSD(totalPaidUSD)}</span>
            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              {paidPercent.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tổng HĐ: <strong className="text-slate-800">{formatUSD(tongGiaTriUSD)}</strong>
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, paidPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-slate-400 mt-1">
            <span>Thực nhận: {formatVND(totalPaidVND)}</span>
            <span className="text-rose-600 font-semibold">Còn: {formatUSD(remainingUSD)}</span>
          </div>
        </div>

        {/* Card 3: Chi phí xuất khẩu */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs print:p-2.5 print:rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Chi Phí Xuất Khẩu (5 Nhóm)</span>
            <Wallet className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-extrabold text-rose-700">{formatVND(totalCostsVND)}</span>
            <span className="text-[11px] font-bold text-slate-500">
              {contractCosts.length} khoản
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            TB: <strong className="text-slate-800">{formatVND(costPerMT)}</strong> / MT
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2 flex">
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: totalCostsVND > 0 ? `${(paidCostsVND / totalCostsVND) * 100}%` : '0%' }}
              title="Đã thanh toán"
            />
            <div 
              className="h-full bg-amber-400" 
              style={{ width: totalCostsVND > 0 ? `${(unpaidCostsVND / totalCostsVND) * 100}%` : '0%' }}
              title="Chưa thanh toán"
            />
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-slate-400 mt-1">
            <span className="text-emerald-700 font-medium">Đã trả: {formatVND(paidCostsVND)}</span>
            <span className="text-amber-700 font-medium">Nợ NCC: {formatVND(unpaidCostsVND)}</span>
          </div>
        </div>

        {/* Card 4: Doanh thu thuần */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs print:p-2.5 print:rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Doanh Thu Thuần (P&L)</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-extrabold text-emerald-600">{formatVND(netRevenueVND)}</span>
            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              {marginPercent.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Quy đổi: <strong className="text-slate-800">{formatVND(finalRevenueVND)}</strong>
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, marginPercent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-slate-400 mt-1">
            <span>Thuần/tấn: {formatVND(netRevenuePerMT)}</span>
            <span className="text-emerald-700 font-semibold">{marginPercent.toFixed(1)}% thu về</span>
          </div>
        </div>
      </div>

      {/* ==================== ALERT BANNER IF APPLICABLE ==================== */}
      <div className="print:hidden">
        {daysDiff !== null && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            daysDiff < 0 
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : daysDiff <= 7 
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2.5">
              <Clock className={`w-5 h-5 shrink-0 ${daysDiff < 0 ? 'text-rose-600' : daysDiff <= 7 ? 'text-amber-600' : 'text-slate-500'}`} />
              <div>
                <span className="font-bold text-xs">Hạn Chót Giao Hàng: {formatDateVN(c.hanGiaoHangCuoi)}</span>
                <span className="text-xs ml-2">
                  {daysDiff < 0 
                    ? `(Đã quá hạn ${Math.abs(daysDiff)} ngày - Cần gia hạn hoặc hoàn tất thanh lý)`
                    : daysDiff === 0 
                    ? '(Hôm nay là hạn giao hàng cuối cùng!)'
                    : `(Còn ${daysDiff} ngày để hoàn tất các đợt xuất)`}
                </span>
              </div>
            </div>
            <div className="text-right text-xs shrink-0">
              <span className="font-medium">Trạng thái HĐ: </span>
              <Badge status={c.trangThaiHD} />
            </div>
          </div>
        )}
      </div>

      {/* ==================== SECTION 1: HỒ SƠ & ĐIỀU KHOẢN THƯƠNG MẠI ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:rounded-none print:shadow-none print:border">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              1. Thông Tin Hợp Đồng & Điều Khoản Thương Mại
            </h2>
          </div>
          <Badge status={c.trangThaiHD} />
        </div>

        <div className="p-5 print:p-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Số Hợp Đồng:</span>
              <span className="font-extrabold text-slate-900 text-sm">{c.soHD}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Ngày Ký Kết:</span>
              <span className="font-bold text-slate-800">{formatDateVN(c.ngayKy)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Khách Hàng (Người Mua):</span>
              <span className="font-bold text-slate-900">{c.tenKH}</span>
              <span className="text-[11px] text-slate-400 block">Mã: {c.maKH}</span>
              {matchedCustomer?.diaChiChiTiet && (
                <span className="text-[11px] text-slate-600 block mt-1 pt-1 border-t border-slate-200/60" title={matchedCustomer.diaChiChiTiet}>
                  <strong className="text-slate-500 font-medium">Đ/c:</strong> {matchedCustomer.diaChiChiTiet}
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Hạn Giao Hàng Chót:</span>
              <span className="font-bold text-slate-900">{formatDateVN(c.hanGiaoHangCuoi)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Mặt Hàng Xuất Khẩu:</span>
              <span className="font-bold text-slate-900">{c.maHang}</span>
              <span className="text-[11px] text-slate-500 block">{c.quyCachDongGoi}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Sản Lượng Ký Kết:</span>
              <span className="font-extrabold text-slate-900 text-sm">{formatNumber(sanLuongKy)} MT</span>
              <span className="text-[11px] text-slate-500 block">
                Dung sai ±{dungSaiPercent}% ({formatNumber(sanLuongMin)} - {formatNumber(sanLuongMax)} MT)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Đơn Giá Xuất Khẩu:</span>
              <span className="font-extrabold text-emerald-700 text-sm">${c.donGiaUSD} USD / MT</span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <span className="text-emerald-700 block mb-0.5 font-semibold">Tổng Trị Giá Hợp Đồng:</span>
              <span className="font-black text-emerald-800 text-base">{formatUSD(tongGiaTriUSD)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Hình Thức Thanh Toán:</span>
              <span className="font-bold text-slate-900">{c.hinhThucTT}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Số L/C Đã Mở:</span>
              <span className="font-mono font-bold text-sky-800">
                {c.soLC || '—'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Ngân Hàng Nhận Tiền / L/C:</span>
              <span className="font-bold text-sky-800">{formatShortBankName(c.nganHangLC) || c.nganHangLC || 'Chưa thiết lập'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Ghi Chú Hợp Đồng:</span>
              <span className="text-slate-700 italic">{c.ghiChu || 'Không có ghi chú thêm.'}</span>
            </div>
          </div>

          {/* Destination Ports Allocation Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-emerald-600" />
              Kế Hoạch Cảng Dỡ & Phân Bổ Container Cho Từng Cảng Đến
            </h3>

            {c.danhSachCangDen && c.danhSachCangDen.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 text-[11px] whitespace-nowrap">
                    <tr>
                      <th className="py-1.5 px-2.5">STT</th>
                      <th className="py-1.5 px-2.5">Tên Cảng Đến (Discharge Port)</th>
                      <th className="py-1.5 px-2.5 text-right">Sản Lượng (MT)</th>
                      <th className="py-1.5 px-2.5 text-center">Số Lượng Container</th>
                      <th className="py-1.5 px-2.5 text-center">Loại Cont</th>
                      <th className="py-1.5 px-2.5">Ghi Chú Cảng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12px]">
                    {c.danhSachCangDen.map((port, idx) => (
                      <tr key={port.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-1.5 px-2.5 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-800">{port.cangDen}</td>
                        <td className="py-1.5 px-2.5 text-right font-extrabold text-emerald-700">
                          {formatNumber(port.sanLuongMT)} MT
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-bold text-slate-800">
                          {port.soLuongCont ? `${port.soLuongCont} cont` : '—'}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10.5px]">
                            {port.loaiCont || '20ft'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500 text-[11.5px]">{port.ghiChu || '—'}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200 text-[12px]">
                      <td colSpan={2} className="py-1.5 px-2.5 text-slate-700">TỔNG CỘNG PHÂN BỔ:</td>
                      <td className="py-1.5 px-2.5 text-right text-emerald-800">
                        {formatNumber(c.danhSachCangDen.reduce((s, p) => s + (p.sanLuongMT || 0), 0))} MT
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-slate-900">
                        {c.danhSachCangDen.reduce((s, p) => s + (p.soLuongCont || 0), 0)} cont
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[12px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                Cảng đến mặc định: <strong className="text-slate-800">{c.cangDen || 'Chưa chỉ định cảng'}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ==================== SECTION 2: CÁC ĐỢT XUẤT HÀNG (SHIPMENTS) ==================== */}
      {(activeTab === 'ALL' || activeTab === 'SHIPMENTS') && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden print:rounded-none print:shadow-none print:border">
          <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-sky-600" />
              <h2 className="text-[12.5px] font-bold text-slate-800 uppercase tracking-wide">
                2. Tiến Độ Các Đợt Thực Xuất Hàng ({contractShipments.length} đợt)
              </h2>
            </div>
            <span className="text-[11.5px] font-semibold text-slate-500">
              Đã xuất: <strong className="text-emerald-700">{formatNumber(totalShippedMT)} MT</strong> / {formatNumber(sanLuongKy)} MT
            </span>
          </div>

          <div className="p-3 print:p-2">
            {contractShipments.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Chưa có đợt xuất hàng nào được tạo cho hợp đồng này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px] whitespace-nowrap">
                      <th className="py-2 px-2.5">Mã Lô Xuất</th>
                      <th className="py-2 px-2.5">B/L / Booking</th>
                      <th className="py-2 px-2.5">Số Tờ Khai HQ</th>
                      <th className="py-2 px-2.5 text-right">Sản Lượng (MT)</th>
                      <th className="py-2 px-2.5 text-center">Số Cont</th>
                      <th className="py-2 px-2.5">Cảng Đi ➔ Đến</th>
                      <th className="py-2 px-2.5">Hãng Tàu / Chuyến</th>
                      <th className="py-2 px-2.5">Lịch Trình (ATD - ETA)</th>
                      <th className="py-2 px-2.5 text-right">Tỷ Giá</th>
                      <th className="py-2 px-2.5 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12px] leading-snug">
                    {contractShipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                          {shipment.maDotXuat}
                        </td>
                        <td className="py-2 px-2.5 font-medium text-slate-800 whitespace-nowrap">
                          {shipment.soBLBooking || '—'}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">
                          {shipment.soToKhaiHaiQuan || '—'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                          {formatNumber(shipment.sanLuongThucXuat)} MT
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold text-slate-700 whitespace-nowrap">
                          {shipment.soLuongCont} {shipment.loaiCont}
                        </td>
                        <td className="py-2 px-2.5 text-slate-700">
                          <div className="font-semibold text-slate-800">{shipment.cangDi}</div>
                          <div className="text-[10.5px] text-slate-400">➔ {shipment.cangDen}</div>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700">
                          <div className="font-semibold text-slate-800">{shipment.hangTau}</div>
                          <div className="text-[10.5px] text-slate-500">{shipment.tenTauChuyen}</div>
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap text-[11px]">
                          <div>ATD: <strong className="text-slate-800">{formatDateVN(shipment.ngayTauChayATD)}</strong></div>
                          <div className="text-[10.5px] text-slate-400">ETA: {formatDateVN(shipment.ngayDenETA)}</div>
                        </td>
                        <td className="py-2 px-2.5 text-right text-slate-700 font-mono text-[11px] whitespace-nowrap">
                          {formatNumber(shipment.tyGiaThucTe || 25465)}
                        </td>
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          <Badge status={shipment.trangThaiLoHang} />
                        </td>
                      </tr>
                    ))}
                    {/* Summary row */}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-[12px]">
                      <td colSpan={3} className="py-2 px-2.5 text-slate-800 uppercase">
                        Tổng Sản Lượng Đã Xuất:
                      </td>
                      <td className="py-2 px-2.5 text-right text-emerald-700 font-black text-[12.5px]">
                        {formatNumber(totalShippedMT)} MT
                      </td>
                      <td className="py-2 px-2.5 text-center text-slate-900 font-bold">
                        {totalShippedConts} cont
                      </td>
                      <td colSpan={5} className="py-2 px-2.5 text-right text-slate-600 text-[11px]">
                        Đạt <strong>{shippedPercent.toFixed(1)}%</strong> hợp đồng {isWithinTolerance && '(✓ Nằm trong dung sai hợp lệ)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SECTION 3: TIỀN VỀ & DÒNG TIỀN (PAYMENTS) ==================== */}
      {(activeTab === 'ALL' || activeTab === 'PAYMENTS') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:rounded-none print:shadow-none print:border">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                3. Tiến Độ Tiền Về & Công Nợ Khách Hàng ({contractPayments.length} giao dịch)
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Đã thu: <strong className="text-emerald-600">{formatUSD(totalPaidUSD)}</strong> ({paidPercent.toFixed(1)}%)
            </span>
          </div>

          <div className="p-4 print:p-2">
            {contractPayments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa ghi nhận khoản thanh toán / tiền về nào cho hợp đồng này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <th className="py-2 px-2.5">Mã GD</th>
                      <th className="py-2 px-2.5">Đợt Thanh Toán</th>
                      <th className="py-2 px-2.5">Ngày Tiền Về</th>
                      <th className="py-2 px-2.5">Hình Thức</th>
                      <th className="py-2 px-2.5 text-right">Số Tiền (USD)</th>
                      <th className="py-2 px-2.5 text-right">Tỷ Giá Quy Đổi</th>
                      <th className="py-2 px-2.5 text-right">Thành Tiền (VND)</th>
                      <th className="py-2 px-2.5">Ngân Hàng Nhận</th>
                      <th className="py-2 px-2.5">Mã Điện MT103</th>
                      <th className="py-2 px-2.5">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12px]">
                    {contractPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-2.5 font-bold text-slate-900 whitespace-nowrap">{p.maGiaoDich}</td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-800 whitespace-nowrap">{p.dotThanhToan}</td>
                        <td className="py-1.5 px-2.5 text-slate-700 whitespace-nowrap">{formatDateVN(p.ngayTienVe)}</td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10.5px] border border-purple-200">
                            {p.hinhThuc}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-black text-emerald-600 whitespace-nowrap">
                          {formatUSD(p.soTienUSD)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-medium text-slate-600 whitespace-nowrap">
                          {formatNumber(p.tyGiaThucNhan)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatVND(p.thanhTienVND)}
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-sky-800 whitespace-nowrap">
                          {formatShortBankName(p.nganHangNhan) || p.nganHangNhan}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500 font-mono text-[10.5px] whitespace-nowrap">
                          {p.maDienMT103 || '—'}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500">{p.ghiChu || '—'}</td>
                      </tr>
                    ))}
                    {/* Summary row */}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-[12px]">
                      <td colSpan={4} className="py-2 px-2.5 text-slate-800 uppercase text-[11px]">
                        Tổng Tiền Đã Thực Nhận Vào Tài Khoản:
                      </td>
                      <td className="py-2 px-2.5 text-right text-emerald-700 font-black">
                        {formatUSD(totalPaidUSD)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-500 text-[11px]">
                        TB: {formatNumber(avgReceivedRate)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-emerald-700 font-black">
                        {formatVND(totalPaidVND)}
                      </td>
                      <td colSpan={3} className="py-2 px-2.5 text-right text-rose-600 text-[11.5px]">
                        Còn phải thu (Công nợ): <strong>{formatUSD(remainingUSD)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SECTION 4: BẢNG KÊ TẤT CẢ CHI PHÍ PHÁT SINH ==================== */}
      {(activeTab === 'ALL' || activeTab === 'COSTS') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:rounded-none print:shadow-none print:border">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                4. Bảng Kê Chi Tiết Từng Khoản Chi Phí Phát Sinh ({contractCosts.length} khoản mục)
              </h2>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-500">Tổng Chi Phí: </span>
              <strong className="text-rose-700 text-sm">{formatVND(totalCostsVND)}</strong>
            </div>
          </div>

          <div className="p-4 print:p-2 space-y-4">
            {/* Sub-totals by 5 cost groups */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2 bg-sky-50 border border-sky-100 rounded-lg">
                <span className="text-sky-700 font-semibold block text-[10.5px]">1. Logistics Lô</span>
                <span className="font-extrabold text-sky-900 text-[11.5px]">{formatVND(sumLogisticsVND)}</span>
                <span className="text-[10px] text-sky-600 block mt-0.5">{logisticsCosts.length} dòng</span>
              </div>

              <div className="p-2 bg-orange-50 border border-orange-100 rounded-lg">
                <span className="text-orange-700 font-semibold block text-[10.5px]">2. Phí Bốc Xếp</span>
                <span className="font-extrabold text-orange-900 text-[11.5px]">{formatVND(sumBocXepVND)}</span>
                <span className="text-[10px] text-orange-600 block mt-0.5">{bocXepCosts.length} dòng</span>
              </div>

              <div className="p-2 bg-teal-50 border border-teal-100 rounded-lg">
                <span className="text-teal-700 font-semibold block text-[10.5px]">3. Môi Giới / Cò</span>
                <span className="font-extrabold text-teal-900 text-[11.5px]">{formatVND(sumMoiGioiVND)}</span>
                <span className="text-[10px] text-teal-600 block mt-0.5">{moiGioiCosts.length} dòng</span>
              </div>

              <div className="p-2 bg-purple-50 border border-purple-100 rounded-lg">
                <span className="text-purple-700 font-semibold block text-[10.5px]">4. L/C & Ngân Hàng</span>
                <span className="font-extrabold text-purple-900 text-[11.5px]">{formatVND(sumNganHangVND)}</span>
                <span className="text-[10px] text-purple-600 block mt-0.5">{nganHangCosts.length} dòng</span>
              </div>

              <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg col-span-2 sm:col-span-1">
                <span className="text-slate-600 font-semibold block text-[10.5px]">5. Phí Khác</span>
                <span className="font-extrabold text-slate-900 text-[11.5px]">{formatVND(sumKhacVND)}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{khacCosts.length} dòng</span>
              </div>
            </div>

            {contractCosts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có chi phí nào phát sinh cho hợp đồng này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <th className="py-2 px-2.5">Nhóm Chi Phí</th>
                      <th className="py-2 px-2.5">Khoản Mục Chi Phí</th>
                      <th className="py-2 px-2.5">Đợt Xuất</th>
                      <th className="py-2 px-2.5">Nhà Cung Cấp / Đơn Vị</th>
                      <th className="py-2 px-2.5 text-right">SL Tính Phí</th>
                      <th className="py-2 px-2.5 text-right">Đơn Giá</th>
                      <th className="py-2 px-2.5 text-right">Thành Tiền (VND)</th>
                      <th className="py-2 px-2.5">Hóa Đơn / CT</th>
                      <th className="py-2 px-2.5 text-center">Tình Trạng</th>
                      <th className="py-2 px-2.5">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12px]">
                    {contractCosts.map((cost) => (
                      <tr key={cost.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <Badge status={cost.nhomChiPhi || 'LOGISTICS'} />
                          {cost.phuongAnLogistics && (
                            <span className="ml-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                              {cost.phuongAnLogistics === 'ALL_IN' ? 'All-in' : 'Xé lẻ'}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">
                          {cost.khoanMucChiPhi}
                        </td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-700 whitespace-nowrap">
                          {cost.maDotXuat || 'Toàn HĐ'}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-800 font-medium">
                          {cost.nhaCungCap}
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-slate-700 whitespace-nowrap">
                          {formatNumber(cost.soLuongTinhPhi)} {cost.donViTinh}
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-slate-600 whitespace-nowrap">
                          {cost.loaiTien === 'USD' ? `$${cost.donGia}` : formatVND(cost.donGia)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-extrabold text-rose-700 whitespace-nowrap">
                          {formatVND(cost.thanhTienVND)}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500 font-mono text-[10.5px] whitespace-nowrap">
                          {cost.soHoaDonChungTu || '—'}
                        </td>
                        <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                          <Badge status={cost.tinhTrangThanhToan} />
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500 text-[11px]">{cost.ghiChu || '—'}</td>
                      </tr>
                    ))}
                    {/* Summary row */}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-[12px]">
                      <td colSpan={6} className="py-2 px-2.5 text-slate-800 uppercase text-[11px]">
                        TỔNG CHI PHÍ PHÁT SINH CỦA HỢP ĐỒNG:
                      </td>
                      <td className="py-2 px-2.5 text-right text-rose-700 font-black">
                        {formatVND(totalCostsVND)}
                      </td>
                      <td colSpan={3} className="py-2 px-2.5 text-right text-[11.5px]">
                        <span className="text-emerald-700 font-bold">Đã trả: {formatVND(paidCostsVND)}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-amber-700 font-bold">Còn nợ NCC: {formatVND(unpaidCostsVND)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SECTION 5: BÁO CÁO KẾT QUẢ KINH DOANH & P&L ==================== */}
      {(activeTab === 'ALL' || activeTab === 'FINANCE') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:rounded-none print:shadow-none print:border">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                5. Báo Cáo Hiệu Quả Tài Chính & Doanh Thu Thuần (P&L Hợp Đồng)
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Tỷ lệ thu về: {marginPercent.toFixed(1)}%
            </span>
          </div>

          <div className="p-4 print:p-2">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                <div className="bg-slate-100/90 px-3.5 py-2 font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 text-[11.5px] uppercase tracking-wider">
                  <span>Khoản Mục Tài Chính</span>
                  <div className="flex items-center gap-6">
                    <span className="w-32 text-right">Số Tiền (VND)</span>
                    <span className="w-20 text-right">Tỷ Trọng (%)</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-[12px]">
                  {/* Revenue */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between bg-emerald-50/40 font-bold text-slate-900">
                    <div>
                      <span className="text-emerald-800 uppercase text-[12px]">I. Tổng Doanh Thu Xuất Khẩu Quy Đổi</span>
                      <p className="text-[10.5px] text-slate-500 font-normal">
                        Tiền thực nhận ({formatVND(totalPaidVND)}) + Dự kiến còn lại ({formatUSD(remainingUSD)})
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="w-32 text-right text-emerald-700 font-extrabold text-[12.5px]">{formatVND(finalRevenueVND)}</span>
                      <span className="w-20 text-right font-bold text-emerald-700">100.0%</span>
                    </div>
                  </div>

                  {/* 5 Cost Items */}
                  <div className="px-3.5 py-1.5 flex items-center justify-between text-slate-700 pl-6">
                    <span>1. Phí Logistics theo lô (Cước tàu, xe, nâng hạ, chứng từ, kiểm dịch)</span>
                    <div className="flex items-center gap-6">
                      <span className="w-32 text-right text-sky-800 font-semibold">{formatVND(sumLogisticsVND)}</span>
                      <span className="w-20 text-right text-slate-500">
                        {finalRevenueVND > 0 ? ((sumLogisticsVND / finalRevenueVND) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 flex items-center justify-between text-slate-700 pl-6">
                    <span>2. Chi phí bốc xếp nhân công (kho bãi)</span>
                    <div className="flex items-center gap-6">
                      <span className="w-32 text-right text-orange-800 font-semibold">{formatVND(sumBocXepVND)}</span>
                      <span className="w-20 text-right text-slate-500">
                        {finalRevenueVND > 0 ? ((sumBocXepVND / finalRevenueVND) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 flex items-center justify-between text-slate-700 pl-6">
                    <span>3. Chi phí môi giới / tiền cò</span>
                    <div className="flex items-center gap-6">
                      <span className="w-32 text-right text-teal-800 font-semibold">{formatVND(sumMoiGioiVND)}</span>
                      <span className="w-20 text-right text-slate-500">
                        {finalRevenueVND > 0 ? ((sumMoiGioiVND / finalRevenueVND) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 flex items-center justify-between text-slate-700 pl-6">
                    <span>4. Chi phí L/C & phí ngân hàng (mở, kiểm tra chứng từ, swift)</span>
                    <div className="flex items-center gap-6">
                      <span className="w-32 text-right text-purple-800 font-semibold">{formatVND(sumNganHangVND)}</span>
                      <span className="w-20 text-right text-slate-500">
                        {finalRevenueVND > 0 ? ((sumNganHangVND / finalRevenueVND) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>

                  {sumKhacVND > 0 && (
                    <div className="px-3.5 py-1.5 flex items-center justify-between text-slate-700 pl-6">
                      <span>5. Chi phí phát sinh khác</span>
                      <div className="flex items-center gap-6">
                        <span className="w-32 text-right text-slate-800 font-semibold">{formatVND(sumKhacVND)}</span>
                        <span className="w-20 text-right text-slate-500">
                          {finalRevenueVND > 0 ? ((sumKhacVND / finalRevenueVND) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total Costs */}
                  <div className="px-3.5 py-2 flex items-center justify-between bg-rose-50/40 font-bold text-rose-900 border-t border-slate-200">
                    <span className="uppercase text-[11.5px]">II. Tổng Chi Phí Xuất Khẩu & Dịch Vụ (1+2+3+4+5)</span>
                    <div className="flex items-center gap-6">
                      <span className="w-32 text-right text-rose-700 font-black text-[12.5px]">{formatVND(totalCostsVND)}</span>
                      <span className="w-20 text-right font-bold text-rose-700">
                        {finalRevenueVND > 0 ? ((totalCostsVND / finalRevenueVND) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>

                  {/* Net Revenue */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between bg-emerald-100/70 border-t-2 border-emerald-600 font-black text-slate-900 text-[13px]">
                    <div>
                      <span className="text-emerald-900 uppercase">III. DOANH THU THUẦN SAU CHI PHÍ (I - II)</span>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        Lợi nhuận gộp thực tế thu về của hợp đồng
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="w-32 text-right text-emerald-700 font-black text-sm">
                        {formatVND(netRevenueVND)}
                      </span>
                      <span className="w-20 text-right font-black text-emerald-700 text-xs">
                        {marginPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra unit economics metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600">Chi phí dịch vụ bình quân / tấn:</span>
                  <span className="font-extrabold text-slate-900">{formatVND(costPerMT)} / MT</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600">Doanh thu thuần bình quân / tấn:</span>
                  <span className="font-extrabold text-emerald-600">{formatVND(netRevenuePerMT)} / MT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINT SIGNATURE FOOTER ==================== */}
      <div className="hidden print:block pt-8 text-xs">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-bold text-slate-800 uppercase">Người Lập Báo Cáo</p>
            <p className="text-[11px] text-slate-400 mt-0.5">(Ký và ghi rõ họ tên)</p>
            <div className="h-20"></div>
          </div>
          <div>
            <p className="font-bold text-slate-800 uppercase">Phụ Trách Logistics & Cảng</p>
            <p className="text-[11px] text-slate-400 mt-0.5">(Ký và ghi rõ họ tên)</p>
            <div className="h-20"></div>
          </div>
          <div>
            <p className="font-bold text-slate-800 uppercase">Ban Giám Đốc Phê Duyệt</p>
            <p className="text-[11px] text-slate-400 mt-0.5">(Ký, đóng dấu)</p>
            <div className="h-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
