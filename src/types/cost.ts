export type CostGroup = 'LOGISTICS' | 'BOC_XEP' | 'MOI_GIOI' | 'NGAN_HANG' | 'KHAC';
export type LogisticsPlan = 'ALL_IN' | 'XE_LE'; // All-in (1 NCC) hoặc Xé lẻ (nhiều NCC)
export type CostPaymentStatus = 'CHUA_THANH_TOAN' | 'DA_THANH_TOAN';
export type CurrencyType = 'USD' | 'VND';

// Danh mục chuẩn cho nhóm Chi phí Logistics phát sinh theo lô
export const LOGISTICS_STANDARD_ITEMS = [
  'Cước tàu biển (Ocean Freight)',
  'Trucking nội địa',
  'Nâng hạ cont',
  'Kiểm dịch / C/O',
  'Dịch vụ chứng từ',
] as const;

// Các dòng phí L/C & Ngân hàng thường gặp
export const BANKING_STANDARD_ITEMS = [
  'Phí mở L/C',
  'Phí thông báo L/C',
  'Phí sửa đổi L/C',
  'Phí chiết khấu chứng từ',
  'Phí kiểm tra bộ chứng từ',
  'Điện phí Swift',
  'Phí thanh toán / Chuyển tiền quốc tế',
  'Phí ngân hàng khác',
] as const;

export interface LogisticsCost {
  id: string;                     // ID doc (vd: "CP-001")
  maCP: string;                   // Mã chi phí
  soHD: string;                   // Số HĐ liên kết
  maDotXuat?: string;             // Mã Lô/Đợt xuất liên kết (Bắt buộc với Logistics, tùy chọn với các phí khác)
  nhomChiPhi: CostGroup;          // Nhóm: LOGISTICS | BOC_XEP | MOI_GIOI | NGAN_HANG | KHAC
  phuongAnLogistics?: LogisticsPlan; // Áp dụng cho nhóm LOGISTICS: ALL_IN hoặc XE_LE
  khoanMucChiPhi: string;         // Tên khoản mục chi phí cụ thể
  hinhThucDichVu?: string;        // Backward compatible (TRON_GOI / TACH_LE)
  nhaCungCap: string;             // Nhà cung cấp / Đơn vị nhận tiền (Hãng tàu, FWD, Nhà xe, Ngân hàng, Người môi giới...)
  soLuongTinhPhi: number;         // Số lượng tính phí (Số cont, Số MT, Số bộ, Số dòng...)
  donViTinh: string;              // Cont, MT, Chuyến, Bộ, Lần, Dòng...
  donGia: number;                 // Đơn giá
  loaiTien: CurrencyType;         // USD hoặc VND
  tyGiaQuyDoi: number;            // 1 nếu VND, hoặc tỷ giá USD/VND
  thanhTienVND: number;           // = soLuongTinhPhi * donGia * tyGiaQuyDoi
  soHoaDonChungTu?: string;       // Số HĐ VAT hoặc mã phiếu chi
  tinhTrangThanhToan: CostPaymentStatus;
  ngayThanhToan?: string;         // Ngày chi trả YYYY-MM-DD
  ghiChu?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}
