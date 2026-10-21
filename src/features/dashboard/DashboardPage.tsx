import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Ship, 
  DollarSign, 
  CreditCard, 
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { subscribeToContracts } from '../contracts/contractsService';
import { subscribeToShipments } from '../shipments/shipmentsService';
import { subscribeToCosts } from '../logistics-costs/costsService';
import { subscribeToPayments } from '../payments/paymentsService';
import { formatUSD, formatVND, formatNumber, formatDateVN, formatShortBankName } from '../../utils/formatters';
import type { Contract, Shipment, LogisticsCost, PaymentTransaction } from '../../types';

export const DashboardPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [costs, setCosts] = useState<LogisticsCost[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);

  useEffect(() => {
    const unsubContracts = subscribeToContracts(setContracts);
    const unsubShipments = subscribeToShipments(setShipments);
    const unsubCosts = subscribeToCosts(setCosts);
    const unsubPayments = subscribeToPayments(setPayments);

    return () => {
      if (unsubContracts) unsubContracts();
      if (unsubShipments) unsubShipments();
      if (unsubCosts) unsubCosts();
      if (unsubPayments) unsubPayments();
    };
  }, []);

  // Compute metrics
  const totalRevenueUSD = contracts.reduce((acc, c) => acc + (c.tongGiaTriUSD || 0), 0);
  const totalVolumeMT = contracts.reduce((acc, c) => acc + (c.sanLuongKy || 0), 0);
  const totalCostsVND = costs.reduce((acc, c) => acc + (c.thanhTienVND || 0), 0);
  const totalPaymentsVND = payments.reduce((acc, p) => acc + (p.thanhTienVND || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          title="Tổng Doanh Thu HĐ"
          value={formatUSD(totalRevenueUSD)}
          subValue={`${contracts.length} hợp đồng ký`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Tổng Sản Lượng"
          value={`${formatNumber(totalVolumeMT)} MT`}
          subValue="Khối lượng xuất khẩu"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Tổng Chi Phí Logistics"
          value={formatVND(totalCostsVND)}
          subValue={`${costs.length} khoản mục đã chi/phát sinh`}
          icon={DollarSign}
          color="amber"
        />
        <StatCard
          title="Tiền Về Thực Tế"
          value={formatVND(totalPaymentsVND)}
          subValue={`${payments.length} lượt thanh toán qua bank`}
          icon={CreditCard}
          color="purple"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Contracts Preview Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Hợp Đồng Gần Đây</span>
              <Link to="/contracts" className="text-xs text-slate-500 hover:text-emerald-600 font-medium flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {contracts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có hợp đồng nào.</p>
            ) : (
              <div className="space-y-2.5">
                {contracts.slice(0, 3).map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.soHD}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">{c.tenKH}</p>
                      {c.hanGiaoHangCuoi && (
                        <p className="text-[11px] text-amber-700 font-medium pt-0.5">
                          Hạn giao: {formatDateVN(c.hanGiaoHangCuoi)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-emerald-600">{formatUSD(c.tongGiaTriUSD)}</p>
                      <Badge status={c.trangThaiHD} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Shipments Preview Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Tiến Độ Các Lô Tàu</span>
              <Link to="/shipments" className="text-xs text-slate-500 hover:text-sky-600 font-medium flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {shipments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có lô hàng nào.</p>
            ) : (
              <div className="space-y-2.5">
                {shipments.slice(0, 3).map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5 text-sky-600" />
                        <span className="text-sm font-bold text-slate-800">{s.maDotXuat}</span>
                      </div>
                      <p className="text-xs text-slate-500">{s.hangTau} • {s.soLuongCont} cont ({s.loaiCont})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-600">{s.cangDen}</p>
                      <Badge status={s.trangThaiLoHang} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Tiền Về Gần Nhất</span>
              <Link to="/payments" className="text-xs text-slate-500 hover:text-purple-600 font-medium flex items-center gap-1">
                Chi tiết <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có giao dịch tiền về.</p>
            ) : (
              <div className="space-y-2.5">
                {payments.slice(0, 3).map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.dotThanhToan}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDateVN(p.ngayTienVe)} • {formatShortBankName(p.nganHangNhan)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-purple-600">{formatUSD(p.soTienUSD)}</p>
                      <p className="text-[11px] text-slate-400">{formatVND(p.thanhTienVND)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
