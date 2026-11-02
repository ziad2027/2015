export type BloodType = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

export const BLOOD_TYPES: BloodType[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export interface Donor {
  id: string;
  userId: string;
  fullName: string;
  bloodType: BloodType;
  phone: string;
  phoneVerified?: boolean;
  residence: string;
  notes?: string;
  lastDonationDate?: string;
  isAvailable: boolean;
  allowContact: boolean;
  source?: 'firestore' | 'google_sheets' | 'manual_import';
  createdAt?: any;
  updatedAt?: any;
}

export type UrgencyLevel = 'critical' | 'urgent' | 'normal';
export type RequestStatus = 'open' | 'fulfilled';

export interface UrgentRequest {
  id: string;
  userId: string;
  patientName: string;
  bloodType: BloodType;
  unitsNeeded: number;
  hospital: string;
  contactName: string;
  contactPhone: string;
  urgencyLevel: UrgencyLevel;
  status: RequestStatus;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  phone?: string;
  phoneVerified?: boolean;
  role: 'user' | 'admin';
  createdAt?: any;
}

export type ActiveTab = 'home' | 'search' | 'urgent' | 'info' | 'register' | 'profile' | 'admin';
