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
  loiNhuanGopVND: number;             // Doanh thu - Tổng chi phí xuất khẩu
  tySuatLoiNhuanPercent: number;      // Lợi nhuận / Doanh thu VND (%)
}
