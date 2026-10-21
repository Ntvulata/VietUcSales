import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit2, Trash2, Calendar, Package, Anchor, FileText } from 'lucide-react';
import { subscribeToContracts, removeContract, updateContractStatus } from './contractsService';
import { subscribeToCustomers, subscribeToProducts, subscribeToPorts } from '../master-data/masterDataService';
import { ContractFormModal } from './ContractFormModal';
import { formatUSD, formatNumber, formatDateVN, formatShortBankName } from '../../utils/formatters';
import type { Contract, Customer, Product, Port, ContractStatus } from '../../types';

export const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editContract, setEditContract] = useState<Contract | null>(null);

  useEffect(() => {
    const unsubContracts = subscribeToContracts(setContracts);
    const unsubCustomers = subscribeToCustomers(setCustomers);
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubPorts = subscribeToPorts(setPorts);

    return () => {
      if (unsubContracts) unsubContracts();
      if (unsubCustomers) unsubCustomers();
      if (unsubProducts) unsubProducts();
      if (unsubPorts) unsubPorts();
    };
  }, []);

  const filteredContracts = contracts.filter((c) => {
    const matchSearch =
      c.soHD.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.soLC && c.soLC.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.tenKH.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.maHang && c.maHang.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'ALL' || c.trangThaiHD === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (c: Contract, newStatus: ContractStatus) => {
    try {
      await updateContractStatus(c.id, newStatus);
      if (newStatus === 'PAID') {
        navigate(`/payments?create=true&soHD=${encodeURIComponent(c.soHD)}`);
      }
    } catch (err: any) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  };

  const handleEdit = (c: Contract) => {
    setEditContract(c);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditContract(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, soHD: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hợp đồng ${soHD}?`)) {
      await removeContract(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo số HĐ, số L/C, khách hàng, mặt hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái hợp đồng"
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang thực hiện</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 min-h-[44px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Hợp Đồng</span>
        </button>
      </div>

      {/* Contract Count Badge */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Tổng cộng: <strong className="text-slate-800">{filteredContracts.length}</strong> hợp đồng</span>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3">Số HĐ</th>
                <th className="py-2.5 px-3">Số L/C</th>
                <th className="py-2.5 px-3">Ngày Ký</th>
                <th className="py-2.5 px-3">Hạn Giao Hàng</th>
                <th className="py-2.5 px-3 min-w-[260px]">Khách Hàng</th>
                <th className="py-2.5 px-3">Mặt Hàng</th>
                <th className="py-2.5 px-3">Cảng Đến</th>
                <th className="py-2.5 px-3 text-right">Sản Lượng (MT)</th>
                <th className="py-2.5 px-3 text-right">Đơn Giá ($)</th>
                <th className="py-2.5 px-3 text-right">Tổng Trị Giá ($)</th>
                <th className="py-2.5 px-3">Hình Thức TT</th>
                <th className="py-2.5 px-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12.5px] leading-snug">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-6 text-center text-slate-400 text-xs">
                    Không tìm thấy hợp đồng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 whitespace-nowrap">
                      <select
                        value={c.trangThaiHD}
                        onChange={(e) => handleStatusChange(c, e.target.value as ContractStatus)}
                        aria-label={`Đổi trạng thái HĐ ${c.soHD}`}
                        title="Nhấp để đổi nhanh trạng thái"
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border cursor-pointer focus:outline-none transition-all ${
                          c.trangThaiHD === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : c.trangThaiHD === 'PAID'
                            ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100'
                            : c.trangThaiHD === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                            : c.trangThaiHD === 'DRAFT'
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        <option value="ACTIVE">Đang thực hiện</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="COMPLETED">Hoàn tất</option>
                        <option value="DRAFT">Bản nháp</option>
                        <option value="CANCELLED">Đã hủy</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">{c.soHD}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {c.soLC ? (
                        <span className="font-mono font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-[11px]" title={`Số L/C: ${c.soLC}`}>
                          {c.soLC}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap text-[12px]">{formatDateVN(c.ngayKy)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {c.hanGiaoHangCuoi ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200/70">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          {formatDateVN(c.hanGiaoHangCuoi)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 min-w-[260px]">
                      <div className="font-semibold text-slate-800 text-[12.5px]">{c.tenKH}</div>
                      <span className="text-[10.5px] text-slate-400 block">{c.maKH}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 text-slate-700 text-[11px] font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                        <Package className="w-2.5 h-2.5 text-slate-500" />
                        {c.maHang}
                      </span>
                      <p className="text-[10.5px] text-slate-400 truncate max-w-[140px]">{c.quyCachDongGoi}</p>
                    </td>
                    <td className="py-2 px-3">
                      {c.danhSachCangDen && c.danhSachCangDen.length > 0 ? (
                        <div className="flex flex-col gap-0.5 min-w-[150px] max-w-[220px]">
                          {c.danhSachCangDen.map((p, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded"
                            >
                              <span className="font-medium text-slate-700 truncate mr-1" title={p.cangDen}>
                                {p.cangDen}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="font-bold text-emerald-700 whitespace-nowrap">
                                  {formatNumber(p.sanLuongMT)} MT
                                </span>
                                {p.soLuongCont ? (
                                  <span className="text-[9.5px] text-slate-500 font-medium whitespace-nowrap bg-white px-1 rounded border border-slate-200">
                                    {p.soLuongCont}c
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-medium text-[11.5px]">
                          {c.cangDen || '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-800 whitespace-nowrap">
                      {formatNumber(c.sanLuongKy)} <span className="text-[10.5px] text-slate-400">(±{c.dungSaiPercent}%)</span>
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">${c.donGiaUSD}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {formatUSD(c.tongGiaTriUSD)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-[11.5px] font-medium text-slate-700">{c.hinhThucTT}</span>
                      {c.nganHangLC && (
                        <p className="text-[10.5px] font-bold text-sky-700" title={c.nganHangLC}>
                          {formatShortBankName(c.nganHangLC)}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/reports?soHD=${c.soHD}`)}
                          className="p-1 text-slate-500 hover:text-sky-600 rounded hover:bg-sky-50 transition-colors"
                          title="Xem báo cáo chi tiết hợp đồng"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1 text-slate-500 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                          title="Sửa hợp đồng"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.soHD)}
                          className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Xóa hợp đồng"
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

      {/* MOBILE CARD LIST VIEW */}
      <div className="lg:hidden space-y-3">
        {filteredContracts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            Không tìm thấy hợp đồng nào.
          </div>
        ) : (
          filteredContracts.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hợp Đồng</span>
                  <h3 className="text-base font-bold text-slate-900">{c.soHD}</h3>
                </div>
                <select
                  value={c.trangThaiHD}
                  onChange={(e) => handleStatusChange(c, e.target.value as ContractStatus)}
                  aria-label={`Đổi trạng thái HĐ ${c.soHD}`}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none transition-all ${
                    c.trangThaiHD === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : c.trangThaiHD === 'PAID'
                      ? 'bg-teal-50 text-teal-800 border-teal-300'
                      : c.trangThaiHD === 'COMPLETED'
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : c.trangThaiHD === 'DRAFT'
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  <option value="ACTIVE">Đang thực hiện</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="COMPLETED">Hoàn tất</option>
                  <option value="DRAFT">Bản nháp</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">{c.tenKH}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Calendar className="w-3.5 h-3.5" />
                    Ký: {formatDateVN(c.ngayKy)}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200/60">
                    <Calendar className="w-3 h-3 text-amber-600" />
                    Hạn giao: {formatDateVN(c.hanGiaoHangCuoi)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Mặt hàng:</span>
                  <p className="font-semibold text-slate-700">{c.maHang} ({c.quyCachDongGoi})</p>
                </div>
                <div>
                  <span className="text-slate-400">Khối lượng:</span>
                  <p className="font-semibold text-slate-700">{formatNumber(c.sanLuongKy)} MT (±{c.dungSaiPercent}%)</p>
                </div>
                <div>
                  <span className="text-slate-400">Đơn giá:</span>
                  <p className="font-semibold text-slate-700">${c.donGiaUSD} / MT</p>
                </div>
                <div>
                  <span className="text-slate-400">Thanh toán:</span>
                  <p className="font-semibold text-slate-700">
                    {c.hinhThucTT} {c.nganHangLC ? `• ${formatShortBankName(c.nganHangLC)}` : ''}
                  </p>
                </div>
                {c.soLC && (
                  <div className="col-span-2 flex items-center justify-between bg-sky-50/80 px-2 py-1 rounded-md border border-sky-200/60">
                    <span className="text-slate-500 font-medium">Số L/C Đã Mở:</span>
                    <span className="font-mono font-bold text-sky-800 text-[12px]">{c.soLC}</span>
                  </div>
                )}
              </div>

              {/* Destination ports info */}
              {((c.danhSachCangDen && c.danhSachCangDen.length > 0) || c.cangDen) && (
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Anchor className="w-3.5 h-3.5 text-blue-500" />
                      <span>Cảng Đến:</span>
                    </span>
                    {c.danhSachCangDen && c.danhSachCangDen.length > 1 && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {c.danhSachCangDen.length} cảng
                      </span>
                    )}
                  </div>
                  {c.danhSachCangDen && c.danhSachCangDen.length > 0 ? (
                    <div className="space-y-1">
                      {c.danhSachCangDen.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 text-xs"
                        >
                          <span className="font-medium text-slate-700 truncate mr-2">{p.cangDen}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-emerald-600 whitespace-nowrap">
                              {formatNumber(p.sanLuongMT)} MT
                            </span>
                            {p.soLuongCont ? (
                              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">
                                {p.soLuongCont} cont {p.loaiCont || '20ft'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                      {c.cangDen}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400">Tổng Trị Giá</span>
                  <p className="text-base font-extrabold text-emerald-600">{formatUSD(c.tongGiaTriUSD)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/reports?soHD=${c.soHD}`)}
                    className="px-3 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 min-h-[44px]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Báo Cáo</span>
                  </button>
                  <button
                    onClick={() => handleEdit(c)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.soHD)}
                    className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contract Form Modal */}
      <ContractFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editContract={editContract}
        customers={customers}
        products={products}
        ports={ports}
      />
    </div>
  );
};
