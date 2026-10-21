import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../constants/collections';
import type { 
  Contract, 
  Shipment, 
  LogisticsCost, 
  PaymentTransaction, 
  Customer, 
  Product, 
  Port, 
  CostCategory
} from '../../types';
import { INITIAL_BANK_ACCOUNTS } from '../master-data/masterDataService';

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'KH_SHANGHAI', maKH: 'KH_SHANGHAI', tenKH: 'Shanghai Agrochemical Ltd', quocGia: 'China' },
  { id: 'KH_QINGDAO', maKH: 'KH_QINGDAO', tenKH: 'Qingdao Starch Co.', quocGia: 'China' },
  { id: 'KH_MANILA', maKH: 'KH_MANILA', tenKH: 'Manila Food Processing', quocGia: 'Philippines' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'VU-50kg', maHang: 'VU-50kg', tenHang: 'Tinh bột sắn xuất khẩu bao 50kg', dongGoi: 'Bao PP/PE 50kg' },
  { id: 'VU-850kg', maHang: 'VU-850kg', tenHang: 'Tinh bột sắn xuất khẩu bao Jumbo', dongGoi: 'Bao Jumbo 850kg' },
  { id: 'SAN-LAT', maHang: 'SAN-LAT', tenHang: 'Sắn lát sấy khô công nghiệp', dongGoi: 'Đóng hàng rời hoặc bao 50kg' },
];

