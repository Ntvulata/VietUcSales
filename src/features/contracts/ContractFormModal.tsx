import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Anchor, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { saveContract } from './contractsService';
import { subscribeToBankAccounts, INITIAL_BANK_ACCOUNTS } from '../master-data/masterDataService';
import { formatNumber, formatShortBankName } from '../../utils/formatters';
import type { Contract, Customer, Product, Port, ContractDestinationPort, BankAccount } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editContract?: Contract | null;
  customers: Customer[];
  products: Product[];
  ports?: Port[];
}

interface DestinationPortRow {
  id: string;
  cangDen: string;
  sanLuongMT: number;
  soLuongCont: number;
  loaiCont: string;
  ghiChu: string;
}

const calcDefaultContCount = (mt: number, loaiCont: string = '20ft', packaging: string = '') => {
  if (!mt || mt <= 0) return 0;
  let mtPerCont = 18.5; // Mặc định bao 50kg là 18.5 tấn / cont 20
  if (loaiCont === '20ft') {
    const pkg = packaging?.toLowerCase() || '';
    if (pkg.includes('850') || pkg.includes('jumbo')) {
      mtPerCont = 17; // Bao 850kg là 17 tấn / cont 20
    } else {
      mtPerCont = 18.5; // Bao 50kg là 18.5 tấn / cont 20
    }
  } else if (loaiCont === '40HC') {
    mtPerCont = 26;
  } else if (loaiCont === '40GP') {
    mtPerCont = 25;
  }
  return Math.round(mt / mtPerCont);
};

