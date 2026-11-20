export interface PnLSummary {
  soHD: string;
  khachHang: string;
  sanLuongMT: number;
  doanhThuUSD: number;
  doanhThuVND: number;
  tongChiPhiLogisticsVND: number;     // Cước tàu + Trucking + Nâng hạ + Kiểm dịch/C/O + Chứng từ (All-in & Xé lẻ)
  tongChiPhiBocXepVND: number;        // Phí bốc xếp riêng
  tongChiPhiMoiGioiVND: number;       // Phí môi giới riêng
  tongChiPhiNganHangVND: number;      // Phí L/C và các dòng phí ngân hàng khác
  tongChiPhiKhacVND: number;          // Chi phí khác phát sinh
  tongChiPhiXuatKhauVND: number;      // Tổng 5 nhóm chi phí dịch vụ/logistics xuất khẩu
  chiPhiDaThanhToanVND: number;       // Chi phí thực tế đã thanh toán
  chiPhiChuaThanhToanVND: number;     // Chi phí được kê chưa thanh toán (tạm tính)
  giaTaiKhoTamTinhVND: number;        // Doanh thu - Tổng chi phí kê (gồm chưa thanh toán)
  giaTaiKhoThucTeVND: number;         // Doanh thu - Chi phí đã thanh toán
  donGiaTaiKhoTamTinhVND: number;     // Giá tại kho tạm tính / MT
  donGiaTaiKhoThucTeVND: number;      // Giá tại kho thực tế / MT
  loiNhuanGopVND: number;             // = giaTaiKhoTamTinhVND
  tySuatLoiNhuanPercent: number;      // Tỷ suất LN tạm tính (%)
  tySuatLoiNhuanThucTePercent: number;// Tỷ suất LN thực tế (%)
}
