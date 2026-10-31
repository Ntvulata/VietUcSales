export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export type IncotermRule = 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'FCA' | 'DAP' | 'OTHER';

export interface ContractDestinationPort {
  id?: string;                    // Tùy chọn ID định danh dòng
  cangDen: string;                // Tên cảng đến (vd: "Shanghai (SHA)", "Qingdao (TAO)")
  sanLuongMT: number;             // Sản lượng giao đến cảng này (MT)
  soLuongCont?: number;           // Số lượng container cho cảng này
  loaiCont?: string;              // Loại cont: '20ft', '40HC', '40GP' (Mặc định '20ft')
  ghiChu?: string;                // Ghi chú cho cảng này
}

export interface Contract {
  id: string;                     // ID doc Firestore (vd: "HD-2026-X01")
  soHD: string;                   // Số Hợp Đồng (Khóa định danh, không trùng)
  ngayKy: string;                 // Ngày ký YYYY-MM-DD
  maKH: string;                   // Mã khách hàng (FK -> master_customers)
  tenKH: string;                  // Tên khách hàng (denormalized)
  maHang: string;                 // Mã hàng (VU-50kg, VU-850kg...)
  quyCachDongGoi: string;         // Bao PP 50kg, Jumbo bag 850kg...
  sanLuongKy: number;             // Sản lượng ký (MT - tấn)
  dungSaiPercent: number;         // Dung sai (+/- %) mặc định 5%
  donGiaUSD: number;              // Đơn giá xuất khẩu (USD/MT)
  tongGiaTriUSD: number;          // Thành tiền: sanLuongKy * donGiaUSD
  dieuKienIncoterms?: IncotermRule; // Điều kiện Incoterms 2020: FOB, CIF, CFR, EXW...
  cangXepHang?: string;           // Cảng bốc hàng / Cảng xếp (Port of Loading - quan trọng cho FOB: vd Cát Lái, Cái Mép)
  danhSachCangDen?: ContractDestinationPort[]; // Cho phép 1 hợp đồng có nhiều cảng đến (bắt buộc cho CIF/CFR, tuỳ chọn cho FOB)
  cangDen?: string;               // Chuỗi tóm tắt cảng đến (backward-compatible)
  hinhThucTT: string;             // L/C, T/T 30 - 70, T/T 100% trước...
  nganHangLC?: string;            // Ngân hàng tiếp nhận L/C (Vietcombank, MB...)
  soLC?: string;                  // Số L/C đã mở (L/C Number)
  hanGiaoHangCuoi: string;        // Hạn giao hàng chót (YYYY-MM-DD)
  trangThaiHD: ContractStatus;    // Trạng thái hợp đồng
  ghiChu?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}