export const INITIAL_PORTS: Port[] = [
  // Cảng bốc Việt Nam
  { id: 'VN_SGN', maCang: 'VN_SGN', tenCang: 'Cát Lái (TP.HCM)', phanLoai: 'Cang_Boc', quocGia: 'Việt Nam' },
  { id: 'VN_TCIT', maCang: 'VN_TCIT', tenCang: 'Cái Mép (Vũng Tàu)', phanLoai: 'Cang_Boc', quocGia: 'Việt Nam' },
  { id: 'VN_HPH', maCang: 'VN_HPH', tenCang: 'Tân Vũ (Hải Phòng)', phanLoai: 'Cang_Boc', quocGia: 'Việt Nam' },
  { id: 'VN_DAD', maCang: 'VN_DAD', tenCang: 'Đà Nẵng', phanLoai: 'Cang_Boc', quocGia: 'Việt Nam' },
  { id: 'VN_UIH', maCang: 'VN_UIH', tenCang: 'Quy Nhơn', phanLoai: 'Cang_Boc', quocGia: 'Việt Nam' },

  // Cảng dỡ - Trung Quốc
  { id: 'CN_XMN', maCang: 'CN_XMN', tenCang: 'Xiamen (Hạ Môn)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },
  { id: 'CN_TAO', maCang: 'CN_TAO', tenCang: 'Qingdao (Thanh Đảo)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },
  { id: 'CN_SHA', maCang: 'CN_SHA', tenCang: 'Shanghai (Thượng Hải)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },
  { id: 'CN_NGB', maCang: 'CN_NGB', tenCang: 'Ningbo (Ninh Ba)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },
  { id: 'CN_TXG', maCang: 'CN_TXG', tenCang: 'Tianjin (Thiên Tân)', phanLoai: 'Cang_Do', quocGia: 'Trung Quốc' },

  // Cảng dỡ - Hàn Quốc
  { id: 'KR_INC', maCang: 'KR_INC', tenCang: 'Incheon', phanLoai: 'Cang_Do', quocGia: 'Hàn Quốc' },
  { id: 'KR_PUS', maCang: 'KR_PUS', tenCang: 'Busan', phanLoai: 'Cang_Do', quocGia: 'Hàn Quốc' },

  // Cảng dỡ - Khác
  { id: 'PH_MNL', maCang: 'PH_MNL', tenCang: 'Manila', phanLoai: 'Cang_Do', quocGia: 'Philippines' },
  { id: 'TH_BKK', maCang: 'TH_BKK', tenCang: 'Bangkok / Laem Chabang', phanLoai: 'Cang_Do', quocGia: 'Thái Lan' },
  { id: 'ID_JKT', maCang: 'ID_JKT', tenCang: 'Jakarta', phanLoai: 'Cang_Do', quocGia: 'Indonesia' },
];

export const INITIAL_COST_CATEGORIES: CostCategory[] = [
  { id: 'CC_OCEAN', khoanMuc: 'Cước tàu (Ocean Freight)', doiTacMacDinh: 'ONE Line, COSCO, SITC', loaiDichVu: 'Ocean Freight' },
  { id: 'CC_TRUCK', khoanMuc: 'Vận tải bộ (Trucking nội địa)', doiTacMacDinh: 'Vận tải Long Phước, Đạt Minh', loaiDichVu: 'Inland Transport' },
  { id: 'CC_FWD', khoanMuc: 'Hải quan & Kiểm dịch + C/O', doiTacMacDinh: 'Logistics An Khang, Bee Logistics', loaiDichVu: 'Forwarding' },
  { id: 'CC_HANDLING', khoanMuc: 'Phí Bốc Bột & Nâng Hạ', doiTacMacDinh: 'Đội bốc vác Nhà máy, Cảng Cát Lái', loaiDichVu: 'Handling' },
  { id: 'CC_CO', khoanMuc: 'Tiền Cò Bột (Hoa hồng môi giới)', doiTacMacDinh: 'Môi giới nguồn hàng Tây Ninh', loaiDichVu: 'Brokerage' },
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'HD-2026-X01',
    soHD: 'HD-2026-X01',
    ngayKy: '2026-02-10',
    maKH: 'KH_SHANGHAI',
    tenKH: 'Shanghai Agrochemical Ltd',
    maHang: 'VU-50kg',
    quyCachDongGoi: 'Bao PP 50kg',
    sanLuongKy: 1500,
    dungSaiPercent: 5,
    donGiaUSD: 480,
    tongGiaTriUSD: 720000,
    hinhThucTT: 'L/C',
    nganHangLC: 'Vietcombank',
    hanGiaoHangCuoi: '2026-04-15',
    trangThaiHD: 'ACTIVE',
    ghiChu: 'Khách hàng truyền thống, xuất khẩu 2 đợt',
  },
  {
    id: 'HD-2026-X02',
    soHD: 'HD-2026-X02',
    ngayKy: '2026-02-18',
    maKH: 'KH_QINGDAO',
    tenKH: 'Qingdao Starch Co.',
    maHang: 'VU-850kg',
    quyCachDongGoi: 'Jumbo bag 850kg',
    sanLuongKy: 600,
    dungSaiPercent: 5,
    donGiaUSD: 495,
    tongGiaTriUSD: 297000,
    hinhThucTT: 'T/T 30 - 70',
    nganHangLC: 'MB Bank',
    hanGiaoHangCuoi: '2026-03-31',
    trangThaiHD: 'ACTIVE',
    ghiChu: 'Cọc 30% khi ký',
  },
  {
    id: 'HD-2026-X03',
    soHD: 'HD-2026-X03',
    ngayKy: '2026-03-01',
    maKH: 'KH_MANILA',
    tenKH: 'Manila Food Processing',
    maHang: 'VU-50kg',
    quyCachDongGoi: 'Bao PP 50kg',
    sanLuongKy: 300,
    dungSaiPercent: 5,
    donGiaUSD: 510,
    tongGiaTriUSD: 153000,
    hinhThucTT: 'T/T 100% trước khi giao',
    nganHangLC: 'Vietinbank',
    hanGiaoHangCuoi: '2026-04-30',
    trangThaiHD: 'ACTIVE',
    ghiChu: 'Thanh toán trước khi bốc hàng',
  }
];

export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'XUAT-01A',
    maDotXuat: 'XUAT-01A',
    soHD: 'HD-2026-X01',
    soBLBooking: 'ONE-SGN-202601',
    soToKhaiHaiQuan: '105998823410',
    sanLuongThucXuat: 750,
    soLuongCont: 30,
    loaiCont: '40HC',
    cangDi: 'Cát Lái (SGN)',
    cangDen: 'Shanghai (SHA)',
    tenTauChuyen: 'MV PACIFIC V.2601',
    hangTau: 'ONE Line',
    ngayTauChayATD: '2026-03-05',
    ngayDenETA: '2026-03-15',
    tyGiaThucTe: 25450,
    trangThaiLoHang: 'DA_THONG_QUAN',
    ghiChu: 'Xuất đợt 1 (750 MT)',
  },
  {
    id: 'XUAT-01B',
    maDotXuat: 'XUAT-01B',
    soHD: 'HD-2026-X01',
    soBLBooking: 'ONE-SGN-202602',
    soToKhaiHaiQuan: '105998823488',
    sanLuongThucXuat: 750,
    soLuongCont: 30,
    loaiCont: '40HC',
    cangDi: 'Cát Lái (SGN)',
    cangDen: 'Shanghai (SHA)',
    tenTauChuyen: 'MV ASIAN GLORY V.2602',
    hangTau: 'ONE Line',
    ngayTauChayATD: '2026-03-20',
    ngayDenETA: '2026-03-30',
    tyGiaThucTe: 25480,
    trangThaiLoHang: 'DA_LEN_TAU',
    ghiChu: 'Xuất đợt 2 (750 MT) - hoàn tất HĐ',
  },
  {
    id: 'XUAT-02A',
    maDotXuat: 'XUAT-02A',
    soHD: 'HD-2026-X02',
    soBLBooking: 'COS-SGN-889911',
    soToKhaiHaiQuan: '106001122330',
    sanLuongThucXuat: 600,
    soLuongCont: 24,
    loaiCont: '40HC',
    cangDi: 'Cát Lái (SGN)',
    cangDen: 'Qingdao (TAO)',
    tenTauChuyen: 'COSCO ASIA V.112',
    hangTau: 'COSCO',
    ngayTauChayATD: '2026-03-12',
    ngayDenETA: '2026-03-24',
    tyGiaThucTe: 25460,
    trangThaiLoHang: 'DA_THONG_QUAN',
    ghiChu: 'Xuất trọn gói 600 MT',
  }
];

export const INITIAL_COSTS: LogisticsCost[] = [
  {
    id: 'CP-001',
    maCP: 'CP-001',
    maDotXuat: 'XUAT-01A',
    soHD: 'HD-2026-X01',
    nhomChiPhi: 'LOGISTICS',
    phuongAnLogistics: 'XE_LE',
    khoanMucChiPhi: 'Cước tàu biển (Ocean Freight)',
    hinhThucDichVu: 'TACH_LE',
    nhaCungCap: 'ONE Line VN',
    soLuongTinhPhi: 30,
    donViTinh: 'Cont',
    donGia: 450,
    loaiTien: 'USD',
    tyGiaQuyDoi: 25450,
    thanhTienVND: 343575000,
    soHoaDonChungTu: 'INV-ONE-0988',
    tinhTrangThanhToan: 'DA_THANH_TOAN',
    ngayThanhToan: '2026-03-04',
    ghiChu: 'Cước 30 cont 40HC đi Shanghai'
  },
  {
    id: 'CP-002',
    maCP: 'CP-002',
    maDotXuat: 'XUAT-01A',
    soHD: 'HD-2026-X01',
    nhomChiPhi: 'LOGISTICS',
    phuongAnLogistics: 'XE_LE',
    khoanMucChiPhi: 'Dịch vụ chứng từ',
    hinhThucDichVu: 'TACH_LE',
    nhaCungCap: 'ONE Line VN',
    soLuongTinhPhi: 1,
    donViTinh: 'Bộ',
    donGia: 150,
    loaiTien: 'USD',
    tyGiaQuyDoi: 25450,
    thanhTienVND: 3817500,
    soHoaDonChungTu: 'INV-ONE-0989',
    tinhTrangThanhToan: 'DA_THANH_TOAN',
    ngayThanhToan: '2026-03-04',
    ghiChu: 'Bao gồm Seal chì + Telex release'
  },
  {
    id: 'CP-003',
    maCP: 'CP-003',
    maDotXuat: 'XUAT-01A',
    soHD: 'HD-2026-X01',
    nhomChiPhi: 'LOGISTICS',
    phuongAnLogistics: 'XE_LE',
    khoanMucChiPhi: 'Trucking nội địa',
    hinhThucDichVu: 'TACH_LE',
    nhaCungCap: 'Vận tải Long Phước',
    soLuongTinhPhi: 30,
    donViTinh: 'Chuyến',
    donGia: 3500000,
    loaiTien: 'VND',
    tyGiaQuyDoi: 1,
    thanhTienVND: 105000000,
    soHoaDonChungTu: 'HD-LP-0122',
    tinhTrangThanhToan: 'DA_THANH_TOAN',
    ngayThanhToan: '2026-03-10',
    ghiChu: 'Kéo cont từ nhà máy về Cát Lái'
  },
  {
    id: 'CP-007',
    maCP: 'CP-007',
    maDotXuat: 'XUAT-01A',
    soHD: 'HD-2026-X01',
    nhomChiPhi: 'BOC_XEP',
    khoanMucChiPhi: 'Phí bốc xếp hàng lên cont / kho',
    hinhThucDichVu: 'TACH_LE',
    nhaCungCap: 'Đội bốc vác Nhà máy',
    soLuongTinhPhi: 750,
    donViTinh: 'MT',
    donGia: 35000,
    loaiTien: 'VND',
    tyGiaQuyDoi: 1,
    thanhTienVND: 26250000,
    soHoaDonChungTu: 'PC-BV-0301',
    tinhTrangThanhToan: 'DA_THANH_TOAN',
    ngayThanhToan: '2026-03-05',
    ghiChu: 'Bốc bao lên cont 50kg'
  },
  {
    id: 'CP-008',
    maCP: 'CP-008',
    maDotXuat: 'XUAT-01A',
    soHD: 'HD-2026-X01',
    nhomChiPhi: 'MOI_GIOI',
    khoanMucChiPhi: 'Tiền cò bột (Hoa hồng môi giới)',
    hinhThucDichVu: 'TACH_LE',
    nhaCungCap: 'Anh Ba Cò Bột Tây Ninh',
    soLuongTinhPhi: 750,
    donViTinh: 'MT',
    donGia: 50000,
    loaiTien: 'VND',
    tyGiaQuyDoi: 1,
    thanhTienVND: 37500000,
    soHoaDonChungTu: 'PC-CO-0302',
    tinhTrangThanhToan: 'DA_THANH_TOAN',
    ngayThanhToan: '2026-03-06',
    ghiChu: 'Hoa hồng môi giới nguồn bột'
  },
  {
    id: 'CP-009',
    maCP: 'CP-009',
    soHD: 'HD-2026-X01',
    nhomChiPhi: 'NGAN_HANG',
    khoanMucChiPhi: 'Phí mở & chiết khấu L/C',
    hinhThucDichVu: 'TACH_LE',
    nhaCungCap: 'Vietcombank',
    soLuongTinhPhi: 1,
    donViTinh: 'Nguyên Lô',
    donGia: 12500000,
    loaiTien: 'VND',
    tyGiaQuyDoi: 1,
    thanhTienVND: 12500000,
    soHoaDonChungTu: 'SBN-VCB-98',
    tinhTrangThanhToan: 'DA_THANH_TOAN',
    ngayThanhToan: '2026-03-08',
    ghiChu: 'Phí chiết khấu & điện Swift trình bank'
  },
  {
    id: 'CP-010',
    maCP: 'CP-010',
    maDotXuat: 'XUAT-02A',
    soHD: 'HD-2026-X02',
    nhomChiPhi: 'LOGISTICS',
    phuongAnLogistics: 'ALL_IN',
    khoanMucChiPhi: 'Logistics All-in (Trọn gói: cước tàu, xe, nâng hạ, kiểm dịch, chứng từ)',
    hinhThucDichVu: 'TRON_GOI',
    nhaCungCap: 'Bee Logistics Corp',
    soLuongTinhPhi: 24,
    donViTinh: 'Cont',
    donGia: 22000000,
    loaiTien: 'VND',
    tyGiaQuyDoi: 1,
    thanhTienVND: 528000000,
    soHoaDonChungTu: 'INV-BEE-552',
    tinhTrangThanhToan: 'CHUA_THANH_TOAN',
    ghiChu: 'Bao gồm xe, nâng hạ, hải quan, kiểm dịch'
  }
];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'TT-001',
    maGiaoDich: 'TT-001',
    soHD: 'HD-2026-X01',
    maDotXuat: 'XUAT-01A',
    khachHang: 'Shanghai Agrochemical Ltd',
    dotThanhToan: 'Thanh toán L/C Đợt 1',
    hinhThuc: 'L/C',
    soTienUSD: 360000,
    tyGiaThucNhan: 25450,
    thanhTienVND: 9162000000,
    ngayTienVe: '2026-03-12',
    nganHangNhan: 'Vietcombank',
    maDienMT103: 'VCB-MT103-8821',
    ghiChu: 'Tiền đợt xuất 1 (750 MT)',
  },
  {
    id: 'TT-002',
    maGiaoDich: 'TT-002',
    soHD: 'HD-2026-X02',
    khachHang: 'Qingdao Starch Co.',
    dotThanhToan: 'Đặt cọc 30% HĐ',
    hinhThuc: 'T/T',
    soTienUSD: 89100,
    tyGiaThucNhan: 25460,
    thanhTienVND: 2268486000,
    ngayTienVe: '2026-02-20',
    nganHangNhan: 'MB Bank',
    maDienMT103: 'MB-TT-998231',
    ghiChu: 'Cọc khi ký hợp đồng',
  }
];

