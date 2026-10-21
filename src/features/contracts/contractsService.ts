import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLLECTIONS } from '../../constants/collections';
import type { Contract } from '../../types';
import { removeUndefined } from '../../utils/firestore';

const contractsRef = collection(db, COLLECTIONS.CONTRACTS);

// Firestore document ID cannot contain slashes '/'
const safeDocId = (id: string) => id.trim().replace(/[\/\\]/g, '_');

export const subscribeToContracts = (callback: (contracts: Contract[]) => void) => {
  const q = query(contractsRef, orderBy('ngayKy', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Contract[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Contract);
    });
    callback(list);
  }, (error) => {
    console.error("Firestore contracts subscription error:", error);
  });
};

export const saveContract = async (contract: Omit<Contract, 'id'>, id?: string) => {
  const rawId = id || contract.soHD;
  const docId = safeDocId(rawId);
  const docRef = doc(db, COLLECTIONS.CONTRACTS, docId);
  const now = new Date().toISOString();
  
  const payload = removeUndefined({
    ...contract,
    updatedAt: now,
    createdAt: contract.createdAt || now,
  });

  await setDoc(docRef, payload, { merge: true });
};

export const updateContractStatus = async (id: string, status: Contract['trangThaiHD']) => {
  const docRef = doc(db, COLLECTIONS.CONTRACTS, safeDocId(id));
  await updateDoc(docRef, { 
    trangThaiHD: status,
    updatedAt: new Date().toISOString()
  });
};

export const removeContract = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.CONTRACTS, safeDocId(id));
  await deleteDoc(docRef);
};
