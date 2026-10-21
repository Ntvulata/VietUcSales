export type ShipmentStatus = 
  | 'DANG_DONG_HANG' 
  | 'DA_LEN_TAU' 
  | 'DA_THONG_QUAN' 
  | 'DA_DEN_CANG' 
  | 'HOAN_TAT';

export interface Shipment {
  id: string;                     // ID doc (vd: "XUAT-01A")
  maDotXuat: string;              // Mã Lô/Đợt xuất
  soHD: string;                   // Số HĐ liên kết (FK)
  soBLBooking: string;            // Số B/L / Booking hãng tàu
  soToKhaiHaiQuan: string;        // Số tờ khai hải quan
  sanLuongThucXuat: number;       // Sản lượng thực xuất (MT)
  soLuongCont: number;            // Số cont
  loaiCont: string;               // 40HC, 20ft...
  cangDi: string;                 // Cảng bốc (vd: Cát Lái - SGN)
  cangDen: string;                // Cảng dỡ (vd: Shanghai - SHA)
  tenTauChuyen: string;           // Tên tàu / Số chuyến
  hangTau: string;                // Hãng tàu (ONE Line, COSCO...)
  ngayDongHangTu?: string;        // Ngày bắt đầu đóng hàng tại kho (YYYY-MM-DD)
  ngayDongHangDen?: string;       // Ngày kết thúc đóng hàng tại kho (YYYY-MM-DD)
  ngayTauChayATD: string;         // Ngày tàu chạy thực tế (ATD)
  ngayDenETA: string;             // Ngày dự kiến cập cảng (ETA)
  tyGiaThucTe: number;            // Tỷ giá thực tế (USD/VND)
  trangThaiLoHang: ShipmentStatus;
  ghiChu?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}