export async function seedExcelDataToFirestore(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Customers
    for (const item of INITIAL_CUSTOMERS) {
      await setDoc(doc(db, COLLECTIONS.CUSTOMERS, item.id), item, { merge: true });
    }
    // 2. Products
    for (const item of INITIAL_PRODUCTS) {
      await setDoc(doc(db, COLLECTIONS.PRODUCTS, item.id), item, { merge: true });
    }
    // 3. Ports
    for (const item of INITIAL_PORTS) {
      await setDoc(doc(db, COLLECTIONS.PORTS, item.id), item, { merge: true });
    }
    // 4. Cost Categories
    for (const item of INITIAL_COST_CATEGORIES) {
      await setDoc(doc(db, COLLECTIONS.COST_CATEGORIES, item.id), item, { merge: true });
    }
    // 5. Contracts
    for (const item of INITIAL_CONTRACTS) {
      await setDoc(doc(db, COLLECTIONS.CONTRACTS, item.id), item, { merge: true });
    }
    // 6. Shipments
    for (const item of INITIAL_SHIPMENTS) {
      await setDoc(doc(db, COLLECTIONS.SHIPMENTS, item.id), item, { merge: true });
    }
    // 7. Costs
    for (const item of INITIAL_COSTS) {
      await setDoc(doc(db, COLLECTIONS.LOGISTICS_COSTS, item.id), item, { merge: true });
    }
    // 8. Payments
    for (const item of INITIAL_PAYMENTS) {
      await setDoc(doc(db, COLLECTIONS.PAYMENTS, item.id), item, { merge: true });
    }
    // 9. Bank Accounts
    for (const item of INITIAL_BANK_ACCOUNTS) {
      await setDoc(doc(db, COLLECTIONS.BANK_ACCOUNTS, item.id), item, { merge: true });
    }

    return { success: true, message: 'Đã nạp toàn bộ các bảng dữ liệu mẫu từ Excel vào Firebase Firestore thành công!' };
  } catch (error: any) {
    console.error('Error seeding data to Firestore:', error);
    return { success: false, message: `Lỗi nạp dữ liệu: ${error?.message || error}` };
  }
}
