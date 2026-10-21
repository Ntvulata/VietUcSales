export interface PaymentTransaction {
  id: string;                     // ID doc (vd: "TT-001")
  maGiaoDich: string;             // Mã giao dịch tiền về
  soHD: string;                   // Số HĐ liên kết
  maDotXuat?: string;             // Mã Lô/Đợt xuất (nếu có)
  khachHang: string;              // Tên khách hàng
  dotThanhToan: string;           // Cọc 30%, Thanh toán L/C Đợt 1...
  hinhThuc: string;               // L/C, T/T...
  soTienUSD: number;              // Số tiền USD khách chuyển
  tyGiaThucNhan: number;          // Tỷ giá quy đổi thực tế của ngân hàng
  thanhTienVND: number;           // = soTienUSD * tyGiaThucNhan
  ngayTienVe: string;             // Ngày tiền thực tế vào tài khoản
  nganHangNhan: string;           // Vietcombank, MB Bank, Vietinbank...
  maDienMT103?: string;           // Số điện MT103 / Mã giao dịch ngân hàng
  ghiChu?: string;
  createdAt?: string | number;
}
