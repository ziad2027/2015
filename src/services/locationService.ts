import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { COMMON_LOCATIONS } from '../data/initialData';

const LOCATIONS_COLLECTION = 'locations';

export interface AppLocation {
  id: string;
  name: string;
  isDefault: boolean;
  updatedAt?: any;
}

export const subscribeToLocations = (callback: (locations: AppLocation[]) => void) => {
  const q = query(
    collection(db, LOCATIONS_COLLECTION),
    orderBy('name', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AppLocation));
    callback(locations);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, LOCATIONS_COLLECTION);
  });
};

export const saveLocation = async (name: string, locationId?: string) => {
  const id = locationId || doc(collection(db, LOCATIONS_COLLECTION)).id;
  const docRef = doc(db, LOCATIONS_COLLECTION, id);

  try {
    await setDoc(docRef, {
      name: name.trim(),
      isDefault: false, // User-created/Admin-created are not system defaults but managed
      updatedAt: serverTimestamp()
    }, { merge: true });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, LOCATIONS_COLLECTION);
  }
};

export const deleteLocation = async (locationId: string) => {
  const docRef = doc(db, LOCATIONS_COLLECTION, locationId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, LOCATIONS_COLLECTION);
  }
};

export const seedInitialLocations = async () => {
  try {
    const snap = await getDocs(collection(db, LOCATIONS_COLLECTION));
    if (snap.empty) {
      for (const locName of COMMON_LOCATIONS) {
        const id = `loc_${Math.random().toString(36).substring(2, 15)}`;
        await setDoc(doc(db, LOCATIONS_COLLECTION, id), {
          name: locName,
          isDefault: true,
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (e) {
    console.warn('Location seeding skipped:', e);
  }
};
