export interface Customer {
  id: string;
  maKH: string;
  tenKH: string;
  quocGia: string;
  diaChiChiTiet?: string; // Địa chỉ chi tiết trụ sở / văn phòng quốc tế
  email?: string;
  dienThoai?: string;
}

export interface Product {
  id: string;
  maHang: string;
  tenHang: string;
  dongGoi: string;
}

export interface Port {
  id: string;
  maCang: string;
  tenCang: string;
  phanLoai: 'Cang_Boc' | 'Cang_Do';
  quocGia?: string;
}

export interface CostCategory {
  id: string;
  khoanMuc: string;
  doiTacMacDinh: string;
  loaiDichVu: string;
}

export interface BankAccount {
  id: string;
  soTaiKhoan: string;           // Số tài khoản (Account no.)
  tenVietTat?: string;          // Tên viết tắt ngắn gọn (Vietcombank, MB Bank, Vietinbank...)
  tenNganHang: string;          // Tên ngân hàng đầy đủ / Tên quốc tế
  chiNhanh?: string;            // Chi nhánh / Địa chỉ (Branch / Address)
  swiftCode: string;            // SWIFT CODE
  loaiTien: string;             // Loại tiền tệ (USD, VND,...)
  tenThuHuong?: string;         // Tên đơn vị thụ hưởng (Tên công ty)
  ghiChu?: string;              // Ghi chú thêm
}
