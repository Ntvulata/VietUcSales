import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Calendar, Trash2 } from 'lucide-react';
import { subscribeToPayments, savePayment, removePayment } from './paymentsService';
import { subscribeToContracts } from '../contracts/contractsService';
import { subscribeToBankAccounts, INITIAL_BANK_ACCOUNTS } from '../master-data/masterDataService';
import { Modal } from '../../components/common/Modal';
import { formatUSD, formatVND, formatNumber, formatDateVN, formatShortBankName } from '../../utils/formatters';
import type { PaymentTransaction, Contract, BankAccount } from '../../types';

export const PaymentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('soHD') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [maGiaoDich, setMaGiaoDich] = useState('');
  const [soHD, setSoHD] = useState('');
  const [maDotXuat, setMaDotXuat] = useState('');
  const [khachHang, setKhachHang] = useState('');
  const [dotThanhToan, setDotThanhToan] = useState('Thanh toán L/C Đợt 1');
  const [hinhThuc, setHinhThuc] = useState('L/C');
  const [soTienUSD, setSoTienUSD] = useState<number>(100000);
  const [tyGiaThucNhan, setTyGiaThucNhan] = useState<number>(25450);
  const [ngayTienVe, setNgayTienVe] = useState(new Date().toISOString().split('T')[0]);
  const [nganHangNhan, setNganHangNhan] = useState('Vietcombank');
  const [isCustomBank, setIsCustomBank] = useState(false);
  const [maDienMT103, setMaDienMT103] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [saving, setSaving] = useState(false);

  const displayBanks = bankAccounts.length > 0 ? bankAccounts : INITIAL_BANK_ACCOUNTS;

  useEffect(() => {
    const unsubPayments = subscribeToPayments(setPayments);
    const unsubContracts = subscribeToContracts(setContracts);
    const unsubBanks = subscribeToBankAccounts(setBankAccounts);

    return () => {
      if (unsubPayments) unsubPayments();
      if (unsubContracts) unsubContracts();
      if (unsubBanks) unsubBanks();
    };
  }, []);

  const totalUSD = payments.reduce((acc, p) => acc + (p.soTienUSD || 0), 0);
  const totalVND = payments.reduce((acc, p) => acc + (p.thanhTienVND || 0), 0);

  const openModalForContract = (c: Contract) => {
    setMaGiaoDich(`TT-00${payments.length + 1}`);
    setSoHD(c.soHD);
    setKhachHang(c.tenKH);
    setMaDotXuat('');
    setDotThanhToan(c.hinhThucTT === 'L/C' && c.soLC ? `Thanh toán L/C ${c.soLC}` : `Thanh toán HĐ ${c.soHD}`);
    setHinhThuc(c.hinhThucTT || 'L/C');
    setSoTienUSD(c.tongGiaTriUSD || 100000);
    setTyGiaThucNhan(25450);
    setNgayTienVe(new Date().toISOString().split('T')[0]);
    if (c.nganHangLC) {
      setNganHangNhan(formatShortBankName(c.nganHangLC) || c.nganHangLC);
    } else {
      setNganHangNhan('Vietcombank');
    }
    setIsCustomBank(false);
    setMaDienMT103('');
    setGhiChu(c.soLC ? `Số L/C: ${c.soLC}` : '');
    setIsModalOpen(true);
  };

  // Auto open modal when redirected from contract status change to PAID
  useEffect(() => {
    const targetSoHD = searchParams.get('soHD');
    const shouldCreate = searchParams.get('create') === 'true' || searchParams.get('create') === '1';

    if (shouldCreate && targetSoHD && contracts.length > 0 && !isModalOpen) {
      const c = contracts.find(item => item.soHD === targetSoHD);
      if (c) {
        openModalForContract(c);
        setSearchParams({ soHD: targetSoHD }, { replace: true });
      }
    }
  }, [searchParams, contracts]);

  const openAddModal = () => {
    setMaGiaoDich(`TT-00${payments.length + 1}`);
    const firstContract = contracts[0];
    setSoHD(firstContract?.soHD || '');
    setKhachHang(firstContract?.tenKH || '');
    setMaDotXuat('');
    setDotThanhToan('Thanh toán L/C Đợt 1');
    setHinhThuc(firstContract?.hinhThucTT || 'L/C');
    setSoTienUSD(firstContract?.tongGiaTriUSD || 100000);
    setTyGiaThucNhan(25450);
    setNgayTienVe(new Date().toISOString().split('T')[0]);
    setNganHangNhan(firstContract?.nganHangLC ? (formatShortBankName(firstContract.nganHangLC) || firstContract.nganHangLC) : 'Vietcombank');
    setIsCustomBank(false);
    setMaDienMT103('');
    setGhiChu(firstContract?.soLC ? `Số L/C: ${firstContract.soLC}` : '');
    setIsModalOpen(true);
  };

  const handleContractSelect = (selectedSoHD: string) => {
    setSoHD(selectedSoHD);
    const c = contracts.find(item => item.soHD === selectedSoHD);
    if (c) {
      setKhachHang(c.tenKH);
      if (c.tongGiaTriUSD) setSoTienUSD(c.tongGiaTriUSD);
      if (c.hinhThucTT) setHinhThuc(c.hinhThucTT);
      if (c.nganHangLC) setNganHangNhan(formatShortBankName(c.nganHangLC) || c.nganHangLC);
      if (c.soLC) setGhiChu(`Số L/C: ${c.soLC}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const thanhTienVND = Number(soTienUSD) * Number(tyGiaThucNhan);
      await savePayment({
        maGiaoDich,
        soHD,
        maDotXuat,
        khachHang,
        dotThanhToan,
        hinhThuc,
        soTienUSD: Number(soTienUSD),
        tyGiaThucNhan: Number(tyGiaThucNhan),
        thanhTienVND,
        ngayTienVe,
        nganHangNhan,
        maDienMT103,
        ghiChu,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      alert('Lỗi lưu giao dịch tiền về: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Bạn muốn xóa giao dịch ${code}?`)) {
      await removePayment(id);
    }
  };

  const filteredPayments = payments.filter((p) => {
    return (
      p.maGiaoDich.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.soHD.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.khachHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.maDienMT103 && p.maDienMT103.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Tổng Tiền Về (Ngoại Tệ USD)</p>
          <p className="text-2xl font-bold text-slate-900">{formatUSD(totalUSD)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <p className="text-xs text-purple-600 font-medium">Tổng Tiền Quy Đổi Thực Nhận (VND)</p>
          <p className="text-2xl font-bold text-purple-700">{formatVND(totalVND)}</p>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã giao dịch, số HĐ, khách hàng, điện MT103..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
          />
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 min-h-[44px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi Nhận Tiền Về</span>
        </button>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-3">Mã GD</th>
                <th className="py-2.5 px-3">Số HĐ</th>
                <th className="py-2.5 px-3 min-w-[200px]">Khách Hàng</th>
                <th className="py-2.5 px-3">Nội Dung Đợt Thu</th>
                <th className="py-2.5 px-3">Hình Thức</th>
                <th className="py-2.5 px-3 text-right">Số Tiền (USD)</th>
                <th className="py-2.5 px-3 text-right">Tỷ Giá Nhận</th>
                <th className="py-2.5 px-3 text-right">Quy Đổi (VND)</th>
                <th className="py-2.5 px-3">Ngân Hàng / Điện MT103</th>
                <th className="py-2.5 px-3">Ngày Nhận</th>
                <th className="py-2.5 px-3 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12.5px] leading-snug">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-slate-400 text-xs">
                    Chưa có giao dịch tiền về nào.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-bold text-purple-700 whitespace-nowrap">{p.maGiaoDich}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">{p.soHD}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium min-w-[200px]">{p.khachHang}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{p.dotThanhToan}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {p.hinhThuc}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap text-[12.5px]">
                      {formatUSD(p.soTienUSD)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                      {formatNumber(p.tyGiaThucNhan)}
                    </td>
                    <td className="py-2 px-3 text-right font-extrabold text-purple-700 whitespace-nowrap text-[13px]">
                      {formatVND(p.thanhTienVND)}
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      <div className="font-semibold text-slate-800" title={p.nganHangNhan}>{formatShortBankName(p.nganHangNhan)}</div>
                      <div className="font-mono text-slate-400">{p.maDienMT103 || '--'}</div>
                    </td>
                    <td className="py-2 px-3 text-[11.5px] whitespace-nowrap text-slate-600">
                      {formatDateVN(p.ngayTienVe)}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(p.id, p.maGiaoDich)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
      <div className="lg:hidden space-y-3">
        {filteredPayments.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{p.maGiaoDich}</span>
                <h3 className="text-base font-bold text-slate-900">{p.dotThanhToan}</h3>
                <p className="text-xs text-slate-500">HĐ: <strong className="text-slate-700">{p.soHD}</strong> ({p.khachHang})</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {p.hinhThuc}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số tiền ngoại tệ:</span>
                <span className="font-bold text-slate-900">{formatUSD(p.soTienUSD)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tỷ giá ngân hàng:</span>
                <span className="font-mono text-slate-700">{formatNumber(p.tyGiaThucNhan)} ₫/$</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngân hàng & MT103:</span>
                <span className="font-semibold text-slate-800">{formatShortBankName(p.nganHangNhan)} ({p.maDienMT103 || 'N/A'})</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Ngày tiền về: {formatDateVN(p.ngayTienVe)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400">Quy Đổi Thực Nhận</span>
                <p className="text-base font-extrabold text-purple-700">{formatVND(p.thanhTienVND)}</p>
              </div>

              <button
                onClick={() => handleDelete(p.id, p.maGiaoDich)}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium py-1 px-2"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ghi Nhận Giao Dịch Tiền Về (Ngân Hàng)"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Giao Dịch *</label>
              <input
                type="text"
                required
                value={maGiaoDich}
                onChange={(e) => setMaGiaoDich(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hợp Đồng Liên Kết *</label>
              <select
                value={soHD}
                onChange={(e) => handleContractSelect(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px] bg-white"
              >
                <option value="">-- Chọn hợp đồng --</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.soHD}>{c.soHD} - {c.tenKH}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Đợt Thanh Toán *</label>
            <input
              type="text"
              required
              value={dotThanhToan}
              onChange={(e) => setDotThanhToan(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
              placeholder="VD: Cọc 30% HĐ, Thanh toán L/C Đợt 1..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Tiền USD *</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                required
                value={soTienUSD}
                onChange={(e) => setSoTienUSD(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tỷ Giá Ngân Hàng *</label>
              <input
                type="number"
                inputMode="numeric"
                required
                value={tyGiaThucNhan}
                onChange={(e) => setTyGiaThucNhan(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Computed amount banner */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-purple-900">
            <span className="text-xs font-semibold">Quy Đổi Thành Tiền:</span>
            <span className="text-base font-extrabold">{formatVND((Number(soTienUSD) || 0) * (Number(tyGiaThucNhan) || 0))}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Ngân Hàng Nhận</label>
                {isCustomBank && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomBank(false);
                      setNganHangNhan(displayBanks[0]?.tenVietTat || 'Vietcombank');
                    }}
                    className="text-[11px] text-purple-600 hover:underline font-medium"
                  >
                    Chọn từ danh mục
                  </button>
                )}
              </div>

              {!isCustomBank ? (
                <select
                  value={nganHangNhan}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomBank(true);
                      setNganHangNhan('');
                    } else {
                      setNganHangNhan(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px] bg-white font-medium text-slate-800"
                >
                  {displayBanks.map((b) => {
                    const shortName = b.tenVietTat || b.tenNganHang;
                    return (
                      <option key={b.id || shortName} value={shortName}>
                        {shortName} (STK: {b.soTaiKhoan})
                      </option>
                    );
                  })}
                  <option value="CUSTOM">+ Nhập ngân hàng khác...</option>
                </select>
              ) : (
                <input
                  type="text"
                  autoFocus
                  value={nganHangNhan}
                  onChange={(e) => setNganHangNhan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
                  placeholder="Nhập tên ngân hàng khác..."
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Điện MT103 / Số Phụ</label>
              <input
                type="text"
                value={maDienMT103}
                onChange={(e) => setMaDienMT103(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
                placeholder="VCB-MT103-8821"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày Tiền Thực Tế Vào TK *</label>
            <input
              type="date"
              required
              value={ngayTienVe}
              onChange={(e) => setNgayTienVe(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[44px]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {saving ? 'Đang Lưu...' : 'Lưu Giao Dịch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
