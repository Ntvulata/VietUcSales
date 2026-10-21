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
import type { Shipment } from '../../types';
import { removeUndefined } from '../../utils/firestore';

const shipmentsRef = collection(db, COLLECTIONS.SHIPMENTS);

const safeDocId = (id: string) => id.trim().replace(/[\/\\]/g, '_');

export const subscribeToShipments = (callback: (shipments: Shipment[]) => void) => {
  const q = query(shipmentsRef, orderBy('ngayTauChayATD', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Shipment[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Shipment);
    });
    callback(list);
  }, (error) => {
    console.error("Firestore shipments subscription error:", error);
  });
};

export const saveShipment = async (shipment: Omit<Shipment, 'id'>, id?: string) => {
  const rawId = id || shipment.maDotXuat;
  const docId = safeDocId(rawId);
  const docRef = doc(db, COLLECTIONS.SHIPMENTS, docId);
  const now = new Date().toISOString();

  const payload = removeUndefined({
    ...shipment,
    updatedAt: now,
    createdAt: shipment.createdAt || now,
  });

  await setDoc(docRef, payload, { merge: true });
};

export const removeShipment = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.SHIPMENTS, safeDocId(id));
  await deleteDoc(docRef);
};
