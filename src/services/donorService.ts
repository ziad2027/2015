import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Donor, UrgentRequest, RequestStatus } from '../types';
import { INITIAL_SEED_DONORS, INITIAL_SEED_REQUESTS } from '../data/initialData';

const DONORS_COLLECTION = 'donors';
const REQUESTS_COLLECTION = 'urgent_requests';

// Listen to all public donors with error handling
export function subscribeToDonors(
  callback: (donors: Donor[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(
    collection(db, DONORS_COLLECTION),
    limit(200)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Donor[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          userId: data.userId || '',
          fullName: data.fullName || '',
          bloodType: data.bloodType || 'O+',
          phone: data.phone || '',
          phoneVerified: data.phoneVerified ?? true,
          residence: data.residence || '',
          notes: data.notes || '',
          lastDonationDate: data.lastDonationDate || '',
          isAvailable: data.isAvailable ?? true,
          allowContact: data.allowContact ?? true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      callback(items);
    },
    (error) => {
      console.error('Error fetching donors snapshot:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, DONORS_COLLECTION);
    }
  );
}

// Check if a phone number already exists for another donor record
export async function checkPhoneExists(phone: string, currentDonorId: string, currentUserId: string): Promise<boolean> {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  try {
    const q = query(collection(db, DONORS_COLLECTION), where('phone', '==', cleanPhone));
    const snap = await getDocs(q);
    let existsForOther = false;
    snap.forEach((docSnap) => {
      if (docSnap.id !== currentDonorId) {
        existsForOther = true;
      }
    });
    return existsForOther;
  } catch (error) {
    console.warn('Error checking phone uniqueness:', error);
    return false;
  }
}

// Save or Update a donor profile (supports admin editing any donor)
export async function saveDonorProfile(
  donorData: Omit<Donor, 'id'>,
  existingDonorId?: string
): Promise<string> {
  const isSheetDonor = Boolean(existingDonorId && existingDonorId.startsWith('sheet_'));
  // If editing an existing Firestore donor, reuse its ID; otherwise create a new donor ID
  const donorId = (existingDonorId && !isSheetDonor)
    ? existingDonorId 
    : `donor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const donorDocRef = doc(db, DONORS_COLLECTION, donorId);

  const cleanPhone = donorData.phone.trim().replace(/\D/g, '');

  const payload: any = {
    userId: donorData.userId,
    fullName: donorData.fullName.trim(),
    bloodType: donorData.bloodType,
    phone: cleanPhone,
    phoneVerified: Boolean(donorData.phoneVerified ?? true),
    residence: donorData.residence.trim(),
    notes: (donorData.notes || '').trim(),
    lastDonationDate: (donorData.lastDonationDate || '').trim(),
    isAvailable: Boolean(donorData.isAvailable),
    allowContact: Boolean(donorData.allowContact),
    updatedAt: serverTimestamp(),
  };

  try {
    if (existingDonorId && !isSheetDonor) {
      await updateDoc(donorDocRef, payload);
      return donorId;
    } else {
      await setDoc(donorDocRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });

      // If we upgraded a sheet donor to a permanent Firestore donor, hide old sheet entry
      if (isSheetDonor && existingDonorId) {
        try {
          const settingsRef = doc(db, 'settings', 'global');
          const snap = await getDoc(settingsRef);
          const currentDeleted = snap.exists() ? (snap.data().deletedDonors || []) : [];
          if (!currentDeleted.includes(existingDonorId)) {
            await setDoc(settingsRef, {
              deletedDonors: [...currentDeleted, existingDonorId],
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (e) {
          console.warn('Note: sheet upgrade sync caught:', e);
        }
      }

      return donorId;
    }
  } catch (error) {
    handleFirestoreError(
      error,
      (existingDonorId && !isSheetDonor) ? OperationType.UPDATE : OperationType.CREATE,
      `${DONORS_COLLECTION}/${donorId}`
    );
  }
}

// Delete donor record (Admin or Owner)
export async function deleteDonorProfile(donorId: string, donorPhone?: string): Promise<void> {
  try {
    // 1. Delete from Firestore if it's a Firestore document
    if (!donorId.startsWith('sheet_')) {
      await deleteDoc(doc(db, DONORS_COLLECTION, donorId));
    }

    // 2. Also register in global settings deleted list so Sheets archive / cached rows are suppressed everywhere
    try {
      const cleanP = donorPhone ? donorPhone.trim().replace(/\D/g, '') : '';
      const toHide = [donorId];
      if (cleanP) toHide.push(cleanP);

      const settingsRef = doc(db, 'settings', 'global');
      const snap = await getDoc(settingsRef);
      const existingList = snap.exists() ? (snap.data().deletedDonors || []) : [];
      const updatedList = Array.from(new Set([...existingList, ...toHide]));

      await setDoc(settingsRef, {
        deletedDonors: updatedList,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Global deleted list tracking warning:', err);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${DONORS_COLLECTION}/${donorId}`);
  }
}

// Listen to urgent blood requests
export function subscribeToUrgentRequests(
  callback: (requests: UrgentRequest[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(
    collection(db, REQUESTS_COLLECTION), 
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: UrgentRequest[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          userId: data.userId || '',
          patientName: data.patientName || '',
          bloodType: data.bloodType || 'O+',
          unitsNeeded: Number(data.unitsNeeded) || 1,
          hospital: data.hospital || '',
          contactName: data.contactName || '',
          contactPhone: data.contactPhone || '',
          urgencyLevel: data.urgencyLevel || 'urgent',
          status: data.status || 'open',
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      callback(items);
    },
    (error) => {
      console.error('Error fetching urgent requests snapshot:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, REQUESTS_COLLECTION);
    }
  );
}

// Create an urgent blood request
export async function createUrgentRequest(
  requestData: Omit<UrgentRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const reqDocRef = doc(db, REQUESTS_COLLECTION, reqId);

  const cleanPhone = requestData.contactPhone.trim().replace(/\D/g, '');

  const payload = {
    userId: requestData.userId,
    patientName: requestData.patientName.trim(),
    bloodType: requestData.bloodType,
    unitsNeeded: Math.max(1, Math.min(20, Number(requestData.unitsNeeded) || 1)),
    hospital: requestData.hospital.trim(),
    contactName: requestData.contactName.trim(),
    contactPhone: cleanPhone,
    urgencyLevel: requestData.urgencyLevel,
    status: 'open',
    notes: (requestData.notes || '').trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(reqDocRef, payload);
    return reqId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${REQUESTS_COLLECTION}/${reqId}`);
  }
}

// Update request status (e.g. mark fulfilled)
export async function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus
): Promise<void> {
  const reqDocRef = doc(db, REQUESTS_COLLECTION, requestId);
  try {
    await updateDoc(reqDocRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REQUESTS_COLLECTION}/${requestId}`);
  }
}

// Delete urgent request
export async function deleteUrgentRequest(requestId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REQUESTS_COLLECTION, requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${REQUESTS_COLLECTION}/${requestId}`);
  }
}

// Seed community initial donors if collection is empty
export async function seedInitialCommunityData(currentUserId: string): Promise<void> {
  try {
    const snap = await getDocs(collection(db, DONORS_COLLECTION));
    if (snap.empty) {
      console.log('Seeding initial community donors for Qa\'tabah...');
      for (let i = 0; i < INITIAL_SEED_DONORS.length; i++) {
        const item = INITIAL_SEED_DONORS[i];
        const seedId = `donor_seed_${i + 1}`;
        await setDoc(doc(db, DONORS_COLLECTION, seedId), {
          ...item,
          userId: currentUserId,
          allowContact: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Also seed sample requests
      for (let j = 0; j < INITIAL_SEED_REQUESTS.length; j++) {
        const req = INITIAL_SEED_REQUESTS[j];
        const reqId = `req_seed_${j + 1}`;
        await setDoc(doc(db, REQUESTS_COLLECTION, reqId), {
          ...req,
          userId: currentUserId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('Seeding check completed (or rules restricted non-auth):', err);
  }
}
