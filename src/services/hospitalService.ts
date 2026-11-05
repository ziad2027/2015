import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  onSnapshot, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Hospital } from '../types';

const HOSPITALS_COLLECTION = 'hospitals';

export const subscribeToHospitals = (callback: (hospitals: Hospital[]) => void) => {
  const q = query(
    collection(db, HOSPITALS_COLLECTION),
    orderBy('name', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const hospitals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Hospital));
    callback(hospitals);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, HOSPITALS_COLLECTION);
  });
};

export const saveHospital = async (hospital: Omit<Hospital, 'id'>, hospitalId?: string) => {
  const id = hospitalId || doc(collection(db, HOSPITALS_COLLECTION)).id;
  const docRef = doc(db, HOSPITALS_COLLECTION, id);

  try {
    await setDoc(docRef, {
      ...hospital,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, HOSPITALS_COLLECTION);
  }
};

export const deleteHospital = async (hospitalId: string) => {
  const docRef = doc(db, HOSPITALS_COLLECTION, hospitalId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, HOSPITALS_COLLECTION);
  }
};

export const INITIAL_HOSPITALS: Omit<Hospital, 'id'>[] = [
  {
    name: 'مستشفى قعطبة العام (المركزي)',
    type: 'مستشفى حكومي رئيسي',
    address: 'المدينة المركزية - قعطبة',
    phone: '+967 773 000 000',
    services: 'طوارئ على مدار الساعة، بنك دم، جراحة عامة، رقود',
  },
  {
    name: 'مستشفى السلام التخصصي',
    type: 'مستشفى أهلي',
    address: 'شارع الثلاثين - قعطبة',
    phone: '+967 711 223 344',
    services: 'طوارئ، مختبرات متكاملة، عمليات، بنك دم فرعي',
  },
  {
    name: 'مستوصف النور الطبي الخيري',
    type: 'مركز صحي',
    address: 'سوق قعطبة القديم',
    phone: '+967 733 445 566',
    services: 'إسعافات أولية، عيادات عامة، فحوصات دم',
  },
  {
    name: 'مختبرات قعطبة المركزية',
    type: 'مختبر وتحاليل',
    address: 'جوار المستشفى العام - قعطبة',
    phone: '+967 700 889 900',
    services: 'فصائل الدم، مطابقة الدم، فحوصات شاملة',
  },
  {
    name: 'مستشفى الامل التخصصي',
    type: 'مستشفى خاص',
    address: 'مدخل المدينة - قعطبة',
    phone: '+967 777 112 233',
    services: 'طوارئ، قسم عمليات، عناية مركزة، بنك دم',
  },
];

export const seedHospitals = async () => {
  for (const hospital of INITIAL_HOSPITALS) {
    await saveHospital(hospital);
  }
};
