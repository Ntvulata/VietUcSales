import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../constants/collections';
import type { PaymentTransaction } from '../../types';
import { removeUndefined } from '../../utils/firestore';

const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);

const safeDocId = (id: string) => id.trim().replace(/[\/\\]/g, '_');

export const subscribeToPayments = (callback: (payments: PaymentTransaction[]) => void) => {
  const q = query(paymentsRef, orderBy('ngayTienVe', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: PaymentTransaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as PaymentTransaction);
    });
    callback(list);
  }, (error) => {
    console.error("Firestore payments subscription error:", error);
  });
};

export const savePayment = async (payment: Omit<PaymentTransaction, 'id'>, id?: string) => {
  const rawId = id || payment.maGiaoDich;
  const docId = safeDocId(rawId);
  const docRef = doc(db, COLLECTIONS.PAYMENTS, docId);
  const now = new Date().toISOString();

  const payload = removeUndefined({
    ...payment,
    createdAt: payment.createdAt || now,
  });

  await setDoc(docRef, payload, { merge: true });
};

export const removePayment = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.PAYMENTS, safeDocId(id));
  await deleteDoc(docRef);
};
