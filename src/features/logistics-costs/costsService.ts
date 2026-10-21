import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../constants/collections';
import type { LogisticsCost } from '../../types';

import { removeUndefined } from '../../utils/firestore';

const costsRef = collection(db, COLLECTIONS.LOGISTICS_COSTS);

const safeDocId = (id: string) => id.trim().replace(/[\/\\]/g, '_');

export const subscribeToCosts = (callback: (costs: LogisticsCost[]) => void) => {
  return onSnapshot(costsRef, (snapshot) => {
    const list: LogisticsCost[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as LogisticsCost);
    });
    callback(list);
  }, (error) => {
    console.error("Firestore costs subscription error:", error);
  });
};

export const saveCost = async (cost: Omit<LogisticsCost, 'id'>, id?: string) => {
  const rawId = id || cost.maCP;
  const docId = safeDocId(rawId);
  const docRef = doc(db, COLLECTIONS.LOGISTICS_COSTS, docId);
  const now = new Date().toISOString();

  const payload = removeUndefined({
    ...cost,
    updatedAt: now,
    createdAt: cost.createdAt || now,
  });

  await setDoc(docRef, payload, { merge: true });
};


export const toggleCostPaymentStatus = async (id: string, currentStatus: LogisticsCost['tinhTrangThanhToan']) => {
  const docRef = doc(db, COLLECTIONS.LOGISTICS_COSTS, safeDocId(id));
  const nextStatus = currentStatus === 'DA_THANH_TOAN' ? 'CHUA_THANH_TOAN' : 'DA_THANH_TOAN';
  const today = nextStatus === 'DA_THANH_TOAN' ? new Date().toISOString().split('T')[0] : '';
  
  await updateDoc(docRef, {
    tinhTrangThanhToan: nextStatus,
    ngayThanhToan: today,
    updatedAt: new Date().toISOString()
  });
};

export const removeCost = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.LOGISTICS_COSTS, safeDocId(id));
  await deleteDoc(docRef);
};
