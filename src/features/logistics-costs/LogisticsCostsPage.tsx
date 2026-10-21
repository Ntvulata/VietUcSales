import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { subscribeToCosts, saveCost, toggleCostPaymentStatus, removeCost } from './costsService';
import { subscribeToShipments } from '../shipments/shipmentsService';
import { subscribeToContracts } from '../contracts/contractsService';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { formatVND, formatUSD, formatNumber } from '../../utils/formatters';
import { 
  type LogisticsCost, 
  type Shipment, 
  type Contract, 
  type CostGroup, 
  type LogisticsPlan,
  LOGISTICS_STANDARD_ITEMS,
  BANKING_STANDARD_ITEMS
} from '../../types';

export const LogisticsCostsPage: React.FC = () => {
  const [costs, setCosts] = useState<LogisticsCost[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | CostGroup>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [maCP, setMaCP] = useState('');
  const [soHD, setSoHD] = useState('');
  const [maDotXuat, setMaDotXuat] = useState('');
  const [nhomChiPhi, setNhomChiPhi] = useState<CostGroup>('LOGISTICS');
  const [phuongAnLogistics, setPhuongAnLogistics] = useState<LogisticsPlan>('XE_LE');
  const [khoanMucChiPhi, setKhoanMucChiPhi] = useState<string>('Cước tàu biển (Ocean Freight)');
  const [nhaCungCap, setNhaCungCap] = useState('');
  const [soLuongTinhPhi, setSoLuongTinhPhi] = useState<number>(750);
  const [donViTinh, setDonViTinh] = useState('Tấn');
  const [donGia, setDonGia] = useState<number>(450);
  const [loaiTien, setLoaiTien] = useState<LogisticsCost['loaiTien']>('USD');
  const [tyGiaQuyDoi, setTyGiaQuyDoi] = useState<number>(25450);
  const [soHoaDonChungTu, setSoHoaDonChungTu] = useState('');
  const [tinhTrangThanhToan, setTinhTrangThanhToan] = useState<LogisticsCost['tinhTrangThanhToan']>('DA_THANH_TOAN');
  const [ngayThanhToan, setNgayThanhToan] = useState(new Date().toISOString().split('T')[0]);
  const [ghiChu, setGhiChu] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubCosts = subscribeToCosts(setCosts);
    const unsubShipments = subscribeToShipments(setShipments);
    const unsubContracts = subscribeToContracts(setContracts);

    return () => {
      if (unsubCosts) unsubCosts();
      if (unsubShipments) unsubShipments();
      if (unsubContracts) unsubContracts();
    };
  }, []);

  // Financial calculations
  const totalCostsVND = costs.reduce((acc, c) => acc + (c.thanhTienVND || 0), 0);
  const totalPaidVND = costs.filter(c => c.tinhTrangThanhToan === 'DA_THANH_TOAN').reduce((acc, c) => acc + (c.thanhTienVND || 0), 0);
  const totalUnpaidVND = totalCostsVND - totalPaidVND;

  // Breakdown by group
  const totalLogisticsVND = costs.filter(c => (!c.nhomChiPhi && c.hinhThucDichVu) || c.nhomChiPhi === 'LOGISTICS').reduce((acc, c) => acc + (c.thanhTienVND || 0), 0);
  const totalBocXepVND = costs.filter(c => c.nhomChiPhi === 'BOC_XEP' || c.khoanMucChiPhi.toLowerCase().includes('bốc')).reduce((acc, c) => acc + (c.thanhTienVND || 0), 0);
  const totalMoiGioiVND = costs.filter(c => c.nhomChiPhi === 'MOI_GIOI' || c.khoanMucChiPhi.toLowerCase().includes('cò')).reduce((acc, c) => acc + (c.thanhTienVND || 0), 0);
  const totalNganHangVND = costs.filter(c => c.nhomChiPhi === 'NGAN_HANG' || c.khoanMucChiPhi.toLowerCase().includes('ngân hàng') || c.khoanMucChiPhi.toLowerCase().includes('l/c')).reduce((acc, c) => acc + (c.thanhTienVND || 0), 0);
  const totalKhacVND = costs.filter(c => c.nhomChiPhi === 'KHAC').reduce((acc, c) => acc + (c.thanhTienVND || 0), 0);

  const handleContractChange = (newSoHD: string) => {
    setSoHD(newSoHD);
    const contractShipments = shipments.filter((s) => s.soHD === newSoHD);
    if (contractShipments.length > 0) {
      const firstShipment = contractShipments[0];
      setMaDotXuat(firstShipment.maDotXuat);
      if (nhomChiPhi === 'NGAN_HANG') {
        setDonViTinh('Nguyên Lô');
        setSoLuongTinhPhi(1);
      } else if (donViTinh === 'Tấn') {
        setSoLuongTinhPhi(firstShipment.sanLuongThucXuat);
      } else if (donViTinh === 'Cont') {
        setSoLuongTinhPhi(firstShipment.soLuongCont);
      }
    } else {
      setMaDotXuat('');
      const c = contracts.find((item) => item.soHD === newSoHD);
      if (nhomChiPhi === 'NGAN_HANG') {
        setDonViTinh('Nguyên Lô');
        setSoLuongTinhPhi(1);
      } else if (c && donViTinh === 'Tấn') {
        setSoLuongTinhPhi(c.sanLuongKy);
      }
    }
  };

  const handleShipmentChange = (newMaDotXuat: string) => {
    setMaDotXuat(newMaDotXuat);
    const s = shipments.find((item) => item.maDotXuat === newMaDotXuat);
    if (s) {
      if (s.soHD && s.soHD !== soHD) {
        setSoHD(s.soHD);
      }
      if (nhomChiPhi === 'NGAN_HANG') {
        setDonViTinh('Nguyên Lô');
        setSoLuongTinhPhi(1);
      } else if (donViTinh === 'Tấn') {
        setSoLuongTinhPhi(s.sanLuongThucXuat);
      } else if (donViTinh === 'Cont') {
        setSoLuongTinhPhi(s.soLuongCont);
      }
    }
  };

  const handleUnitChange = (newUnit: string) => {
    setDonViTinh(newUnit);
    const s = shipments.find((item) => item.maDotXuat === maDotXuat);
    const c = contracts.find((item) => item.soHD === soHD);
    if (newUnit === 'Tấn') {
      if (s?.sanLuongThucXuat) {
        setSoLuongTinhPhi(s.sanLuongThucXuat);
      } else if (c?.sanLuongKy) {
        setSoLuongTinhPhi(c.sanLuongKy);
      }
    } else if (newUnit === 'Nguyên Lô') {
      setSoLuongTinhPhi(1);
    } else if (newUnit === 'Cont') {
      if (s?.soLuongCont) {
        setSoLuongTinhPhi(s.soLuongCont);
      }
    }
  };

  const openAddModal = (presetGroup?: CostGroup) => {
    const targetGroup = presetGroup || 'LOGISTICS';
    setMaCP(`CP-0${costs.length + 1}`);
    const defaultContract = contracts[0]?.soHD || '';
    setSoHD(defaultContract);

    const contractShipments = shipments.filter((s) => s.soHD === defaultContract);
    const defaultShipment = contractShipments[0] || shipments[0];
    const defaultMaDotXuat = defaultShipment?.maDotXuat || '';
    setMaDotXuat(defaultMaDotXuat);

    setNhomChiPhi(targetGroup);
    setPhuongAnLogistics('XE_LE');
    setSoHoaDonChungTu('');
    setTinhTrangThanhToan('DA_THANH_TOAN');
    setNgayThanhToan(new Date().toISOString().split('T')[0]);
    setGhiChu('');

    const defaultMT = defaultShipment?.sanLuongThucXuat || contracts[0]?.sanLuongKy || 750;

    if (targetGroup === 'LOGISTICS') {
      setKhoanMucChiPhi('Cước tàu biển (Ocean Freight)');
      setNhaCungCap('ONE Line VN');
      setSoLuongTinhPhi(defaultMT);
      setDonViTinh('Tấn');
      setDonGia(450);
      setLoaiTien('USD');
      setTyGiaQuyDoi(25450);
    } else if (targetGroup === 'BOC_XEP') {
      setKhoanMucChiPhi('Phí Bốc Xếp Nhà Máy Lên Cont');
      setNhaCungCap('Đội bốc vác Nhà máy');
      setSoLuongTinhPhi(defaultMT);
      setDonViTinh('Tấn');
      setDonGia(35000);
      setLoaiTien('VND');
      setTyGiaQuyDoi(1);
    } else if (targetGroup === 'MOI_GIOI') {
      setKhoanMucChiPhi('Tiền Cò Bột (Hoa hồng môi giới)');
      setNhaCungCap('Môi giới nguồn bột');
      setSoLuongTinhPhi(defaultMT);
      setDonViTinh('Tấn');
      setDonGia(50000);
      setLoaiTien('VND');
      setTyGiaQuyDoi(1);
    } else if (targetGroup === 'NGAN_HANG') {
      setKhoanMucChiPhi('Phí mở L/C');
      setNhaCungCap('Vietcombank');
      setSoLuongTinhPhi(1);
      setDonViTinh('Nguyên Lô');
      setDonGia(12500000);
      setLoaiTien('VND');
      setTyGiaQuyDoi(1);
    } else {
      setKhoanMucChiPhi('');
      setNhaCungCap('');
      setSoLuongTinhPhi(defaultMT);
      setDonViTinh('Tấn');
      setDonGia(0);
      setLoaiTien('VND');
      setTyGiaQuyDoi(1);
    }

    setIsModalOpen(true);
  };

  const handleGroupChange = (newGroup: CostGroup) => {
    setNhomChiPhi(newGroup);
    const currShipment = shipments.find((s) => s.maDotXuat === maDotXuat);
    const currContract = contracts.find((c) => c.soHD === soHD);
    const currMT = currShipment?.sanLuongThucXuat || currContract?.sanLuongKy || 750;

    if (newGroup === 'LOGISTICS') {
      if (phuongAnLogistics === 'ALL_IN') {
        setKhoanMucChiPhi('Logistics All-in (Trọn gói: cước tàu, xe, nâng hạ, kiểm dịch, chứng từ)');
      } else {
        setKhoanMucChiPhi('Cước tàu biển (Ocean Freight)');
      }
      setDonViTinh('Tấn');
      setSoLuongTinhPhi(currMT);
    } else if (newGroup === 'BOC_XEP') {
      setKhoanMucChiPhi('Phí bốc xếp hàng lên cont / kho');
      setDonViTinh('Tấn');
      setSoLuongTinhPhi(currMT);
      setLoaiTien('VND');
      setTyGiaQuyDoi(1);
    } else if (newGroup === 'MOI_GIOI') {
      setKhoanMucChiPhi('Tiền cò bột (Hoa hồng môi giới)');
      setDonViTinh('Tấn');
      setSoLuongTinhPhi(currMT);
      setLoaiTien('VND');
      setTyGiaQuyDoi(1);
    } else if (newGroup === 'NGAN_HANG') {
      setKhoanMucChiPhi('Phí mở L/C');
      setDonViTinh('Nguyên Lô');
      setSoLuongTinhPhi(1);
      setLoaiTien('VND');
      setTyGiaQuyDoi(1);
    } else {
      setKhoanMucChiPhi('');
      setDonViTinh('Tấn');
      setSoLuongTinhPhi(currMT);
    }
  };

  const handlePlanChange = (plan: LogisticsPlan) => {
    setPhuongAnLogistics(plan);
    const currShipment = shipments.find((s) => s.maDotXuat === maDotXuat);
    const currMT = currShipment?.sanLuongThucXuat || contracts.find((c) => c.soHD === soHD)?.sanLuongKy || 750;
    if (plan === 'ALL_IN') {
      setKhoanMucChiPhi('Logistics All-in (Trọn gói: cước tàu, xe, nâng hạ, kiểm dịch, chứng từ)');
      setNhaCungCap('Bee Logistics Corp');
      setLoaiTien('VND');
      setTyGiaQuyDoi(1);
      setDonViTinh('Tấn');
      setSoLuongTinhPhi(currMT);
    } else {
      setKhoanMucChiPhi('Cước tàu biển (Ocean Freight)');
      setNhaCungCap('ONE Line VN');
      setLoaiTien('USD');
      setTyGiaQuyDoi(25450);
      setDonViTinh('Tấn');
      setSoLuongTinhPhi(currMT);
    }
  };

  const handleSave = async (e: React.FormEvent, keepOpenForNextRow: boolean = false) => {
    e.preventDefault();
    setSaving(true);
    try {
      const rate = loaiTien === 'VND' ? 1 : Number(tyGiaQuyDoi || 1);
      const thanhTienVND = Number(soLuongTinhPhi) * Number(donGia) * rate;

      const costData: Omit<LogisticsCost, 'id'> = {
        maCP,
        maDotXuat: nhomChiPhi === 'LOGISTICS' ? maDotXuat : (maDotXuat || ''),
        soHD,
        nhomChiPhi,
        khoanMucChiPhi,
        nhaCungCap,
        soLuongTinhPhi: Number(soLuongTinhPhi) || 0,
        donViTinh: donViTinh || 'Tấn',
        donGia: Number(donGia) || 0,
        loaiTien,
        tyGiaQuyDoi: rate,
        thanhTienVND,
        soHoaDonChungTu: soHoaDonChungTu || '',
        tinhTrangThanhToan,
        ngayThanhToan: tinhTrangThanhToan === 'DA_THANH_TOAN' ? (ngayThanhToan || '') : '',
        ghiChu: ghiChu || '',
      };

      if (nhomChiPhi === 'LOGISTICS' && phuongAnLogistics) {
        costData.phuongAnLogistics = phuongAnLogistics;
      }

      await saveCost(costData);

      if (keepOpenForNextRow) {
        // Increment code and reset for next row (convenient for banking rows)
        setMaCP(`CP-0${Number(maCP.replace(/\D/g, '') || costs.length) + 1}`);
        setDonGia(0);
        setSoHoaDonChungTu('');
      } else {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      alert('Lỗi lưu chi phí: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePayment = async (cost: LogisticsCost) => {
    await toggleCostPaymentStatus(cost.id, cost.tinhTrangThanhToan);
  };

  const handleDelete = async (id: string, maCP: string) => {
    if (window.confirm(`Bạn muốn xóa khoản chi phí ${maCP}?`)) {
      await removeCost(id);
    }
  };

  // Filter costs
  const filteredCosts = costs.filter((c) => {
    const matchSearch =
      c.maCP.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.khoanMucChiPhi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nhaCungCap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.soHD.toLowerCase().includes(searchTerm.toLowerCase());

    const cGroup = c.nhomChiPhi || (
      c.khoanMucChiPhi.toLowerCase().includes('bốc') ? 'BOC_XEP' :
      c.khoanMucChiPhi.toLowerCase().includes('cò') ? 'MOI_GIOI' :
      (c.khoanMucChiPhi.toLowerCase().includes('ngân hàng') || c.khoanMucChiPhi.toLowerCase().includes('l/c')) ? 'NGAN_HANG' :
      'LOGISTICS'
    );

    const matchGroup = groupFilter === 'ALL' || cGroup === groupFilter;
    return matchSearch && matchGroup;
  });

  const costGroupTabs = [
    { key: 'ALL', label: 'Tất Cả Khoản Chi', count: costs.length },
    { key: 'LOGISTICS', label: '🚢 Logistics Theo Lô', count: costs.filter(c => (!c.nhomChiPhi && c.hinhThucDichVu) || c.nhomChiPhi === 'LOGISTICS').length },
    { key: 'BOC_XEP', label: '🏗️ Bốc Xếp', count: costs.filter(c => c.nhomChiPhi === 'BOC_XEP' || c.khoanMucChiPhi.toLowerCase().includes('bốc')).length },
    { key: 'MOI_GIOI', label: '🤝 Môi Giới / Cò', count: costs.filter(c => c.nhomChiPhi === 'MOI_GIOI' || c.khoanMucChiPhi.toLowerCase().includes('cò')).length },
    { key: 'NGAN_HANG', label: '🏦 L/C & Ngân Hàng', count: costs.filter(c => c.nhomChiPhi === 'NGAN_HANG' || c.khoanMucChiPhi.toLowerCase().includes('ngân hàng') || c.khoanMucChiPhi.toLowerCase().includes('l/c')).length },
    { key: 'KHAC', label: '📝 Phí Khác', count: costs.filter(c => c.nhomChiPhi === 'KHAC').length },
  ] as const;

  const selectedShipment = shipments.find((s) => s.maDotXuat === maDotXuat);
  const selectedContract = contracts.find((c) => c.soHD === soHD);

  return (
    <div className="space-y-5">
      {/* 5 Group Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-sky-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-sky-600 uppercase">1. Logistics Theo Lô</span>
          <p className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5">{formatVND(totalLogisticsVND)}</p>
          <span className="text-[10px] text-slate-400">All-in & Xé lẻ</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-orange-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-orange-600 uppercase">2. Phí Bốc Xếp</span>
          <p className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5">{formatVND(totalBocXepVND)}</p>
          <span className="text-[10px] text-slate-400">Tính riêng</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-teal-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-teal-600 uppercase">3. Phí Môi Giới</span>
          <p className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5">{formatVND(totalMoiGioiVND)}</p>
          <span className="text-[10px] text-slate-400">Hoa hồng / cò bột</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-purple-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-purple-600 uppercase">4. L/C & Ngân Hàng</span>
          <p className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5">{formatVND(totalNganHangVND)}</p>
          <span className="text-[10px] text-slate-400">Nhiều dòng phí</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-600 uppercase">5. Chi Phí Khác</span>
          <p className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5">{formatVND(totalKhacVND)}</p>
          <span className="text-[10px] text-slate-400">Phát sinh ngoài</span>
        </div>
      </div>

      {/* Payment overview */}
      <div className="flex items-center justify-between p-3.5 bg-slate-100/70 rounded-2xl text-xs text-slate-700">
        <div>
          Tổng toàn bộ: <strong className="text-slate-900 font-bold">{formatVND(totalCostsVND)}</strong>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-700">Đã chi: <strong>{formatVND(totalPaidVND)}</strong></span>
          <span>•</span>
          <span className="text-amber-700">Còn nợ: <strong>{formatVND(totalUnpaidVND)}</strong></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {costGroupTabs.map((tab) => {
          const isActive = groupFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setGroupFilter(tab.key as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all min-h-[40px] ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo khoản mục, nhà cung cấp, mã CP, số HĐ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
          />
        </div>

        <button
          onClick={() => openAddModal(groupFilter === 'ALL' ? 'LOGISTICS' : groupFilter)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 min-h-[44px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khoản Chi Phí</span>
        </button>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-3">Mã CP</th>
                <th className="py-2.5 px-3">Nhóm Chi Phí</th>
                <th className="py-2.5 px-3">Khoản Mục Chi Tiết</th>
                <th className="py-2.5 px-3">Liên Kết (HĐ / Lô)</th>
                <th className="py-2.5 px-3">Người Nhận / NCC</th>
                <th className="py-2.5 px-3 text-right">Số Lượng</th>
                <th className="py-2.5 px-3 text-right">Đơn Giá</th>
                <th className="py-2.5 px-3 text-right">Thành Tiền (VND)</th>
                <th className="py-2.5 px-3">Chứng Từ</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái Chi</th>
                <th className="py-2.5 px-3 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12.5px] leading-snug">
              {filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-slate-400 text-xs">
                    Không tìm thấy khoản chi phí nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCosts.map((c) => {
                  const effectiveGroup = c.nhomChiPhi || (
                    c.khoanMucChiPhi.toLowerCase().includes('bốc') ? 'BOC_XEP' :
                    c.khoanMucChiPhi.toLowerCase().includes('cò') ? 'MOI_GIOI' :
                    (c.khoanMucChiPhi.toLowerCase().includes('ngân hàng') || c.khoanMucChiPhi.toLowerCase().includes('l/c')) ? 'NGAN_HANG' :
                    'LOGISTICS'
                  );

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-bold text-amber-800 whitespace-nowrap">{c.maCP}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge status={effectiveGroup} />
                        {effectiveGroup === 'LOGISTICS' && c.phuongAnLogistics && (
                          <span className="ml-1 inline-block">
                            <Badge status={c.phuongAnLogistics} />
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-medium text-slate-800 text-[12.5px]">{c.khoanMucChiPhi}</div>
                      </td>
                      <td className="py-2 px-3 text-[11px] font-medium text-slate-700 whitespace-nowrap">
                        <div>HĐ: <span className="font-bold text-slate-900">{c.soHD}</span></div>
                        {c.maDotXuat && <div className="text-slate-500">Lô: {c.maDotXuat}</div>}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-medium text-[12px]">{c.nhaCungCap}</td>
                      <td className="py-2 px-3 text-right font-medium text-slate-800 whitespace-nowrap">
                        {c.soLuongTinhPhi} {c.donViTinh}
                      </td>
                      <td className="py-2 px-3 text-right text-[11.5px] text-slate-600 whitespace-nowrap">
                        {c.loaiTien === 'USD' ? formatUSD(c.donGia) : formatVND(c.donGia)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap text-[13px]">
                        {formatVND(c.thanhTienVND)}
                      </td>
                      <td className="py-2 px-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                        {c.soHoaDonChungTu || '--'}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleTogglePayment(c)}
                          className="cursor-pointer"
                          title="Bấm để đổi trạng thái thanh toán"
                        >
                          <Badge status={c.tinhTrangThanhToan} />
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(c.id, c.maCP)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD LIST */}
      <div className="lg:hidden space-y-3">
        {filteredCosts.map((c) => {
          const effectiveGroup = c.nhomChiPhi || (
            c.khoanMucChiPhi.toLowerCase().includes('bốc') ? 'BOC_XEP' :
            c.khoanMucChiPhi.toLowerCase().includes('cò') ? 'MOI_GIOI' :
            (c.khoanMucChiPhi.toLowerCase().includes('ngân hàng') || c.khoanMucChiPhi.toLowerCase().includes('l/c')) ? 'NGAN_HANG' :
            'LOGISTICS'
          );

          return (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-amber-700">{c.maCP}</span>
                    <Badge status={effectiveGroup} />
                    {effectiveGroup === 'LOGISTICS' && c.phuongAnLogistics && (
                      <Badge status={c.phuongAnLogistics} />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{c.khoanMucChiPhi}</h3>
                  <p className="text-xs text-slate-500">Đơn vị nhận: <strong className="text-slate-700">{c.nhaCungCap}</strong></p>
                </div>
                <button onClick={() => handleTogglePayment(c)}>
                  <Badge status={c.tinhTrangThanhToan} />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Liên kết:</span>
                  <span className="font-semibold text-slate-800">HĐ {c.soHD} {c.maDotXuat ? `• Lô ${c.maDotXuat}` : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Số lượng & Đơn giá:</span>
                  <span className="font-semibold text-slate-800">{c.soLuongTinhPhi} {c.donViTinh} × {c.loaiTien === 'USD' ? formatUSD(c.donGia) : formatVND(c.donGia)}</span>
                </div>
                {c.soHoaDonChungTu && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Chứng từ:</span>
                    <span className="font-mono text-slate-700">{c.soHoaDonChungTu}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400">Thành Tiền Quy Đổi</span>
                  <p className="text-base font-extrabold text-slate-900">{formatVND(c.thanhTienVND)}</p>
                </div>

                <button
                  onClick={() => handleDelete(c.id, c.maCP)}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium py-1 px-2"
                >
                  Xóa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Cost Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm Chi Phí Phát Sinh"
        maxWidth="xl"
      >
        <form onSubmit={(e) => handleSave(e, false)} className="space-y-4">
          {/* Nhóm Chi Phí Radio / Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">1. Chọn Phân Loại Nhóm Chi Phí *</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { key: 'LOGISTICS', label: '🚢 Logistics Lô', desc: 'Cước tàu, xe, nâng hạ, kiểm dịch' },
                { key: 'BOC_XEP', label: '🏗️ Bốc Xếp', desc: 'Phí riêng' },
                { key: 'MOI_GIOI', label: '🤝 Môi Giới', desc: 'Tiền cò bột' },
                { key: 'NGAN_HANG', label: '🏦 L/C & Bank', desc: 'Nhiều dòng' },
                { key: 'KHAC', label: '📝 Khác', desc: 'Phát sinh' },
              ].map((g) => (
                <button
                  type="button"
                  key={g.key}
                  onClick={() => handleGroupChange(g.key as CostGroup)}
                  className={`p-2.5 rounded-xl border text-left transition-all min-h-[48px] ${
                    nhomChiPhi === g.key
                      ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold ring-2 ring-amber-400/30'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-semibold">{g.label}</p>
                  <p className="text-[10px] text-slate-400 font-normal">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Options for LOGISTICS Group */}
          {nhomChiPhi === 'LOGISTICS' && (
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-sky-900">Phương Án Logistics Cho Lô Hàng: *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePlanChange('ALL_IN')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    phuongAnLogistics === 'ALL_IN'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ALL-IN (1 NCC trọn gói tất cả)
                </button>
                <button
                  type="button"
                  onClick={() => handlePlanChange('XE_LE')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    phuongAnLogistics === 'XE_LE'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  XÉ LẺ (Nhiều nhà cung cấp thực hiện)
                </button>
              </div>

              {phuongAnLogistics === 'XE_LE' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-sky-800 mb-1">
                    Chọn một trong các nội dung thuộc Chi phí Logistics:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {LOGISTICS_STANDARD_ITEMS.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setKhoanMucChiPhi(item)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                          khoanMucChiPhi === item
                            ? 'bg-sky-700 text-white font-bold'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-sky-100'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conditional Options for BANKING Group */}
          {nhomChiPhi === 'NGAN_HANG' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-purple-900">
                Chọn Nhanh Dòng Phí L/C & Ngân Hàng:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BANKING_STANDARD_ITEMS.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setKhoanMucChiPhi(item)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                      khoanMucChiPhi === item
                        ? 'bg-purple-700 text-white font-bold'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-purple-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Chi Phí *</label>
              <input
                type="text"
                required
                value={maCP}
                onChange={(e) => setMaCP(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khoản Mục Chi Phí Chi Tiết *</label>
              <input
                type="text"
                required
                value={khoanMucChiPhi}
                onChange={(e) => setKhoanMucChiPhi(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                placeholder="VD: Cước tàu biển, Phí mở L/C, Bốc xếp..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số HĐ Liên Kết *</label>
              <select
                value={soHD}
                onChange={(e) => handleContractChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px] bg-white font-medium"
              >
                <option value="">-- Chọn hợp đồng --</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.soHD}>
                    {c.soHD} ({c.tenKH}) - {formatNumber(c.sanLuongKy)} MT
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lô / Đợt Xuất {nhomChiPhi === 'LOGISTICS' ? '*' : '(Tùy chọn)'}
              </label>
              <select
                value={maDotXuat}
                onChange={(e) => handleShipmentChange(e.target.value)}
                required={nhomChiPhi === 'LOGISTICS'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px] bg-white font-medium"
              >
                <option value="">-- Chọn lô xuất (nếu có) --</option>
                {(soHD ? shipments.filter((s) => s.soHD === soHD) : shipments).map((s) => (
                  <option key={s.id} value={s.maDotXuat}>
                    {s.maDotXuat} ({formatNumber(s.sanLuongThucXuat)} MT - {s.soLuongCont} cont)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nhà Cung Cấp / Đơn Vị Nhận Tiền *</label>
            <input
              type="text"
              required
              value={nhaCungCap}
              onChange={(e) => setNhaCungCap(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
              placeholder="VD: ONE Line, Bee Logistics, VCB, Đội bốc vác, Cò bột..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Số Lượng Tính Phí *</label>
                {selectedShipment && (
                  <span className="text-[11px] text-slate-500">
                    {formatNumber(selectedShipment.sanLuongThucXuat)} MT
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                required
                value={soLuongTinhPhi}
                onChange={(e) => setSoLuongTinhPhi(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px] font-semibold"
              />
              {/* Quick auto-fill helper pills */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {selectedShipment ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDonViTinh('Tấn');
                        setSoLuongTinhPhi(selectedShipment.sanLuongThucXuat);
                      }}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                      title="Lấy theo số tấn của lô"
                    >
                      {formatNumber(selectedShipment.sanLuongThucXuat)} Tấn
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDonViTinh('Cont');
                        setSoLuongTinhPhi(selectedShipment.soLuongCont);
                      }}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                      title="Lấy theo số container của lô"
                    >
                      {selectedShipment.soLuongCont} Cont
                    </button>
                  </>
                ) : selectedContract ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDonViTinh('Tấn');
                      setSoLuongTinhPhi(selectedContract.sanLuongKy);
                    }}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    title="Lấy theo số tấn của hợp đồng"
                  >
                    {formatNumber(selectedContract.sanLuongKy)} Tấn
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setDonViTinh('Nguyên Lô');
                    setSoLuongTinhPhi(1);
                  }}
                  className="px-2 py-0.5 rounded text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium cursor-pointer"
                  title="Tính theo nguyên lô (ngân hàng / trọn gói)"
                >
                  1 Nguyên Lô
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn Vị Tính *</label>
              <select
                value={['Tấn', 'Nguyên Lô', 'Cont', 'Chuyến', 'Bộ', 'Lần'].includes(donViTinh) ? donViTinh : 'CUSTOM'}
                onChange={(e) => {
                  if (e.target.value !== 'CUSTOM') {
                    handleUnitChange(e.target.value);
                  } else {
                    setDonViTinh('');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px] bg-white font-medium"
              >
                <option value="Tấn">Tấn (Thông thường / Chuẩn nông sản)</option>
                <option value="Nguyên Lô">Nguyên Lô (Ngân hàng, L/C, Trọn gói)</option>
                <option value="Cont">Cont (Container)</option>
                <option value="Chuyến">Chuyến (Xe / Trucking)</option>
                <option value="Bộ">Bộ (Chứng từ, C/O)</option>
                <option value="Lần">Lần</option>
                <option value="CUSTOM">Khác (Nhập tay)...</option>
              </select>

              {!['Tấn', 'Nguyên Lô', 'Cont', 'Chuyến', 'Bộ', 'Lần'].includes(donViTinh) && (
                <input
                  type="text"
                  required
                  value={donViTinh}
                  onChange={(e) => setDonViTinh(e.target.value)}
                  placeholder="Nhập đơn vị tính..."
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[40px]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Tiền</label>
              <select
                value={loaiTien}
                onChange={(e) => setLoaiTien(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px] bg-white font-medium"
              >
                <option value="VND">VND (Việt Nam Đồng)</option>
                <option value="USD">USD (Đô la Mỹ)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn Giá *</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                required
                value={donGia}
                onChange={(e) => setDonGia(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
              />
            </div>

            {loaiTien === 'USD' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tỷ Giá USD/VND</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={tyGiaQuyDoi}
                  onChange={(e) => setTyGiaQuyDoi(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                />
              </div>
            ) : null}
          </div>

          {/* Computed amount banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900">
            <span className="text-xs font-semibold">Thành Tiền Quy Đổi (VND):</span>
            <span className="text-base font-extrabold">
              {formatVND((Number(soLuongTinhPhi) || 0) * (Number(donGia) || 0) * (loaiTien === 'USD' ? (Number(tyGiaQuyDoi) || 1) : 1))}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Hóa Đơn / Phiếu Chi</label>
              <input
                type="text"
                value={soHoaDonChungTu}
                onChange={(e) => setSoHoaDonChungTu(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
                placeholder="INV-0988, PC-0301..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng Thái Thanh Toán</label>
              <select
                value={tinhTrangThanhToan}
                onChange={(e) => setTinhTrangThanhToan(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px] bg-white"
              >
                <option value="DA_THANH_TOAN">Đã Thanh Toán</option>
                <option value="CHUA_THANH_TOAN">Chưa Thanh Toán</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 min-h-[44px]"
            >
              Hủy
            </button>

            <div className="flex items-center gap-2">
              {nhomChiPhi === 'NGAN_HANG' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={(e) => handleSave(e, true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs border border-purple-200 min-h-[44px]"
                >
                  + Lưu & Thêm Dòng Tiếp
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
              >
                {saving ? 'Đang Lưu...' : 'Lưu Khoản Chi'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
