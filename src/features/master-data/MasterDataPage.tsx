import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  Anchor, 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Mail,
  Phone,
  Globe,
  Landmark,
  Copy,
  Check,
  MapPin
} from 'lucide-react';
import { 
  subscribeToCustomers, 
  subscribeToProducts, 
  subscribeToPorts, 
  subscribeToCostCategories,
  subscribeToBankAccounts,
  saveCustomer,
  removeCustomer,
  saveProduct,
  removeProduct,
  savePort,
  removePort,
  saveCostCategory,
  removeCostCategory,
  saveBankAccount,
  removeBankAccount
} from './masterDataService';
import { Modal } from '../../components/common/Modal';
import type { Customer, Product, Port, CostCategory, BankAccount } from '../../types';

export const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'products' | 'ports' | 'costs' | 'banks'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [editPort, setEditPort] = useState<Port | null>(null);
  const [isCostCatModalOpen, setIsCostCatModalOpen] = useState(false);
  const [editCostCat, setEditCostCat] = useState<CostCategory | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editBank, setEditBank] = useState<BankAccount | null>(null);

  // Customer Form states
  const [maKH, setMaKH] = useState('');
  const [tenKH, setTenKH] = useState('');
  const [quocGia, setQuocGia] = useState('');
  const [diaChiChiTiet, setDiaChiChiTiet] = useState('');
  const [email, setEmail] = useState('');
  const [dienThoai, setDienThoai] = useState('');

  // Product Form states
  const [maHang, setMaHang] = useState('');
  const [tenHang, setTenHang] = useState('');
  const [dongGoi, setDongGoi] = useState('');

  // Port Form states
  const [maCang, setMaCang] = useState('');
  const [tenCang, setTenCang] = useState('');
  const [phanLoaiPort, setPhanLoaiPort] = useState<Port['phanLoai']>('Cang_Do');
  const [quocGiaPort, setQuocGiaPort] = useState('');

  // Cost Cat Form states
  const [khoanMuc, setKhoanMuc] = useState('');
  const [doiTacMacDinh, setDoiTacMacDinh] = useState('');
  const [loaiDichVu, setLoaiDichVu] = useState('');

  // Bank Form states
  const [tenVietTat, setTenVietTat] = useState('');
  const [soTaiKhoan, setSoTaiKhoan] = useState('');
  const [tenNganHang, setTenNganHang] = useState('');
  const [chiNhanh, setChiNhanh] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [loaiTienBank, setLoaiTienBank] = useState('USD');
  const [tenThuHuong, setTenThuHuong] = useState('');
  const [ghiChuBank, setGhiChuBank] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubC = subscribeToCustomers(setCustomers);
    const unsubPr = subscribeToProducts(setProducts);
    const unsubPo = subscribeToPorts(setPorts);
    const unsubCo = subscribeToCostCategories(setCostCategories);
    const unsubB = subscribeToBankAccounts(setBankAccounts);

    return () => {
      if (unsubC) unsubC();
      if (unsubPr) unsubPr();
      if (unsubPo) unsubPo();
      if (unsubCo) unsubCo();
      if (unsubB) unsubB();
    };
  }, []);

  // Customer Handlers
  const handleOpenAddCustomer = () => {
    setEditCustomer(null);
    setMaKH(`KH_${Date.now().toString().slice(-4)}`);
    setTenKH('');
    setQuocGia('China');
    setDiaChiChiTiet('');
    setEmail('');
    setDienThoai('');
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditCustomer(c);
    setMaKH(c.maKH);
    setTenKH(c.tenKH);
    setQuocGia(c.quocGia);
    setDiaChiChiTiet(c.diaChiChiTiet || '');
    setEmail(c.email || '');
    setDienThoai(c.dienThoai || '');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCustomer({
        id: editCustomer?.id || maKH,
        maKH,
        tenKH,
        quocGia,
        diaChiChiTiet,
        email,
        dienThoai,
      });
      setIsCustomerModalOpen(false);
    } catch (err: any) {
      alert('Lỗi lưu khách hàng: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (window.confirm(`Bạn muốn xóa khách hàng "${name}"?`)) {
      await removeCustomer(id);
    }
  };

  // Product Handlers
  const handleOpenAddProduct = () => {
    setEditProduct(null);
    setMaHang('');
    setTenHang('');
    setDongGoi('Bao PP 50kg');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditProduct(p);
    setMaHang(p.maHang);
    setTenHang(p.tenHang);
    setDongGoi(p.dongGoi);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProduct({
        id: editProduct?.id || maHang,
        maHang,
        tenHang,
        dongGoi,
      });
      setIsProductModalOpen(false);
    } catch (err: any) {
      alert('Lỗi lưu mặt hàng: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Bạn muốn xóa mặt hàng "${name}"?`)) {
      await removeProduct(id);
    }
  };

  // Port Handlers
  const handleOpenAddPort = () => {
    setEditPort(null);
    setMaCang('');
    setTenCang('');
    setPhanLoaiPort('Cang_Do');
    setQuocGiaPort('China');
    setIsPortModalOpen(true);
  };

  const handleOpenEditPort = (p: Port) => {
    setEditPort(p);
    setMaCang(p.maCang);
    setTenCang(p.tenCang);
    setPhanLoaiPort(p.phanLoai);
    setQuocGiaPort(p.quocGia || '');
    setIsPortModalOpen(true);
  };

  const handleSavePort = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePort({
        id: editPort?.id || maCang,
        maCang,
        tenCang,
        phanLoai: phanLoaiPort,
        quocGia: quocGiaPort,
      });
      setIsPortModalOpen(false);
    } catch (err: any) {
      alert('Lỗi lưu cảng biển: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePort = async (id: string, name: string) => {
    if (window.confirm(`Bạn muốn xóa cảng "${name}"?`)) {
      await removePort(id);
    }
  };

  // Cost Category Handlers
  const handleOpenAddCostCat = () => {
    setEditCostCat(null);
    setKhoanMuc('');
    setDoiTacMacDinh('');
    setLoaiDichVu('Logistics');
    setIsCostCatModalOpen(true);
  };

  const handleOpenEditCostCat = (c: CostCategory) => {
    setEditCostCat(c);
    setKhoanMuc(c.khoanMuc);
    setDoiTacMacDinh(c.doiTacMacDinh);
    setLoaiDichVu(c.loaiDichVu);
    setIsCostCatModalOpen(true);
  };

  const handleSaveCostCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCostCategory({
        id: editCostCat?.id || `CC_${Date.now()}`,
        khoanMuc,
        doiTacMacDinh,
        loaiDichVu,
      });
      setIsCostCatModalOpen(false);
    } catch (err: any) {
      alert('Lỗi lưu khoản mục phí: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCostCat = async (id: string, name: string) => {
    if (window.confirm(`Bạn muốn xóa khoản mục "${name}"?`)) {
      await removeCostCategory(id);
    }
  };

  // Bank Handlers
  const handleOpenAddBank = () => {
    setEditBank(null);
    setTenVietTat('');
    setSoTaiKhoan('');
    setTenNganHang('');
    setChiNhanh('');
    setSwiftCode('');
    setLoaiTienBank('USD');
    setTenThuHuong('');
    setGhiChuBank('');
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (b: BankAccount) => {
    setEditBank(b);
    setTenVietTat(b.tenVietTat || '');
    setSoTaiKhoan(b.soTaiKhoan);
    setTenNganHang(b.tenNganHang);
    setChiNhanh(b.chiNhanh || '');
    setSwiftCode(b.swiftCode);
    setLoaiTienBank(b.loaiTien || 'USD');
    setTenThuHuong(b.tenThuHuong || '');
    setGhiChuBank(b.ghiChu || '');
    setIsBankModalOpen(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBankAccount({
        id: editBank?.id || `BANK_${soTaiKhoan.trim().replace(/[^a-zA-Z0-9]/g, '_')}`,
        soTaiKhoan: soTaiKhoan.trim(),
        tenVietTat: tenVietTat.trim() || undefined,
        tenNganHang: tenNganHang.trim(),
        chiNhanh: chiNhanh.trim(),
        swiftCode: swiftCode.trim().toUpperCase(),
        loaiTien: loaiTienBank,
        tenThuHuong: tenThuHuong.trim(),
        ghiChu: ghiChuBank.trim(),
      });
      setIsBankModalOpen(false);
    } catch (err: any) {
      alert('Lỗi lưu tài khoản ngân hàng: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBank = async (id: string, stk: string) => {
    if (window.confirm(`Bạn muốn xóa tài khoản ngân hàng "${stk}"?`)) {
      await removeBankAccount(id);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Current Add Action based on tab
  const handleAddNewForCurrentTab = () => {
    switch (activeTab) {
      case 'customers': return handleOpenAddCustomer();
      case 'products': return handleOpenAddProduct();
      case 'ports': return handleOpenAddPort();
      case 'costs': return handleOpenAddCostCat();
      case 'banks': return handleOpenAddBank();
    }
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case 'customers': return 'Thêm Khách Hàng Mới';
      case 'products': return 'Thêm Mặt Hàng Mới';
      case 'ports': return 'Thêm Cảng Biển';
      case 'costs': return 'Thêm Khoản Mục Phí';
      case 'banks': return 'Thêm Ngân Hàng Nhận Tiền';
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.maKH.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tenKH.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.quocGia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.diaChiChiTiet && c.diaChiChiTiet.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBanks = bankAccounts.filter(b => 
    b.soTaiKhoan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.tenVietTat && b.tenVietTat.toLowerCase().includes(searchTerm.toLowerCase())) ||
    b.tenNganHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.chiNhanh && b.chiNhanh.toLowerCase().includes(searchTerm.toLowerCase())) ||
    b.swiftCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.ghiChu && b.ghiChu.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.tenThuHuong && b.tenThuHuong.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tabs = [
    { key: 'customers', label: '1. Khách Hàng', icon: Users, count: customers.length },
    { key: 'products', label: '2. Mặt Hàng & Bao Bì', icon: Package, count: products.length },
    { key: 'ports', label: '3. Cảng Đi & Đến', icon: Anchor, count: ports.length },
    { key: 'costs', label: '4. Hạng Mục Chi Phí', icon: Tag, count: costCategories.length },
    { key: 'banks', label: '5. Ngân Hàng Nhận Tiền', icon: Landmark, count: bankAccounts.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[44px]"
          />
        </div>

        {/* Dynamic Add Button */}
        <button
          onClick={handleAddNewForCurrentTab}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all active:scale-95 min-h-[44px] shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{getAddButtonText()}</span>
        </button>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Danh Sách Đối Tác Khách Hàng (Quốc Tế)</h3>
              <span className="text-xs text-slate-400">Tổng cộng {filteredCustomers.length} đối tác</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100/90 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Mã KH</th>
                    <th className="py-2.5 px-3">Tên Công Ty / Doanh Nghiệp</th>
                    <th className="py-2.5 px-3">Quốc Gia</th>
                    <th className="py-2.5 px-3">Địa Chỉ Chi Tiết</th>
                    <th className="py-2.5 px-3">Liên Hệ (Email / Phone)</th>
                    <th className="py-2.5 px-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        Chưa có khách hàng nào. Bấm nút "Thêm Khách Hàng Mới" ở trên để tạo!
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">{c.maKH}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{c.tenKH}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                            <Globe className="w-3 h-3 text-slate-500" />
                            {c.quocGia}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11.5px] text-slate-600 max-w-[280px]">
                          {c.diaChiChiTiet ? (
                            <div className="flex items-start gap-1" title={c.diaChiChiTiet}>
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{c.diaChiChiTiet}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[11.5px] text-slate-500 whitespace-nowrap">
                          {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</div>}
                          {c.dienThoai && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.dienThoai}</div>}
                          {!c.email && !c.dienThoai && <span className="text-slate-400">--</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditCustomer(c)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                              title="Sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(c.id, c.tenKH)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                              title="Xóa"
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

          {/* Mobile Card List */}
          <div className="lg:hidden space-y-3">
            {filteredCustomers.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700">{c.maKH}</span>
                    <h4 className="text-base font-bold text-slate-900">{c.tenKH}</h4>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    <Globe className="w-3 h-3" /> {c.quocGia}
                  </span>
                </div>
                {c.diaChiChiTiet && (
                  <div className="text-xs text-slate-600 flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{c.diaChiChiTiet}</span>
                  </div>
                )}
                {(c.email || c.dienThoai) && (
                  <div className="text-xs text-slate-500 space-y-0.5">
                    {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</div>}
                    {c.dienThoai && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.dienThoai}</div>}
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditCustomer(c)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(c.id, c.tenKH)}
                    className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Loại Hàng Hóa & Quy Cách Đóng Gói</h3>
            <span className="text-xs text-slate-400">Tổng cộng {products.length} mặt hàng</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100/90 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Mã Hàng</th>
                  <th className="py-2.5 px-3">Tên Hàng Nông Sản</th>
                  <th className="py-2.5 px-3">Quy Cách Đóng Gói Tiêu Chuẩn</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-sky-700 whitespace-nowrap">{p.maHang}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{p.tenHang}</td>
                    <td className="py-2 px-3 text-slate-600">{p.dongGoi}</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1 text-slate-400 hover:text-sky-600 rounded hover:bg-sky-50 transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.tenHang)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PORTS */}
      {activeTab === 'ports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Hệ Thống Cảng Biển (Cảng Bốc & Cảng Dỡ)</h3>
            <span className="text-xs text-slate-400">Tổng cộng {ports.length} cảng</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100/90 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Mã Cảng</th>
                  <th className="py-2.5 px-3">Tên Cảng Biển</th>
                  <th className="py-2.5 px-3">Phân Loại Nghiệp Vụ</th>
                  <th className="py-2.5 px-3">Quốc Gia</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {ports.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{po.maCang}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{po.tenCang}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${po.phanLoai === 'Cang_Boc' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>
                        {po.phanLoai === 'Cang_Boc' ? 'Cảng bốc xuất (VN)' : 'Cảng dỡ hàng (Đích)'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{po.quocGia || '--'}</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditPort(po)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePort(po.id, po.tenCang)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COST CATEGORIES */}
      {activeTab === 'costs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Khoản Mục Phí Thường Dùng & Đối Tác</h3>
            <span className="text-xs text-slate-400">Tổng cộng {costCategories.length} khoản mục</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100/90 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Khoản Mục Phí</th>
                  <th className="py-2.5 px-3">Nhà Cung Cấp / Đối Tác Thường Dùng</th>
                  <th className="py-2.5 px-3">Phân Loại Dịch Vụ</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12.5px]">
                {costCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-bold text-slate-800">{cat.khoanMuc}</td>
                    <td className="py-2 px-3 text-slate-600">{cat.doiTacMacDinh}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 font-mono">
                        {cat.loaiDichVu}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditCostCat(cat)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCostCat(cat.id, cat.khoanMuc)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BANK ACCOUNTS */}
      {activeTab === 'banks' && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Danh Mục Tài Khoản Ngân Hàng Nhận Tiền (Thụ Hưởng L/C, T/T)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Sử dụng cho điều khoản thanh toán hợp đồng xuất khẩu và theo dõi tiền về</p>
              </div>
              <span className="text-xs text-slate-400 font-medium">Tổng cộng {filteredBanks.length} tài khoản</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100/90 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Số Tài Khoản (Account No.)</th>
                    <th className="py-2.5 px-3">Ngân Hàng & Địa Chỉ / Chi Nhánh</th>
                    <th className="py-2.5 px-3">SWIFT CODE</th>
                    <th className="py-2.5 px-3">Đơn Vị Thụ Hưởng & Ghi Chú</th>
                    <th className="py-2.5 px-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px]">
                  {filteredBanks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                        Chưa có tài khoản ngân hàng nào. Bấm nút "Thêm Ngân Hàng Nhận Tiền" ở trên để tạo!
                      </td>
                    </tr>
                  ) : (
                    filteredBanks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[13px] text-slate-900 tracking-wider">
                              {b.soTaiKhoan}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-bold uppercase ${
                              b.loaiTien === 'USD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {b.loaiTien || 'USD'}
                            </span>
                            <button
                              onClick={() => handleCopy(b.soTaiKhoan, `acc_${b.id}`)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              title="Sao chép số tài khoản"
                            >
                              {copiedKey === `acc_${b.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[12px] text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 shadow-2xs whitespace-nowrap">
                              {b.tenVietTat || b.tenNganHang}
                            </span>
                            <span className="text-[11.5px] text-slate-500 font-medium truncate max-w-[260px]" title={b.tenNganHang}>
                              {b.tenNganHang}
                            </span>
                          </div>
                          {b.chiNhanh && (
                            <div className="text-[11px] text-slate-400 mt-0.5 pl-0.5">{b.chiNhanh}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800 font-mono font-bold text-[11px] tracking-wider">
                            <span>{b.swiftCode}</span>
                            <button
                              onClick={() => handleCopy(b.swiftCode, `swift_${b.id}`)}
                              className="p-0.5 text-sky-600 hover:text-sky-900 transition-colors"
                              title="Sao chép SWIFT code"
                            >
                              {copiedKey === `swift_${b.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-[11.5px] text-slate-600">
                          {b.tenThuHuong && <div className="font-medium text-slate-800">Thụ hưởng: {b.tenThuHuong}</div>}
                          {b.ghiChu ? <div>{b.ghiChu}</div> : (!b.tenThuHuong && <span className="text-slate-400">--</span>)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditBank(b)}
                              className="p-1 text-slate-400 hover:text-sky-600 rounded hover:bg-sky-50 transition-colors"
                              title="Sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBank(b.id, b.soTaiKhoan)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                              title="Xóa"
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

          {/* Mobile Card List */}
          <div className="lg:hidden space-y-3">
            {filteredBanks.map((b) => (
              <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-slate-900 text-base">{b.soTaiKhoan}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          b.loaiTien === 'USD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {b.loaiTien || 'USD'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(b.soTaiKhoan, `acc_m_${b.id}`)}
                        className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 mt-0.5"
                      >
                        {copiedKey === `acc_m_${b.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Sao chép STK</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditBank(b)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBank(b.id, b.soTaiKhoan)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400">Ngân hàng: </span>
                    <strong className="text-slate-900 text-sm font-extrabold text-sky-900">{b.tenVietTat || b.tenNganHang}</strong>
                    {b.tenVietTat && (
                      <span className="text-slate-500 block text-[11px] mt-0.5">{b.tenNganHang}</span>
                    )}
                  </div>
                  {b.chiNhanh && (
                    <div>
                      <span className="text-slate-400">Chi nhánh / Address: </span>
                      <span className="text-slate-700">{b.chiNhanh}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400">SWIFT CODE:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded">
                      <span>{b.swiftCode}</span>
                      <button
                        onClick={() => handleCopy(b.swiftCode, `swift_m_${b.id}`)}
                        className="p-0.5 text-sky-700 hover:text-sky-900"
                        title="Copy"
                      >
                        {copiedKey === `swift_m_${b.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  {b.ghiChu && (
                    <div className="pt-1 text-slate-500 italic">
                      {b.ghiChu}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD/EDIT CUSTOMER */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editCustomer ? `Sửa Khách Hàng ${editCustomer.tenKH}` : 'Thêm Đối Tác Khách Hàng Mới'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Khách Hàng *</label>
            <input
              type="text"
              required
              value={maKH}
              onChange={(e) => setMaKH(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              placeholder="VD: KH_SHANGHAI, KH_TOKYO..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Công Ty / Khách Hàng *</label>
            <input
              type="text"
              required
              value={tenKH}
              onChange={(e) => setTenKH(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              placeholder="VD: Shanghai Agrochemical Ltd"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quốc Gia Thị Trường *</label>
            <input
              type="text"
              required
              value={quocGia}
              onChange={(e) => setQuocGia(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              placeholder="China, Philippines, Japan..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Địa Chỉ Chi Tiết (Trụ Sở / Văn Phòng Quốc Tế)</label>
            <textarea
              rows={2}
              value={diaChiChiTiet}
              onChange={(e) => setDiaChiChiTiet(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="VD: No. 128 Jinshajiang Road, Putuo District, Shanghai, China"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                placeholder="contact@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
              <input
                type="tel"
                value={dienThoai}
                onChange={(e) => setDienThoai(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
                placeholder="+86..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {saving ? 'Đang Lưu...' : (editCustomer ? 'Cập Nhật' : 'Lưu Khách Hàng')}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD/EDIT PRODUCT */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editProduct ? `Sửa Mặt Hàng ${editProduct.maHang}` : 'Thêm Mặt Hàng / Bao Bì Mới'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Mặt Hàng *</label>
            <input
              type="text"
              required
              value={maHang}
              onChange={(e) => setMaHang(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              placeholder="VD: VU-50kg, SAN-LAT..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Hàng *</label>
            <input
              type="text"
              required
              value={tenHang}
              onChange={(e) => setTenHang(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              placeholder="Tinh bột sắn xuất khẩu bao 50kg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quy Cách Đóng Gói *</label>
            <input
              type="text"
              required
              value={dongGoi}
              onChange={(e) => setDongGoi(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              placeholder="Bao PP/PE 50kg hoặc Jumbo 850kg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {saving ? 'Đang Lưu...' : 'Lưu Mặt Hàng'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ADD/EDIT PORT */}
      <Modal
        isOpen={isPortModalOpen}
        onClose={() => setIsPortModalOpen(false)}
        title={editPort ? `Sửa Cảng ${editPort.tenCang}` : 'Thêm Cảng Biển Mới'}
        maxWidth="md"
      >
        <form onSubmit={handleSavePort} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Cảng *</label>
            <input
              type="text"
              required
              value={maCang}
              onChange={(e) => setMaCang(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[44px]"
              placeholder="VN_SGN, CN_SHA..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Cảng Biển *</label>
            <input
              type="text"
              required
              value={tenCang}
              onChange={(e) => setTenCang(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[44px]"
              placeholder="Cảng Cát Lái, Shanghai Port..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phân Loại Cảng *</label>
            <select
              value={phanLoaiPort}
              onChange={(e) => setPhanLoaiPort(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[44px] bg-white"
            >
              <option value="Cang_Boc">Cảng Bốc Hàng Xuất (Tại Việt Nam)</option>
              <option value="Cang_Do">Cảng Dỡ Hàng Đích (Nước Ngoài)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quốc Gia</label>
            <input
              type="text"
              value={quocGiaPort}
              onChange={(e) => setQuocGiaPort(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[44px]"
              placeholder="Vietnam, China..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPortModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {saving ? 'Đang Lưu...' : 'Lưu Cảng Biển'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: ADD/EDIT COST CATEGORY */}
      <Modal
        isOpen={isCostCatModalOpen}
        onClose={() => setIsCostCatModalOpen(false)}
        title={editCostCat ? `Sửa Khoản Mục ${editCostCat.khoanMuc}` : 'Thêm Khoản Mục Chi Phí'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCostCat} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Khoản Mục Phí *</label>
            <input
              type="text"
              required
              value={khoanMuc}
              onChange={(e) => setKhoanMuc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
              placeholder="Cước tàu biển, Phí kiểm dịch, Bốc vác..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Đối Tác / Nhà Cung Cấp Thường Dùng *</label>
            <input
              type="text"
              required
              value={doiTacMacDinh}
              onChange={(e) => setDoiTacMacDinh(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
              placeholder="ONE Line, Vận tải Long Phước..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phân Nhóm Dịch Vụ</label>
            <input
              type="text"
              value={loaiDichVu}
              onChange={(e) => setLoaiDichVu(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[44px]"
              placeholder="Ocean Freight, Inland Transport, Handling..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCostCatModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {saving ? 'Đang Lưu...' : 'Lưu Khoản Mục'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: ADD/EDIT BANK ACCOUNT */}
      <Modal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        title={editBank ? `Sửa Tài Khoản Ngân Hàng ${editBank.soTaiKhoan}` : 'Thêm Ngân Hàng Nhận Tiền Mới'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveBank} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Viết Tắt (Gọn) *</label>
              <input
                type="text"
                required
                value={tenVietTat}
                onChange={(e) => setTenVietTat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-sky-900 focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                placeholder="VD: Vietcombank, MB Bank, Vietinbank..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Tài Khoản (Account No.) *</label>
              <input
                type="text"
                required
                value={soTaiKhoan}
                onChange={(e) => setSoTaiKhoan(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                placeholder="VD: 0701370421166"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Tiền Tệ *</label>
              <select
                value={loaiTienBank}
                onChange={(e) => setLoaiTienBank(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              >
                <option value="USD">USD (Đô la Mỹ)</option>
                <option value="VND">VND (Việt Nam Đồng)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="CNY">CNY (Nhân dân tệ)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Tên Ngân Hàng (Bank Name / Address) *</label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>Gợi ý:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTenVietTat('Vietcombank');
                    setTenNganHang('JOINT STOCK COMMERCIAL BANK FOR FOREIGN TRADE OF VIETNAM');
                    setChiNhanh('VIETNAM (Head Office)');
                    setSwiftCode('BFTVVNVX070');
                  }}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  VCB
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTenVietTat('MB Bank');
                    setTenNganHang('MILITARY COMMERCIAL JOINT STOCK BANK (MBBANK)');
                    setChiNhanh('TAY NINH BRANCH');
                    setSwiftCode('MSCBVNVX');
                  }}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  MB
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTenVietTat('Vietinbank');
                    setTenNganHang('VIETNAM JOINT STOCK COMMERCIAL BANK FOR INDUSTRY AND TRADE (VIETINBANK)');
                    setChiNhanh('TAY NINH BRANCH');
                    setSwiftCode('ICBVVNVX660');
                  }}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Vietinbank
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              value={tenNganHang}
              onChange={(e) => setTenNganHang(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              placeholder="VD: JOINT STOCK COMMERCIAL BANK FOR FOREIGN TRADE OF VIETNAM"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chi Nhánh / Địa Chỉ (Branch / Address)</label>
              <input
                type="text"
                value={chiNhanh}
                onChange={(e) => setChiNhanh(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                placeholder="VD: TAY NINH BRANCH hoặc VIETNAM"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SWIFT CODE *</label>
              <input
                type="text"
                required
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
                placeholder="VD: BFTVVNVX070, MSCBVNVX..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Đơn Vị Thụ Hưởng (Beneficiary Name)</label>
            <input
              type="text"
              value={tenThuHuong}
              onChange={(e) => setTenThuHuong(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              placeholder="Tên công ty xuất khẩu thụ hưởng (nếu có)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi Chú</label>
            <input
              type="text"
              value={ghiChuBank}
              onChange={(e) => setGhiChuBank(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[44px]"
              placeholder="Ghi chú mục đích dùng tài khoản..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBankModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {saving ? 'Đang Lưu...' : (editBank ? 'Cập Nhật Tài Khoản' : 'Lưu Tài Khoản')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
