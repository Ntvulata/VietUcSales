import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, DollarSign, Award, FileText, BarChart3, Eye } from 'lucide-react';
import { subscribeToContracts } from '../contracts/contractsService';
import { subscribeToShipments } from '../shipments/shipmentsService';
import { subscribeToCosts } from '../logistics-costs/costsService';
import { subscribeToPayments } from '../payments/paymentsService';
import { subscribeToCustomers } from '../master-data/masterDataService';
import { ContractDetailReport } from './ContractDetailReport';
import { formatUSD, formatVND } from '../../utils/formatters';
import type { Contract, Shipment, LogisticsCost, PaymentTransaction, PnLSummary, Customer } from '../../types';

export const PnLReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const soHDFromUrl = searchParams.get('soHD');

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [costs, setCosts] = useState<LogisticsCost[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [reportTab, setReportTab] = useState<'DETAIL' | 'OVERVIEW'>(
    soHDFromUrl ? 'DETAIL' : 'DETAIL'
  );
  const [selectedSoHD, setSelectedSoHD] = useState<string>(soHDFromUrl || '');

  useEffect(() => {
    const unsubContracts = subscribeToContracts(setContracts);
    const unsubShipments = subscribeToShipments(setShipments);
    const unsubCosts = subscribeToCosts(setCosts);
    const unsubPayments = subscribeToPayments(setPayments);
    const unsubCustomers = subscribeToCustomers(setCustomers);

    return () => {
      if (unsubContracts) unsubContracts();
      if (unsubShipments) unsubShipments();
      if (unsubCosts) unsubCosts();
      if (unsubPayments) unsubPayments();
      if (unsubCustomers) unsubCustomers();
    };
  }, []);

  // Sync state if URL search param changes
  useEffect(() => {
    if (soHDFromUrl) {
      setSelectedSoHD(soHDFromUrl);
      setReportTab('DETAIL');
    }
  }, [soHDFromUrl]);

  // Compute P&L for each contract
  const pnlList: PnLSummary[] = contracts.map((c) => {
    // Contract costs
    const contractCosts = costs.filter((cost) => cost.soHD === c.soHD);

    // 1. Logistics theo lô (Cước tàu, xe, nâng hạ, kiểm dịch, chứng từ - All-in & Xé lẻ)
    const logisticsCosts = contractCosts
      .filter((cost) => {
        if (cost.nhomChiPhi) return cost.nhomChiPhi === 'LOGISTICS';
        const k = cost.khoanMucChiPhi.toLowerCase();
        return k.includes('tàu') || k.includes('ocean') || k.includes('trucking') || 
               k.includes('vận tải') || k.includes('nâng hạ') || k.includes('cảng') || 
               k.includes('trọn gói') || k.includes('kiểm dịch') || k.includes('c/o') || k.includes('chứng từ');
      })
      .reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

    // 2. Phí Bốc xếp riêng
    const bocXepCosts = contractCosts
      .filter((cost) => {
        if (cost.nhomChiPhi) return cost.nhomChiPhi === 'BOC_XEP';
        return cost.khoanMucChiPhi.toLowerCase().includes('bốc');
      })
      .reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

    // 3. Phí Môi giới riêng (Tiền cò)
    const moiGioiCosts = contractCosts
      .filter((cost) => {
        if (cost.nhomChiPhi) return cost.nhomChiPhi === 'MOI_GIOI';
        return cost.khoanMucChiPhi.toLowerCase().includes('cò') || cost.khoanMucChiPhi.toLowerCase().includes('hoa hồng');
      })
      .reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

    // 4. L/C & Phí Ngân hàng (nhiều dòng)
    const nganHangCosts = contractCosts
      .filter((cost) => {
        if (cost.nhomChiPhi) return cost.nhomChiPhi === 'NGAN_HANG';
        return cost.khoanMucChiPhi.toLowerCase().includes('ngân hàng') || cost.khoanMucChiPhi.toLowerCase().includes('l/c');
      })
      .reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

    // 5. Phí khác phát sinh
    const khacCosts = contractCosts
      .filter((cost) => cost.nhomChiPhi === 'KHAC')
      .reduce((sum, item) => sum + (item.thanhTienVND || 0), 0);

    // Revenue in VND (Default exchange rate: 25,465 VND/USD if payments not fully arrived)
    const contractPayments = payments.filter((p) => p.soHD === c.soHD);
    const actualReceivedVND = contractPayments.reduce((sum, p) => sum + (p.thanhTienVND || 0), 0);
    const expectedRevenueVND = (c.tongGiaTriUSD || 0) * 25465;
    const finalRevenueVND = actualReceivedVND > 0 
      ? (actualReceivedVND + ((c.tongGiaTriUSD || 0) - contractPayments.reduce((s, p) => s + (p.soTienUSD || 0), 0)) * 25465) 
      : expectedRevenueVND;

    // Total Export Logistics & Services Cost (5 groups)
    const tongChiPhiXuatKhauVND = logisticsCosts + bocXepCosts + moiGioiCosts + nganHangCosts + khacCosts;
    const loiNhuanGopVND = finalRevenueVND - tongChiPhiXuatKhauVND;
    const tySuatLoiNhuanPercent = finalRevenueVND > 0 ? (loiNhuanGopVND / finalRevenueVND) * 100 : 0;

    return {
      soHD: c.soHD,
      khachHang: c.tenKH,
      sanLuongMT: c.sanLuongKy,
      doanhThuUSD: c.tongGiaTriUSD,
      doanhThuVND: finalRevenueVND,
      tongChiPhiLogisticsVND: logisticsCosts,
      tongChiPhiBocXepVND: bocXepCosts,
      tongChiPhiMoiGioiVND: moiGioiCosts,
      tongChiPhiNganHangVND: nganHangCosts,
      tongChiPhiKhacVND: khacCosts,
      tongChiPhiXuatKhauVND,
      loiNhuanGopVND,
      tySuatLoiNhuanPercent,
    };
  });

  const totalRevenue = pnlList.reduce((acc, p) => acc + p.doanhThuVND, 0);
  const totalProfit = pnlList.reduce((acc, p) => acc + p.loiNhuanGopVND, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Tab Bar (Hidden when printing) */}
      <div className="print:hidden flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => {
            setReportTab('DETAIL');
            if (!selectedSoHD && contracts.length > 0) {
              const firstSoHD = contracts[0].soHD;
              setSelectedSoHD(firstSoHD);
              setSearchParams({ soHD: firstSoHD }, { replace: true });
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            reportTab === 'DETAIL'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Báo Cáo Chi Tiết Hợp Đồng</span>
        </button>

        <button
          onClick={() => {
            setReportTab('OVERVIEW');
            setSearchParams({}, { replace: true });
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            reportTab === 'OVERVIEW'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Bảng Tổng Hợp P&L So Sánh ({contracts.length} HĐ)</span>
        </button>
      </div>

      {/* VIEW 1: SINGLE CONTRACT DEEP DIVE REPORT */}
      {reportTab === 'DETAIL' ? (
        <ContractDetailReport
          contracts={contracts}
          shipments={shipments}
          costs={costs}
          payments={payments}
          customers={customers}
          selectedSoHD={selectedSoHD || contracts[0]?.soHD}
          onSelectSoHD={(soHD) => {
            setSelectedSoHD(soHD);
            setSearchParams({ soHD }, { replace: true });
          }}
          onBackToOverview={() => {
            setReportTab('OVERVIEW');
            setSearchParams({}, { replace: true });
          }}
        />
      ) : (
        /* VIEW 2: OVERALL COMPARISON SUMMARY TABLE */
        <div className="space-y-4">
          {/* Top Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tổng Doanh Thu Quy Đổi</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-extrabold text-slate-900">{formatVND(totalRevenue)}</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">Dựa trên tỷ giá xuất khẩu thực tế</p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-100 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-600 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Doanh Thu Thuần Sau Chi Phí</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-extrabold text-emerald-600">{formatVND(totalProfit)}</p>
              <p className="text-[10.5px] text-emerald-700/70 mt-0.5">Sau khi trừ toàn bộ 5 nhóm chi phí xuất khẩu</p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-sky-100 shadow-2xs">
              <div className="flex items-center justify-between text-sky-600 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Tỷ Lệ Thu Về Thực Tế</span>
                <Award className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-xl font-extrabold text-sky-600">{avgMargin.toFixed(1)}%</p>
              <p className="text-[10.5px] text-sky-700/70 mt-0.5">Tỷ lệ tiền thu về sau chi phí xuất khẩu</p>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2.5 px-2.5">Số HĐ</th>
                    <th className="py-2.5 px-2.5">Khách Hàng</th>
                    <th className="py-2.5 px-2 text-right">Doanh Thu (VND)</th>
                    <th className="py-2.5 px-2 text-right text-sky-700">1. Logistics</th>
                    <th className="py-2.5 px-2 text-right text-orange-700">2. Bốc Xếp</th>
                    <th className="py-2.5 px-2 text-right text-teal-700">3. Môi Giới</th>
                    <th className="py-2.5 px-2 text-right text-purple-700">4. L/C & Bank</th>
                    <th className="py-2.5 px-2 text-right">5. Khác</th>
                    <th className="py-2.5 px-2 text-right font-bold text-rose-700">TỔNG PHÍ</th>
                    <th className="py-2.5 px-2.5 text-right text-emerald-700">THU VỀ SAU PHÍ</th>
                    <th className="py-2.5 px-2 text-center">TỶ LỆ</th>
                    <th className="py-2.5 px-2 text-center">CHI TIẾT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px] leading-snug">
                  {pnlList.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-6 text-center text-slate-400 text-xs">
                        Chưa có dữ liệu hợp đồng để lập báo cáo P&L.
                      </td>
                    </tr>
                  ) : (
                    pnlList.map((p) => (
                      <tr key={p.soHD} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">{p.soHD}</td>
                        <td className="py-2 px-2.5 font-medium text-slate-700 max-w-[160px] truncate" title={p.khachHang}>{p.khachHang}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900 whitespace-nowrap">{formatVND(p.doanhThuVND)}</td>
                        <td className="py-2 px-2 text-right font-medium text-sky-800 whitespace-nowrap">{formatVND(p.tongChiPhiLogisticsVND)}</td>
                        <td className="py-2 px-2 text-right text-orange-800 whitespace-nowrap">{formatVND(p.tongChiPhiBocXepVND)}</td>
                        <td className="py-2 px-2 text-right text-teal-800 whitespace-nowrap">{formatVND(p.tongChiPhiMoiGioiVND)}</td>
                        <td className="py-2 px-2 text-right text-purple-800 whitespace-nowrap">{formatVND(p.tongChiPhiNganHangVND)}</td>
                        <td className="py-2 px-2 text-right text-slate-500 whitespace-nowrap">{formatVND(p.tongChiPhiKhacVND)}</td>
                        <td className="py-2 px-2 text-right font-bold text-rose-700 whitespace-nowrap">{formatVND(p.tongChiPhiXuatKhauVND)}</td>
                        <td className="py-2 px-2.5 text-right font-extrabold text-emerald-700 whitespace-nowrap text-[12.5px]">
                          {formatVND(p.loiNhuanGopVND)}
                        </td>
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            {p.tySuatLoiNhuanPercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedSoHD(p.soHD);
                              setReportTab('DETAIL');
                              setSearchParams({ soHD: p.soHD });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-all shadow-2xs"
                            title="Xem báo cáo chi tiết hợp đồng này"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Soi Chi Tiết</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="lg:hidden space-y-4">
            {pnlList.map((p) => (
              <div key={p.soHD} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hợp Đồng</span>
                    <h3 className="text-base font-bold text-slate-900">{p.soHD}</h3>
                    <p className="text-xs text-slate-500 font-medium">{p.khachHang}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.tySuatLoiNhuanPercent.toFixed(1)}% thu về
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Doanh thu quy đổi:</span>
                    <span className="font-bold text-slate-900">{formatVND(p.doanhThuVND)} ({formatUSD(p.doanhThuUSD)})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sky-700 font-medium">1. Logistics theo lô:</span>
                    <span className="font-semibold text-sky-800">{formatVND(p.tongChiPhiLogisticsVND)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-700 font-medium">2. Phí bốc xếp:</span>
                    <span className="text-orange-800 font-semibold">{formatVND(p.tongChiPhiBocXepVND)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-teal-700 font-medium">3. Phí môi giới / cò:</span>
                    <span className="text-teal-800 font-semibold">{formatVND(p.tongChiPhiMoiGioiVND)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 font-medium">4. L/C & Ngân hàng:</span>
                    <span className="text-purple-800 font-semibold">{formatVND(p.tongChiPhiNganHangVND)}</span>
                  </div>
                  {p.tongChiPhiKhacVND > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">5. Phí khác phát sinh:</span>
                      <span className="text-slate-800 font-semibold">{formatVND(p.tongChiPhiKhacVND)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-semibold">
                    <span className="text-rose-700">Tổng chi phí xuất khẩu:</span>
                    <span className="text-rose-700 font-bold">{formatVND(p.tongChiPhiXuatKhauVND)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-600">THU VỀ SAU CHI PHÍ:</span>
                  <span className="text-lg font-black text-emerald-600">{formatVND(p.loiNhuanGopVND)}</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedSoHD(p.soHD);
                    setReportTab('DETAIL');
                    setSearchParams({ soHD: p.soHD });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors border border-emerald-200/60"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem Báo Cáo Chi Tiết Hợp Đồng Này</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
