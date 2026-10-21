import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../constants/collections';
import type { Customer, Product, Port, CostCategory, BankAccount } from '../../types';
import { removeUndefined } from '../../utils/firestore';

const safeDocId = (id: string) => id.trim().replace(/[\/\\]/g, '_');

// Customers
export const subscribeToCustomers = (callback: (customers: Customer[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.CUSTOMERS), (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as Customer)));
  });
};

export const saveCustomer = async (cust: Customer) => {
  const rawId = cust.maKH || cust.id;
  const docId = safeDocId(rawId);
  await setDoc(doc(db, COLLECTIONS.CUSTOMERS, docId), removeUndefined({ ...cust, id: docId }), { merge: true });
};

export const removeCustomer = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, safeDocId(id)));
};

// Products
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.PRODUCTS), (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as Product)));
  });
};

export const saveProduct = async (product: Product) => {
  const rawId = product.maHang || product.id;
  const docId = safeDocId(rawId);
  await setDoc(doc(db, COLLECTIONS.PRODUCTS, docId), removeUndefined({ ...product, id: docId }), { merge: true });
};

export const removeProduct = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, safeDocId(id)));
};

// Ports
export const subscribeToPorts = (callback: (ports: Port[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.PORTS), (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as Port)));
  });
};

export const savePort = async (port: Port) => {
  const rawId = port.maCang || port.id;
  const docId = safeDocId(rawId);
  await setDoc(doc(db, COLLECTIONS.PORTS, docId), removeUndefined({ ...port, id: docId }), { merge: true });
};

export const removePort = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.PORTS, safeDocId(id)));
};

// Cost Categories
export const subscribeToCostCategories = (callback: (cats: CostCategory[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.COST_CATEGORIES), (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as CostCategory)));
  });
};

export const saveCostCategory = async (cat: CostCategory) => {
  const rawId = cat.id || cat.khoanMuc || `CC_${Date.now()}`;
  const docId = safeDocId(rawId);
  await setDoc(doc(db, COLLECTIONS.COST_CATEGORIES, docId), removeUndefined({ ...cat, id: docId }), { merge: true });
};

export const removeCostCategory = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.COST_CATEGORIES, safeDocId(id)));
};

// Helper to infer or format short bank name
export const getShortBankName = (b: Partial<BankAccount>): string => {
  if (b.tenVietTat && b.tenVietTat.trim()) return b.tenVietTat.trim();
  const full = (b.tenNganHang || '').toUpperCase();
  const swift = (b.swiftCode || '').toUpperCase();
  if (full.includes('FOREIGN TRADE') || full.includes('VIETCOMBANK') || swift.includes('BFTV')) return 'Vietcombank';
  if (full.includes('MILITARY') || full.includes('MBBANK') || full.includes('MB BANK') || swift.includes('MSCB')) return 'MB Bank';
  if (full.includes('INDUSTRY AND TRADE') || full.includes('VIETINBANK') || swift.includes('ICBV')) return 'Vietinbank';
  return b.tenNganHang || 'Ngân Hàng';
};

// 3 Default Beneficiary Bank Accounts requested by user
export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'BANK_VCB_0701370421166',
    soTaiKhoan: '0701370421166',
    tenVietTat: 'Vietcombank',
    tenNganHang: 'JOINT STOCK COMMERCIAL BANK FOR FOREIGN TRADE OF VIETNAM',
    chiNhanh: 'VIETNAM (Head Office)',
    swiftCode: 'BFTVVNVX070',
    loaiTien: 'USD',
    ghiChu: 'Tài khoản USD xuất khẩu Vietcombank'
  },
  {
    id: 'BANK_MB_8710485667197',
    soTaiKhoan: '8710485667197',
    tenVietTat: 'MB Bank',
    tenNganHang: 'MILITARY COMMERCIAL JOINT STOCK BANK (MBBANK)',
    chiNhanh: 'TAY NINH BRANCH',
    swiftCode: 'MSCBVNVX',
    loaiTien: 'USD',
    ghiChu: 'Tài khoản USD MBBank Chi nhánh Tây Ninh'
  },
  {
    id: 'BANK_CTG_112000198901',
    soTaiKhoan: '112000198901',
    tenVietTat: 'Vietinbank',
    tenNganHang: 'VIETNAM JOINT STOCK COMMERCIAL BANK FOR INDUSTRY AND TRADE (VIETINBANK)',
    chiNhanh: 'TAY NINH BRANCH',
    swiftCode: 'ICBVVNVX660',
    loaiTien: 'USD',
    ghiChu: 'Tài khoản USD Vietinbank Chi nhánh Tây Ninh'
  }
];

// Bank Accounts
export const subscribeToBankAccounts = (callback: (accounts: BankAccount[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.BANK_ACCOUNTS), async (snap) => {
    if (snap.empty) {
      // Auto-populate 3 default bank accounts if empty so user has them right away
      for (const item of INITIAL_BANK_ACCOUNTS) {
        await setDoc(doc(db, COLLECTIONS.BANK_ACCOUNTS, item.id), item, { merge: true });
      }
      callback(INITIAL_BANK_ACCOUNTS);
      return;
    }
    const list = snap.docs.map(d => {
      const data = d.data() as BankAccount;
      const shortName = data.tenVietTat || getShortBankName(data);
      if (!data.tenVietTat) {
        setDoc(doc(db, COLLECTIONS.BANK_ACCOUNTS, d.id), { tenVietTat: shortName }, { merge: true }).catch(() => {});
      }
      return { ...data, id: d.id, tenVietTat: shortName };
    });
    callback(list);
  });
};

export const saveBankAccount = async (bank: BankAccount) => {
  const rawId = bank.id || `BANK_${bank.soTaiKhoan.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const docId = safeDocId(rawId);
  await setDoc(doc(db, COLLECTIONS.BANK_ACCOUNTS, docId), removeUndefined({ ...bank, id: docId }), { merge: true });
};

export const removeBankAccount = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.BANK_ACCOUNTS, safeDocId(id)));
};

