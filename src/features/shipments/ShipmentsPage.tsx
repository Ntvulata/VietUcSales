import React, { useState, useEffect } from 'react';
import { Plus, Search, Ship, Calendar, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { subscribeToShipments, saveShipment, removeShipment } from './shipmentsService';
import { subscribeToContracts } from '../contracts/contractsService';
import { subscribeToPorts } from '../master-data/masterDataService';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { formatNumber, formatDateVN } from '../../utils/formatters';
import type { Shipment, Contract, Port } from '../../types';

const DEFAULT_LOADING_PORTS = [
  'Cát Lái (TP.HCM)',
  'Cái Mép (Vũng Tàu)',
  'Tân Vũ (Hải Phòng)',
  'Đà Nẵng',
  'Quy Nhơn',
];

const DEFAULT_DISCHARGE_PORTS = [
  'Xiamen (Hạ Môn)',
  'Qingdao (Thanh Đảo)',
  'Shanghai (Thượng Hải)',
  'Ningbo (Ninh Ba)',
  'Tianjin (Thiên Tân)',
  'Incheon',
  'Busan',
  'Manila',
  'Bangkok / Laem Chabang',
  'Jakarta',
];

export const ShipmentsPage: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editShipment, setEditShipment] = useState<Shipment | null>(null);

  // Form states
  const [maDotXuat, setMaDotXuat] = useState('');
  const [soHD, setSoHD] = useState('');
  const [soBLBooking, setSoBLBooking] = useState('');
  const [soToKhaiHaiQuan, setSoToKhaiHaiQuan] = useState('');
  const [sanLuongThucXuat, setSanLuongThucXuat] = useState<number>(750);
  const [soLuongCont, setSoLuongCont] = useState<number>(30);
  const [loaiCont, setLoaiCont] = useState('20ft');
  
  // Port dropdown states (strictly from Master Data)
  const [cangDiSelect, setCangDiSelect] = useState('Cát Lái (TP.HCM)');
  const [cangDenSelect, setCangDenSelect] = useState('Xiamen (Hạ Môn)');

  const [tenTauChuyen, setTenTauChuyen] = useState('');
  const [hangTau, setHangTau] = useState('ONE Line');
  const [ngayDongHangTu, setNgayDongHangTu] = useState('');
  const [ngayDongHangDen, setNgayDongHangDen] = useState('');
  const [ngayTauChayATD, setNgayTauChayATD] = useState(new Date().toISOString().split('T')[0]);
  const [ngayDenETA, setNgayDenETA] = useState('');
  const [tyGiaThucTe, setTyGiaThucTe] = useState<number>(25450);
  const [trangThaiLoHang, setTrangThaiLoHang] = useState<Shipment['trangThaiLoHang']>('DA_THONG_QUAN');
  const [ghiChu, setGhiChu] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubShipments = subscribeToShipments(setShipments);
    const unsubContracts = subscribeToContracts(setContracts);
    const unsubPorts = subscribeToPorts(setPorts);

    return () => {
      if (unsubShipments) unsubShipments();
      if (unsubContracts) unsubContracts();
      if (unsubPorts) unsubPorts();
    };
  }, []);

  // Compute unified list of loading and discharge ports
  const loadingPortsList = Array.from(
    new Set([
      ...ports.filter(p => p.phanLoai === 'Cang_Boc').map(p => p.tenCang),
      ...DEFAULT_LOADING_PORTS
    ])
  );

  const dischargePortsList = Array.from(
    new Set([
      ...ports.filter(p => p.phanLoai === 'Cang_Do').map(p => p.tenCang),
      ...DEFAULT_DISCHARGE_PORTS
    ])
  );

  // Helper to calculate contract's remaining MT and containers
  const getContractRemainingInfo = (contractSoHD: string, excludeShipmentId?: string) => {
    const c = contracts.find((item) => item.soHD === contractSoHD);
    if (!c) {
      return {
        contract: null,
        sanLuongKy: 0,
        daXuatMT: 0,
        conLaiMT: 0,
        daXuatCont: 0,
        conLaiCont: 0,
      };
    }

    // Sum shipments belonging to this contract
    const priorShipments = shipments.filter(
      (s) => s.soHD === contractSoHD && (!excludeShipmentId || s.id !== excludeShipmentId)
    );
    const daXuatMT = priorShipments.reduce((sum, s) => sum + (Number(s.sanLuongThucXuat) || 0), 0);
    const daXuatCont = priorShipments.reduce((sum, s) => sum + (Number(s.soLuongCont) || 0), 0);

    const conLaiMT = Math.max(0, c.sanLuongKy - daXuatMT);

    // Calculate ratio MT / cont
    let mtPerCont = 18.5; // default 18.5 MT per 20ft container (Bao 50kg)
    if (priorShipments.length > 0 && daXuatCont > 0 && daXuatMT > 0) {
      mtPerCont = daXuatMT / daXuatCont;
    } else if (
      c.quyCachDongGoi?.toLowerCase().includes('850') ||
      c.quyCachDongGoi?.toLowerCase().includes('jumbo')
    ) {
      mtPerCont = 17; // Bao 850kg: 17 tấn/cont 20
    }

    const conLaiCont = conLaiMT > 0 ? Math.round(conLaiMT / mtPerCont) : 0;

    return {
      contract: c,
      sanLuongKy: c.sanLuongKy,
      daXuatMT,
      conLaiMT,
      daXuatCont,
      conLaiCont,
    };
  };

  // Helper to calculate port-specific remaining MT and containers under a contract
  const getPortRemainingInfo = (contractSoHD: string, portName: string, excludeShipmentId?: string) => {
    const c = contracts.find((item) => item.soHD === contractSoHD);
    if (!c || !c.danhSachCangDen) return null;
    const portItem = c.danhSachCangDen.find((p) => p.cangDen.trim() === portName.trim());
    if (!portItem) return null;

    const priorShipments = shipments.filter(
      (s) => s.soHD === contractSoHD && s.cangDen === portName && (!excludeShipmentId || s.id !== excludeShipmentId)
    );
    const daXuatMT = priorShipments.reduce((sum, s) => sum + (Number(s.sanLuongThucXuat) || 0), 0);
    const daXuatCont = priorShipments.reduce((sum, s) => sum + (Number(s.soLuongCont) || 0), 0);
    const conLaiMT = Math.max(0, portItem.sanLuongMT - daXuatMT);

    let mtPerCont = 18.5; // default 18.5 MT per 20ft container (Bao 50kg)
    if (priorShipments.length > 0 && daXuatCont > 0 && daXuatMT > 0) {
      mtPerCont = daXuatMT / daXuatCont;
    } else if (
      c.quyCachDongGoi?.toLowerCase().includes('850') ||
      c.quyCachDongGoi?.toLowerCase().includes('jumbo')
    ) {
      mtPerCont = 17; // Bao 850kg: 17 tấn/cont 20
    }
    const conLaiCont = conLaiMT > 0 ? Math.round(conLaiMT / mtPerCont) : 0;

    return {
      portItem,
      sanLuongMT: portItem.sanLuongMT,
      daXuatMT,
      conLaiMT,
      daXuatCont,
      conLaiCont,
    };
  };

  const handleContractChange = (newSoHD: string) => {
    setSoHD(newSoHD);
    const info = getContractRemainingInfo(newSoHD, editShipment?.id);
    const c = info.contract;
    if (!editShipment) {
      if (c?.danhSachCangDen && c.danhSachCangDen.length > 0) {
        const portWithRemaining = c.danhSachCangDen.find((p) => {
          const pInfo = getPortRemainingInfo(newSoHD, p.cangDen);
          return pInfo && pInfo.conLaiMT > 0;
        }) || c.danhSachCangDen[0];

        setCangDenSelect(portWithRemaining.cangDen);
        const pInfo = getPortRemainingInfo(newSoHD, portWithRemaining.cangDen);
        if (pInfo && pInfo.conLaiMT > 0) {
          setSanLuongThucXuat(pInfo.conLaiMT);
          setSoLuongCont(pInfo.conLaiCont);
          return;
        }
      }
      setSanLuongThucXuat(info.conLaiMT);
      setSoLuongCont(info.conLaiCont);
    }
  };

  const handleCangDenChange = (newPort: string) => {
    setCangDenSelect(newPort);
    if (!editShipment && soHD) {
      const c = contracts.find((item) => item.soHD === soHD);
      const portItem = c?.danhSachCangDen?.find((p) => p.cangDen === newPort);
      if (portItem?.loaiCont) {
        setLoaiCont(portItem.loaiCont);
      }
      const portInfo = getPortRemainingInfo(soHD, newPort);
      if (portInfo && portInfo.conLaiMT > 0) {
        setSanLuongThucXuat(portInfo.conLaiMT);
        setSoLuongCont(portInfo.conLaiCont);
      }
    }
  };

  const openAddModal = () => {
    setEditShipment(null);
    const defaultSoHD = contracts[0]?.soHD || '';
    const info = getContractRemainingInfo(defaultSoHD);
    const c = info.contract;

    setMaDotXuat(`XUAT-0${shipments.length + 1}A`);
    setSoHD(defaultSoHD);
    setSoBLBooking('');
    setSoToKhaiHaiQuan('');
    
    // Default 20ft
    setLoaiCont('20ft');
    
    // Port dropdowns (strictly from Master Data)
    setCangDiSelect(loadingPortsList[0] || 'Cát Lái (TP.HCM)');

    if (c?.danhSachCangDen && c.danhSachCangDen.length > 0) {
      const portWithRemaining = c.danhSachCangDen.find((p) => {
        const pInfo = getPortRemainingInfo(defaultSoHD, p.cangDen);
        return pInfo && pInfo.conLaiMT > 0;
      }) || c.danhSachCangDen[0];

      setCangDenSelect(portWithRemaining.cangDen);
      const pInfo = getPortRemainingInfo(defaultSoHD, portWithRemaining.cangDen);
      if (pInfo && pInfo.conLaiMT > 0) {
        setSanLuongThucXuat(pInfo.conLaiMT);
        setSoLuongCont(pInfo.conLaiCont);
      } else {
        setSanLuongThucXuat(info.conLaiMT > 0 ? info.conLaiMT : 750);
        setSoLuongCont(info.conLaiCont > 0 ? info.conLaiCont : 38);
      }
    } else {
      setCangDenSelect(dischargePortsList[0] || 'Xiamen (Hạ Môn)');
      setSanLuongThucXuat(info.conLaiMT > 0 ? info.conLaiMT : 750);
      setSoLuongCont(info.conLaiCont > 0 ? info.conLaiCont : 38);
    }

    setTenTauChuyen('');
    setHangTau('ONE Line');
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    setNgayDongHangTu(today);
    setNgayDongHangDen(threeDaysLater);
    setNgayTauChayATD(today);
    setNgayDenETA(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
    setTyGiaThucTe(25450);
    setTrangThaiLoHang('DANG_DONG_HANG');
    setGhiChu('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Shipment) => {
    setEditShipment(s);
    setMaDotXuat(s.maDotXuat);
    setSoHD(s.soHD);
    setSoBLBooking(s.soBLBooking || '');
    setSoToKhaiHaiQuan(s.soToKhaiHaiQuan || '');
    setSanLuongThucXuat(s.sanLuongThucXuat);
    setSoLuongCont(s.soLuongCont);
    setLoaiCont(s.loaiCont || '40HC');

    setCangDiSelect(s.cangDi || loadingPortsList[0] || 'Cát Lái (TP.HCM)');
    setCangDenSelect(s.cangDen || dischargePortsList[0] || 'Xiamen (Hạ Môn)');

    setTenTauChuyen(s.tenTauChuyen || '');
    setHangTau(s.hangTau || 'ONE Line');
    setNgayDongHangTu(s.ngayDongHangTu || '');
    setNgayDongHangDen(s.ngayDongHangDen || '');
    setNgayTauChayATD(s.ngayTauChayATD);
    setNgayDenETA(s.ngayDenETA);
    setTyGiaThucTe(s.tyGiaThucTe || 25450);
    setTrangThaiLoHang(s.trangThaiLoHang);
    setGhiChu(s.ghiChu || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!cangDiSelect || !cangDenSelect) {
        alert('Vui lòng chọn cảng đi và cảng đến!');
        setSaving(false);
        return;
      }

      await saveShipment(
        {
          maDotXuat,
          soHD,
          soBLBooking,
          soToKhaiHaiQuan,
          sanLuongThucXuat: Number(sanLuongThucXuat),
          soLuongCont: Number(soLuongCont),
          loaiCont,
          cangDi: cangDiSelect.trim(),
          cangDen: cangDenSelect.trim(),
          tenTauChuyen,
          hangTau,
          ngayDongHangTu,
          ngayDongHangDen,
          ngayTauChayATD,
          ngayDenETA,
          tyGiaThucTe: Number(tyGiaThucTe),
          trangThaiLoHang,
          ghiChu,
        },
        editShipment?.id
      );

      setIsModalOpen(false);
    } catch (err: any) {
      alert('Lỗi lưu đợt xuất: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Bạn muốn xóa đợt xuất ${code}?`)) {
      await removeShipment(id);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    return (
      s.maDotXuat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.soHD.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.soBLBooking && s.soBLBooking.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.hangTau && s.hangTau.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.cangDen && s.cangDen.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const remainingInfo = getContractRemainingInfo(soHD, editShipment?.id);
  const selectedPortInfo = cangDenSelect && cangDenSelect !== 'CUSTOM' ? getPortRemainingInfo(soHD, cangDenSelect, editShipment?.id) : null;

  return (
    <div className="space-y-5">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã lô, số HĐ, booking B/L, hãng tàu, cảng đến..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
          />
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 min-h-[44px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đợt Xuất Mới</span>
        </button>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-3">Mã Lô</th>
                <th className="py-2.5 px-3">Số HĐ</th>
                <th className="py-2.5 px-3">Đóng Hàng Kho</th>
                <th className="py-2.5 px-3">Tàu / Chuyến</th>
                <th className="py-2.5 px-3">Hãng Tàu</th>
                <th className="py-2.5 px-3">Hành Trình (Cảng)</th>
                <th className="py-2.5 px-3 text-right">Số Cont</th>
                <th className="py-2.5 px-3 text-right">Thực Xuất (MT)</th>
                <th className="py-2.5 px-3">Lịch Tàu (ATD / ETA)</th>
                <th className="py-2.5 px-3 text-right">Tỷ Giá</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12.5px] leading-snug">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-6 text-center text-slate-400 text-xs">
                    Chưa có lô xuất hàng nào.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-bold text-sky-800 whitespace-nowrap">{s.maDotXuat}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">{s.soHD}</td>
                    <td className="py-2 px-3 text-[11px] whitespace-nowrap">
                      {s.ngayDongHangTu || s.ngayDongHangDen ? (
                        <div className="space-y-0.5">
                          <div className="text-slate-800 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>{s.ngayDongHangTu ? formatDateVN(s.ngayDongHangTu) : '...'}</span>
                          </div>
                          <div className="text-slate-500 pl-4">
                            ➔ {s.ngayDongHangDen ? formatDateVN(s.ngayDongHangDen) : '...'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-800 text-[12.5px]">{s.tenTauChuyen || '--'}</div>
                      <span className="text-[10.5px] text-slate-400 font-mono">B/L: {s.soBLBooking || '--'}</span>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">{s.hangTau}</td>
                    <td className="py-2 px-3 text-[11.5px]">
                      <div className="text-slate-800 font-medium">{s.cangDi}</div>
                      <div className="text-slate-500">➔ {s.cangDen}</div>
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-800 whitespace-nowrap">
                      {s.soLuongCont} <span className="text-[10.5px] text-slate-400">c ({s.loaiCont})</span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 whitespace-nowrap text-[13px]">
                      {formatNumber(s.sanLuongThucXuat)} MT
                    </td>
                    <td className="py-2 px-3 text-[11px] whitespace-nowrap">
                      <div>ATD: <span className="font-medium text-slate-700">{formatDateVN(s.ngayTauChayATD)}</span></div>
                      <div>ETA: <span className="font-medium text-slate-500">{formatDateVN(s.ngayDenETA)}</span></div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                      {formatNumber(s.tyGiaThucTe)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <Badge status={s.trangThaiLoHang} />
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 text-slate-500 hover:text-sky-600 rounded hover:bg-sky-50 transition-colors"
                          title="Sửa đợt xuất"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.maDotXuat)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Xóa đợt xuất"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
        {filteredShipments.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{s.maDotXuat}</h3>
                  <p className="text-xs text-slate-500">HĐ: <span className="font-semibold text-slate-700">{s.soHD}</span></p>
                </div>
              </div>
              <Badge status={s.trangThaiLoHang} />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hành trình cảng:</span>
                <span className="font-semibold text-slate-800">{s.cangDi} ➔ {s.cangDen}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tàu & Hãng:</span>
                <span className="font-semibold text-slate-800">{s.tenTauChuyen || '--'} ({s.hangTau})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Quy mô xuất:</span>
                <span className="font-bold text-emerald-700">{formatNumber(s.sanLuongThucXuat)} MT ({s.soLuongCont} cont {s.loaiCont})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Booking B/L:</span>
                <span className="font-mono text-slate-700">{s.soBLBooking || '--'}</span>
              </div>
              {(s.ngayDongHangTu || s.ngayDongHangDen) && (
                <div className="flex items-center justify-between text-amber-900 bg-amber-50/70 -mx-1 px-2.5 py-1.5 rounded-lg border border-amber-200/50">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Đóng hàng kho:
                  </span>
                  <span className="font-bold text-slate-800">
                    {s.ngayDongHangTu ? formatDateVN(s.ngayDongHangTu) : '...'} ➔ {s.ngayDongHangDen ? formatDateVN(s.ngayDongHangDen) : '...'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> ATD: {formatDateVN(s.ngayTauChayATD)}
                </span>
                <span className="text-slate-500">ETA: {formatDateVN(s.ngayDenETA)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
              <span className="text-slate-500">Tỷ giá: <strong className="text-slate-700 font-mono">{formatNumber(s.tyGiaThucTe)}</strong></span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.maDotXuat)}
                  className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Shipment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editShipment ? `Sửa Đợt Xuất ${editShipment.maDotXuat}` : 'Tạo Đợt Xuất Hàng Mới'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Lô/Đợt Xuất *</label>
              <input
                type="text"
                required
                value={maDotXuat}
                onChange={(e) => setMaDotXuat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                placeholder="XUAT-01A"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hợp Đồng Liên Kết *</label>
              <select
                value={soHD}
                onChange={(e) => handleContractChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px] bg-white font-medium"
              >
                <option value="">-- Chọn hợp đồng --</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.soHD}>
                    {c.soHD} - {c.tenKH} ({formatNumber(c.sanLuongKy)} MT)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Contract Remaining Helper Banner */}
          {soHD && remainingInfo.contract && (
            <div className="p-3 bg-sky-50/90 border border-sky-200 rounded-xl space-y-2 text-xs text-sky-950">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-700">
                  Hợp đồng: <strong className="text-slate-900">{remainingInfo.contract.soHD}</strong> ({remainingInfo.contract.tenKH})
                </span>
                <span className="text-slate-600">
                  Tổng ký: <strong>{formatNumber(remainingInfo.sanLuongKy)} MT</strong>
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Đã xuất các đợt trước:</span>
                <span className="font-semibold text-slate-800">
                  {formatNumber(remainingInfo.daXuatMT)} MT ({remainingInfo.daXuatCont} cont)
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1 border-t border-sky-200/70">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sky-900">Tổng HĐ còn chưa xuất:</span>
                  <span className="font-black text-sm text-sky-700">
                    {formatNumber(remainingInfo.conLaiMT)} MT ({remainingInfo.conLaiCont} cont)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSanLuongThucXuat(remainingInfo.conLaiMT);
                    setSoLuongCont(remainingInfo.conLaiCont);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-200/80 hover:bg-sky-300 text-sky-900 text-[11px] font-bold transition-colors cursor-pointer w-fit"
                  title="Bấm để lấy số lượng còn lại của toàn HĐ"
                >
                  <RefreshCw className="w-3 h-3" />
                  Lấy số dư toàn HĐ
                </button>
              </div>

              {/* Specific port allocation banner */}
              {selectedPortInfo && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1.5 border-t border-sky-200/80 bg-white/70 -mx-1 px-2.5 py-2 rounded-lg">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-emerald-800">Cảng {cangDenSelect}:</span>
                    <span className="text-slate-600">
                      Ký {formatNumber(selectedPortInfo.sanLuongMT)} MT • Đã xuất {formatNumber(selectedPortInfo.daXuatMT)} MT • Còn lại:
                    </span>
                    <span className="font-black text-xs text-emerald-700">
                      {formatNumber(selectedPortInfo.conLaiMT)} MT ({selectedPortInfo.conLaiCont} cont)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSanLuongThucXuat(selectedPortInfo.conLaiMT);
                      setSoLuongCont(selectedPortInfo.conLaiCont);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer w-fit shrink-0"
                    title="Bấm để lấy số lượng còn lại của riêng cảng này"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Lấy số dư cảng này
                  </button>
                </div>
              )}

              {remainingInfo.conLaiMT === 0 && (
                <p className="text-[11px] text-amber-800 font-medium pt-0.5">
                  ℹ️ HĐ này đã xuất đủ 100% sản lượng. Bạn vẫn có thể nhập thêm số lượng xuất vượt theo dung sai (±{remainingInfo.contract.dungSaiPercent}%).
                </p>
              )}
            </div>
          )}

          {/* Volume and Container inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thực Xuất (MT) *</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                required
                value={sanLuongThucXuat}
                onChange={(e) => setSanLuongThucXuat(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px] font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Cont *</label>
              <input
                type="number"
                inputMode="numeric"
                required
                value={soLuongCont}
                onChange={(e) => setSoLuongCont(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px] font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Cont *</label>
              <select
                value={loaiCont}
                onChange={(e) => {
                  const val = e.target.value;
                  setLoaiCont(val);
                  const pkg = remainingInfo.contract?.quyCachDongGoi?.toLowerCase() || '';
                  const isJumbo = pkg.includes('850') || pkg.includes('jumbo');
                  const mtPer = val === '20ft' ? (isJumbo ? 17 : 18.5) : 26;
                  if (sanLuongThucXuat > 0) {
                    setSoLuongCont(Math.round(sanLuongThucXuat / mtPer));
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px] bg-white font-medium"
              >
                <option value="20ft">20ft (Chuẩn / Mặc định)</option>
                <option value="40HC">40HC (Cao 9'6")</option>
                <option value="40GP">40GP (Thường 8'6")</option>
              </select>
            </div>
          </div>

          {/* Port Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cảng Đi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cảng Đi (Cảng Bốc) *</label>
              <select
                value={cangDiSelect}
                onChange={(e) => setCangDiSelect(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px] bg-white font-medium"
              >
                {cangDiSelect && !loadingPortsList.includes(cangDiSelect) && (
                  <option value={cangDiSelect}>{cangDiSelect}</option>
                )}
                <optgroup label="Cảng xuất khẩu Việt Nam (Danh Mục)">
                  {loadingPortsList.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Cảng Đến */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cảng Đến (Cảng Dỡ) *</label>
              <select
                value={cangDenSelect}
                onChange={(e) => handleCangDenChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px] bg-white font-medium"
              >
                {remainingInfo.contract?.danhSachCangDen && remainingInfo.contract.danhSachCangDen.length > 0 && (
                  <optgroup label={`⭐ Cảng theo hợp đồng ${soHD}`}>
                    {remainingInfo.contract.danhSachCangDen.map((p) => {
                      const pInfo = getPortRemainingInfo(soHD, p.cangDen, editShipment?.id);
                      const conLai = pInfo ? pInfo.conLaiMT : p.sanLuongMT;
                      return (
                        <option key={p.cangDen} value={p.cangDen}>
                          ⭐ {p.cangDen} (HĐ: {formatNumber(p.sanLuongMT)} MT {p.soLuongCont ? `/ ${p.soLuongCont}c ${p.loaiCont || '20ft'}` : ''} - Còn: {formatNumber(conLai)} MT)
                        </option>
                      );
                    })}
                  </optgroup>
                )}

                {cangDenSelect &&
                  !remainingInfo.contract?.danhSachCangDen?.some((cp) => cp.cangDen === cangDenSelect) &&
                  !dischargePortsList.includes(cangDenSelect) && (
                    <optgroup label="Cảng trong lô cũ">
                      <option value={cangDenSelect}>{cangDenSelect}</option>
                    </optgroup>
                  )}

                <optgroup label="Cảng dỡ hàng khác (Danh Mục)">
                  {dischargePortsList
                    .filter((p) => !remainingInfo.contract?.danhSachCangDen?.some((cp) => cp.cangDen === p))
                    .map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số B/L / Booking</label>
              <input
                type="text"
                value={soBLBooking}
                onChange={(e) => setSoBLBooking(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                placeholder="ONE-SGN-202601"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Tờ Khai Hải Quan</label>
              <input
                type="text"
                value={soToKhaiHaiQuan}
                onChange={(e) => setSoToKhaiHaiQuan(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                placeholder="105998823410"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Tàu / Số Chuyến</label>
              <input
                type="text"
                value={tenTauChuyen}
                onChange={(e) => setTenTauChuyen(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                placeholder="MV PACIFIC V.2601"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hãng Tàu</label>
              <input
                type="text"
                value={hangTau}
                onChange={(e) => setHangTau(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                placeholder="ONE Line, COSCO, SITC..."
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Thời Gian Đóng Hàng Tại Kho (Từ Ngày ➔ Đến Ngày)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Đóng Hàng Từ Ngày</label>
                <input
                  type="date"
                  value={ngayDongHangTu}
                  onChange={(e) => setNgayDongHangTu(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Đóng Hàng Đến Ngày</label>
                <input
                  type="date"
                  value={ngayDongHangDen}
                  onChange={(e) => setNgayDongHangDen(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày Chạy (ATD)</label>
              <input
                type="date"
                value={ngayTauChayATD}
                onChange={(e) => setNgayTauChayATD(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày Đến (ETA)</label>
              <input
                type="date"
                value={ngayDenETA}
                onChange={(e) => setNgayDenETA(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tỷ Giá USD/VND</label>
              <input
                type="number"
                inputMode="numeric"
                value={tyGiaThucTe}
                onChange={(e) => setTyGiaThucTe(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng Thái Lô Hàng</label>
            <select
              value={trangThaiLoHang}
              onChange={(e) => setTrangThaiLoHang(e.target.value as Shipment['trangThaiLoHang'])}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px] bg-white"
            >
              <option value="DANG_DONG_HANG">Đang đóng hàng tại nhà máy</option>
              <option value="DA_LEN_TAU">Đã lên tàu rời cảng</option>
              <option value="DA_THONG_QUAN">Đã hoàn tất thông quan & C/O</option>
              <option value="DA_DEN_CANG">Đã cập cảng đến</option>
              <option value="HOAN_TAT">Hoàn tất thủ tục</option>
            </select>
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
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {saving ? 'Đang Lưu...' : (editShipment ? 'Cập Nhật Đợt Xuất' : 'Lưu Đợt Xuất')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