const FALLBACK_DISCHARGE_PORTS: Port[] = [
  { id: 'CN_XMN', maCang: 'CN_XMN', tenCang: 'Xiamen (Hạ Môn)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },
  { id: 'CN_TAO', maCang: 'CN_TAO', tenCang: 'Qingdao (Thanh Đảo)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },
  { id: 'CN_SHA', maCang: 'CN_SHA', tenCang: 'Shanghai (Thượng Hải)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },
  { id: 'CN_NGB', maCang: 'CN_NGB', tenCang: 'Ningbo (Ninh Ba)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },
  { id: 'CN_TXG', maCang: 'CN_TXG', tenCang: 'Tianjin (Thiên Tân)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },
  { id: 'KR_INC', maCang: 'KR_INC', tenCang: 'Incheon', phanLoai: 'Cang_Do', quocGia: 'Hàn Quốc' },
  { id: 'KR_PUS', maCang: 'KR_PUS', tenCang: 'Busan', phanLoai: 'Cang_Do', quocGia: 'Hàn Quốc' },
  { id: 'PH_MNL', maCang: 'PH_MNL', tenCang: 'Manila', phanLoai: 'Cang_Do', quocGia: 'Philippines' },
  { id: 'TH_BKK', maCang: 'TH_BKK', tenCang: 'Bangkok / Laem Chabang', phanLoai: 'Cang_Do', quocGia: 'Thái Lan' },
  { id: 'ID_JKT', maCang: 'ID_JKT', tenCang: 'Jakarta', phanLoai: 'Cang_Do', quocGia: 'Indonesia' },
];

export const ContractFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  editContract,
  customers,
  products,
  ports = [],
}) => {
  const navigate = useNavigate();
  const [soHD, setSoHD] = useState('');
  const [ngayKy, setNgayKy] = useState(new Date().toISOString().split('T')[0]);
  const [maKH, setMaKH] = useState('');
  const [tenKH, setTenKH] = useState('');
  const [maHang, setMaHang] = useState('');
  const [quyCachDongGoi, setQuyCachDongGoi] = useState('Bao PP 50kg');
  const [sanLuongKy, setSanLuongKy] = useState<number>(1000);
  const [dungSaiPercent, setDungSaiPercent] = useState<number>(5);
  const [donGiaUSD, setDonGiaUSD] = useState<number>(480);
  const [hinhThucTT, setHinhThucTT] = useState('L/C');
  const [nganHangLC, setNganHangLC] = useState('Vietcombank');
  const [soLC, setSoLC] = useState('');
  const [hanGiaoHangCuoi, setHanGiaoHangCuoi] = useState('');
  const [trangThaiHD, setTrangThaiHD] = useState<Contract['trangThaiHD']>('ACTIVE');
  const [ghiChu, setGhiChu] = useState('');
  const [danhSachCang, setDanhSachCang] = useState<DestinationPortRow[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isCustomBank, setIsCustomBank] = useState(false);
  const [saving, setSaving] = useState(false);

  const displayBanks = bankAccounts.length > 0 ? bankAccounts : INITIAL_BANK_ACCOUNTS;

  useEffect(() => {
    const unsub = subscribeToBankAccounts(setBankAccounts);
    return () => { if (unsub) unsub(); };
  }, []);

  // Master Data discharge ports
  const masterDischargePorts = ports.filter((p) => p.phanLoai === 'Cang_Do');
  const availablePorts: Port[] = masterDischargePorts.length > 0 ? masterDischargePorts : FALLBACK_DISCHARGE_PORTS;

  // Group countries: Trung Quốc, Hàn Quốc first, then others
  const countryOrder = ['Trung Quốc', 'China', 'Hàn Quốc', 'South Korea', 'Philippines', 'Thái Lan', 'Thailand', 'Indonesia'];
  const countries = Array.from(new Set(availablePorts.map((p) => p.quocGia || 'Khác'))).sort((a, b) => {
    const idxA = countryOrder.indexOf(a);
    const idxB = countryOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  useEffect(() => {
    if (editContract) {
      setSoHD(editContract.soHD);
      setNgayKy(editContract.ngayKy);
      setMaKH(editContract.maKH);
      setTenKH(editContract.tenKH);
      setMaHang(editContract.maHang);
      setQuyCachDongGoi(editContract.quyCachDongGoi);
      setSanLuongKy(editContract.sanLuongKy);
      setDungSaiPercent(editContract.dungSaiPercent);
      setDonGiaUSD(editContract.donGiaUSD);
      setHinhThucTT(editContract.hinhThucTT);
      if (editContract.nganHangLC) {
        const rawBank = editContract.nganHangLC;
        const shortName = formatShortBankName(rawBank);
        const currentBankName = (shortName || rawBank).trim();
        setNganHangLC(currentBankName);
        const exists = displayBanks.some(b => (b.tenVietTat || b.tenNganHang).toLowerCase() === currentBankName.toLowerCase());
        setIsCustomBank(!exists && Boolean(currentBankName));
      } else {
        setNganHangLC('Vietcombank');
        setIsCustomBank(false);
      }
      setSoLC(editContract.soLC || '');
      setHanGiaoHangCuoi(editContract.hanGiaoHangCuoi);
      setTrangThaiHD(editContract.trangThaiHD);
      setGhiChu(editContract.ghiChu || '');

      // Load existing ports
      if (editContract.danhSachCangDen && editContract.danhSachCangDen.length > 0) {
        setDanhSachCang(
          editContract.danhSachCangDen.map((p, idx) => ({
            id: `port-${idx}-${Date.now()}`,
            cangDen: p.cangDen,
            sanLuongMT: p.sanLuongMT,
            soLuongCont: p.soLuongCont ?? calcDefaultContCount(p.sanLuongMT, p.loaiCont || '20ft', editContract.quyCachDongGoi),
            loaiCont: p.loaiCont || '20ft',
            ghiChu: p.ghiChu || '',
          }))
        );
      } else if (editContract.cangDen) {
        const defaultCont = calcDefaultContCount(editContract.sanLuongKy, '20ft', editContract.quyCachDongGoi);
        setDanhSachCang([
          {
            id: `port-1`,
            cangDen: editContract.cangDen,
            sanLuongMT: editContract.sanLuongKy,
            soLuongCont: defaultCont,
            loaiCont: '20ft',
            ghiChu: '',
          }
        ]);
      } else {
        const defaultCont = calcDefaultContCount(editContract.sanLuongKy, '20ft', editContract.quyCachDongGoi);
        setDanhSachCang([
          {
            id: `port-1`,
            cangDen: availablePorts[0]?.tenCang || 'Xiamen (Hạ Môn)',
            sanLuongMT: editContract.sanLuongKy,
            soLuongCont: defaultCont,
            loaiCont: '20ft',
            ghiChu: '',
          }
        ]);
      }
    } else {
      setSoHD(`HD-${new Date().getFullYear()}-X0${Math.floor(Math.random() * 90 + 10)}`);
      setNgayKy(new Date().toISOString().split('T')[0]);
      setHanGiaoHangCuoi(new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]);
      setSanLuongKy(1000);
      setNganHangLC('Vietcombank');
      setIsCustomBank(false);
      setSoLC('');
      setDanhSachCang([
        {
          id: `port-1`,
          cangDen: availablePorts[0]?.tenCang || 'Xiamen (Hạ Môn)',
          sanLuongMT: 1000,
          soLuongCont: 54,
          loaiCont: '20ft',
          ghiChu: '',
        }
      ]);
    }
  }, [editContract, isOpen]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMaKH = e.target.value;
    setMaKH(selectedMaKH);
    const found = customers.find((c) => c.maKH === selectedMaKH);
    if (found) setTenKH(found.tenKH);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMaHang = e.target.value;
    setMaHang(selectedMaHang);
    const found = products.find((p) => p.maHang === selectedMaHang);
    if (found) {
      setQuyCachDongGoi(found.dongGoi);
      if (!editContract) {
        setDanhSachCang(
          danhSachCang.map((p) => ({
            ...p,
            soLuongCont: calcDefaultContCount(p.sanLuongMT, p.loaiCont, found.dongGoi),
          }))
        );
      }
    }
  };

  // Port rows handlers
  const handleAddPortRow = () => {
    const tongHienTai = danhSachCang.reduce((sum, p) => sum + (Number(p.sanLuongMT) || 0), 0);
    const conLai = Math.max(0, Number(sanLuongKy) - tongHienTai);
    const newPortMT = conLai > 0 ? conLai : 200;
    
    // Pick next port from Master Data not already in list
    const usedPorts = new Set(danhSachCang.map(p => p.cangDen));
    const nextPortObj = availablePorts.find(p => !usedPorts.has(p.tenCang)) || availablePorts[0];
    const nextPort = nextPortObj ? nextPortObj.tenCang : 'Qingdao (Thanh Đảo)';

    setDanhSachCang([
      ...danhSachCang,
      {
        id: `port-${Date.now()}`,
        cangDen: nextPort,
        sanLuongMT: newPortMT,
        soLuongCont: calcDefaultContCount(newPortMT, '20ft', quyCachDongGoi),
        loaiCont: '20ft',
        ghiChu: '',
      }
    ]);
  };

  const handleRemovePortRow = (id: string) => {
    if (danhSachCang.length <= 1) {
      alert('Hợp đồng cần có ít nhất 1 cảng đến!');
      return;
    }
    setDanhSachCang(danhSachCang.filter(p => p.id !== id));
  };

  const handlePortChange = (id: string, field: keyof DestinationPortRow, val: any) => {
    setDanhSachCang(
      danhSachCang.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: val };
        if (field === 'sanLuongMT') {
          updated.soLuongCont = calcDefaultContCount(Number(val), row.loaiCont, quyCachDongGoi);
        } else if (field === 'loaiCont') {
          updated.soLuongCont = calcDefaultContCount(row.sanLuongMT, String(val), quyCachDongGoi);
        }
        return updated;
      })
    );
  };

  const handleDistributeRemaining = () => {
    const tongHienTai = danhSachCang.reduce((sum, p) => sum + (Number(p.sanLuongMT) || 0), 0);
    const chenhLech = Number(sanLuongKy) - tongHienTai;
    if (chenhLech === 0) return;

    if (danhSachCang.length > 0) {
      const last = danhSachCang[danhSachCang.length - 1];
      const newAmount = Math.max(0, Number(last.sanLuongMT) + chenhLech);
      const newCont = calcDefaultContCount(newAmount, last.loaiCont, quyCachDongGoi);
      setDanhSachCang(
        danhSachCang.map(row => row.id === last.id ? { ...row, sanLuongMT: newAmount, soLuongCont: newCont } : row)
      );
    }
  };

  const handleSyncSanLuongKy = () => {
    const tongCang = danhSachCang.reduce((sum, p) => sum + (Number(p.sanLuongMT) || 0), 0);
    if (tongCang > 0) {
      setSanLuongKy(tongCang);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soHD || !maKH || !sanLuongKy || !donGiaUSD) {
      alert('Vui lòng điền các thông tin bắt buộc (*)');
      return;
    }

    // Process ports strictly from Master Data
    const cleanedPorts: ContractDestinationPort[] = danhSachCang.map((p) => ({
      cangDen: p.cangDen.trim(),
      sanLuongMT: Number(p.sanLuongMT) || 0,
      soLuongCont: Number(p.soLuongCont) || calcDefaultContCount(Number(p.sanLuongMT), p.loaiCont, quyCachDongGoi),
      loaiCont: p.loaiCont || '20ft',
      ghiChu: p.ghiChu?.trim() || '',
    })).filter(p => p.cangDen && p.sanLuongMT > 0);

    if (cleanedPorts.length === 0) {
      alert('Vui lòng chọn ít nhất 1 cảng đến với sản lượng > 0!');
      return;
    }

    const tongGiaTriUSD = Number(sanLuongKy) * Number(donGiaUSD);
    const summaryCangDen = cleanedPorts.map(p => `${p.cangDen}: ${formatNumber(p.sanLuongMT)} MT (${p.soLuongCont}c ${p.loaiCont || '20ft'})`).join(' • ');

    setSaving(true);
    try {
      await saveContract({
        soHD,
        ngayKy,
        maKH,
        tenKH: tenKH || maKH,
        maHang: maHang || 'VU-50kg',
        quyCachDongGoi,
        sanLuongKy: Number(sanLuongKy),
        dungSaiPercent: Number(dungSaiPercent),
        donGiaUSD: Number(donGiaUSD),
        tongGiaTriUSD,
        danhSachCangDen: cleanedPorts,
        cangDen: summaryCangDen,
        hinhThucTT,
        nganHangLC,
        soLC: soLC.trim() || undefined,
        hanGiaoHangCuoi,
        trangThaiHD,
        ghiChu,
      }, editContract?.id);

      onClose();
      if (trangThaiHD === 'PAID') {
        navigate(`/payments?create=true&soHD=${encodeURIComponent(soHD)}`);
      }
    } catch (err: any) {
      alert('Lỗi lưu hợp đồng: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const calcTotal = (Number(sanLuongKy) || 0) * (Number(donGiaUSD) || 0);
  const tongPhanBoCang = danhSachCang.reduce((sum, p) => sum + (Number(p.sanLuongMT) || 0), 0);
  const tongContCang = danhSachCang.reduce((sum, p) => sum + (Number(p.soLuongCont) || 0), 0);
  const chenhLechSanLuong = Number(sanLuongKy) - tongPhanBoCang;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editContract ? `Sửa Hợp Đồng ${editContract.soHD}` : 'Thêm Hợp Đồng Xuất Khẩu Mới'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Số HĐ & Ngày Ký */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Số HĐ *</label>
            <input
              type="text"
              required
              value={soHD}
              onChange={(e) => setSoHD(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              placeholder="VD: 15.2026/VU-MOA"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày Ký *</label>
            <input
              type="date"
              required
              value={ngayKy}
              onChange={(e) => setNgayKy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        {/* Khách Hàng */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Khách Hàng (Đối tác xuất khẩu) *</label>
            <select
              value={maKH}
              onChange={handleCustomerChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px] bg-white font-medium text-slate-800"
            >
              <option value="">-- Chọn khách hàng đối tác --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.maKH}>
                  {c.tenKH} ({c.quocGia}){c.diaChiChiTiet ? ` - ${c.diaChiChiTiet}` : ''}
                </option>
              ))}
              <option value="KH_KHAC">+ Khách hàng mới khác...</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Hiển Thị Khách Hàng Trên Hợp Đồng</label>
            <input
              type="text"
              value={tenKH}
              onChange={(e) => setTenKH(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              placeholder="Tên công ty đối tác đầy đủ..."
            />
          </div>
        </div>

        {/* Mặt Hàng & Quy Cách */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mặt Hàng</label>
            <select
              value={maHang}
              onChange={handleProductChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px] bg-white font-medium"
            >
              <option value="">-- Chọn mặt hàng --</option>
              {products.map((p) => (
                <option key={p.id} value={p.maHang}>{p.maHang} - {p.tenHang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quy Cách Đóng Gói</label>
            <input
              type="text"
              value={quyCachDongGoi}
              onChange={(e) => {
                const val = e.target.value;
                setQuyCachDongGoi(val);
                if (!editContract) {
                  setDanhSachCang(
                    danhSachCang.map((p) => ({
                      ...p,
                      soLuongCont: calcDefaultContCount(p.sanLuongMT, p.loaiCont, val),
                    }))
                  );
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              placeholder="Bao PP 50kg / Jumbo 850kg"
            />
          </div>
        </div>

        {/* Sản lượng & Đơn giá */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tổng Sản Lượng (MT) *</label>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              required
              value={sanLuongKy}
              onChange={(e) => {
                const newTotal = Number(e.target.value);
                setSanLuongKy(newTotal);
                if (!editContract && danhSachCang.length === 1) {
                  const defaultCont = calcDefaultContCount(newTotal, danhSachCang[0].loaiCont, quyCachDongGoi);
                  setDanhSachCang([{ ...danhSachCang[0], sanLuongMT: newTotal, soLuongCont: defaultCont }]);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px] font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dung Sai (+/- %)</label>
            <input
              type="number"
              value={dungSaiPercent}
              onChange={(e) => setDungSaiPercent(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn Giá ($/MT) *</label>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              required
              value={donGiaUSD}
              onChange={(e) => setDonGiaUSD(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px] font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Calculated Total Value Box */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
          <span className="text-xs font-semibold">Tổng Giá Trị Hợp Đồng:</span>
          <span className="text-base font-extrabold">${calcTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        {/* --- DYNAMIC DESTINATION PORTS SECTION --- */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Cảng Đến
              </h4>
            </div>
            <button
              type="button"
              onClick={handleAddPortRow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Cảng Đến</span>
            </button>
          </div>

          {/* Destination Port Rows */}
          <div className="space-y-2.5">
            {danhSachCang.map((row, idx) => (
              <div 
                key={row.id} 
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Cảng #{idx + 1}</span>
                  {danhSachCang.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePortRow(row.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa cảng</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Select Port from Master Data */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Cảng Đến (Từ Danh Mục) *
                    </label>
                    <select
                      value={row.cangDen}
                      onChange={(e) => handlePortChange(row.id, 'cangDen', e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[40px] bg-white font-medium"
                    >
                      {/* If existing contract has a port not currently in availablePorts, preserve it */}
                      {row.cangDen && !availablePorts.some(p => p.tenCang === row.cangDen) && (
                        <optgroup label="Cảng trong HĐ cũ">
                          <option value={row.cangDen}>{row.cangDen}</option>
                        </optgroup>
                      )}

                      {countries.map((country) => (
                        <optgroup key={country} label={`Cảng ${country}`}>
                          {availablePorts
                            .filter((p) => (p.quocGia || 'Khác') === country)
                            .map((p) => (
                              <option key={p.id || p.maCang || p.tenCang} value={p.tenCang}>
                                {p.tenCang}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Quantity for this port */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Sản Lượng (MT) *</label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      required
                      value={row.sanLuongMT}
                      onChange={(e) => handlePortChange(row.id, 'sanLuongMT', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[40px] font-bold text-slate-900"
                    />
                  </div>

                  {/* Loại Cont */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Loại Cont</label>
                    <select
                      value={row.loaiCont}
                      onChange={(e) => handlePortChange(row.id, 'loaiCont', e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[40px] bg-white font-medium"
                    >
                      <option value="20ft">20ft (Chuẩn)</option>
                      <option value="40HC">40HC (Cao)</option>
                      <option value="40GP">40GP (Thường)</option>
                    </select>
                  </div>

                  {/* Số Cont */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Số Cont</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      inputMode="numeric"
                      required
                      value={row.soLuongCont}
                      onChange={(e) => handlePortChange(row.id, 'soLuongCont', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[40px] font-bold text-sky-800"
                    />
                  </div>

                  {/* Port notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Ghi Chú Cảng</label>
                    <input
                      type="text"
                      value={row.ghiChu}
                      onChange={(e) => handlePortChange(row.id, 'ghiChu', e.target.value)}
                      placeholder="VD: Giao CIF, đợt 1..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[40px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Allocation balance status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              {chenhLechSanLuong === 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã phân bổ đủ {formatNumber(tongPhanBoCang)} / {formatNumber(sanLuongKy)} MT ({tongContCang} cont - {danhSachCang.length} cảng)</span>
                </div>
              ) : chenhLechSanLuong > 0 ? (
                <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Đã phân bổ {formatNumber(tongPhanBoCang)} MT ({tongContCang} cont), còn thiếu {formatNumber(chenhLechSanLuong)} MT chưa gán cảng</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Tổng các cảng ({formatNumber(tongPhanBoCang)} MT - {tongContCang} cont) vượt quá HĐ ({formatNumber(sanLuongKy)} MT)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {chenhLechSanLuong !== 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleDistributeRemaining}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold border border-sky-200 transition-colors cursor-pointer"
                  >
                    Phân bổ phần còn lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncSanLuongKy}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-200 transition-colors cursor-pointer"
                  >
                    Cập nhật HĐ = Tổng cảng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Thanh toán & Hạn giao */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hình Thức TT</label>
            <select
              value={hinhThucTT}
              onChange={(e) => setHinhThucTT(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px] bg-white font-medium"
            >
              <option value="L/C">L/C At Sight</option>
              <option value="T/T 30 - 70">T/T 30 - 70</option>
              <option value="T/T 100% trước khi giao">T/T 100% trước giao</option>
              <option value="CAD">CAD</option>
              <option value="D/P">D/P</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số L/C Đã Mở {hinhThucTT.includes('L/C') && <span className="text-emerald-600 font-bold">*</span>}
            </label>
            <input
              type="text"
              value={soLC}
              onChange={(e) => setSoLC(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px] font-mono"
              placeholder={hinhThucTT.includes('L/C') ? "VD: LC2601988..." : "Nếu có L/C..."}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Ngân Hàng Nhận Tiền</label>
              {isCustomBank && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomBank(false);
                    setNganHangLC(displayBanks[0]?.tenVietTat || 'Vietcombank');
                  }}
                  className="text-[11px] text-emerald-600 hover:underline font-medium"
                >
                  Chọn từ danh mục
                </button>
              )}
            </div>

            {!isCustomBank ? (
              <select
                value={nganHangLC}
                onChange={(e) => {
                  if (e.target.value === 'CUSTOM') {
                    setIsCustomBank(true);
                    setNganHangLC('');
                  } else {
                    setNganHangLC(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px] bg-white font-medium text-slate-800"
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
                value={nganHangLC}
                onChange={(e) => setNganHangLC(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                placeholder="Nhập tên ngân hàng khác..."
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn Giao Hàng</label>
            <input
              type="date"
              value={hanGiaoHangCuoi}
              onChange={(e) => setHanGiaoHangCuoi(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        {/* Trạng thái & Ghi chú */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng Thái HĐ</label>
            <select
              value={trangThaiHD}
              onChange={(e) => setTrangThaiHD(e.target.value as Contract['trangThaiHD'])}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px] bg-white font-medium"
            >
              <option value="ACTIVE">ACTIVE (Đang thực hiện)</option>
              <option value="PAID">PAID (Đã thanh toán)</option>
              <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
              <option value="DRAFT">DRAFT (Bản nháp)</option>
              <option value="CANCELLED">CANCELLED (Đã hủy)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú</label>
            <input
              type="text"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              placeholder="Ghi chú điều khoản..."
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
          >
            {saving ? 'Đang Lưu...' : (editContract ? 'Cập Nhật Hợp Đồng' : 'Tạo Hợp Đồng')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
