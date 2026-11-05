export type BloodType = 'O+' | 'A+' | 'B+' | 'AB+' | 'O-' | 'A-' | 'B-' | 'AB-';
export const BLOOD_TYPES: BloodType[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export interface DonationRecord {
  id: string;
  date: string;
  notes?: string;
}

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
  donationHistory?: DonationRecord[];
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

export interface AppSettings {
  announcement: string;
  noticeMessage?: string;
  announcementType?: 'general' | 'urgent' | 'campaign';
  announcementTime?: string;
  announcementActive?: boolean;
  deletedDonors?: string[];
  updatedAt?: any;
  updatedBy?: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  services: string;
  updatedAt?: any;
}

export type ConversationStatus = 'new' | 'read' | 'replied' | 'closed';

export interface Conversation {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhone?: string;
  lastMessage?: string;
  lastMessageAt?: any;
  status: ConversationStatus;
  unreadCountByAdmin: number;
  unreadCountByUser: number;
  updatedAt: any;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  isAdmin: boolean;
  createdAt: any;
}

export type ActiveTab = 'home' | 'search' | 'urgent' | 'info' | 'register' | 'admin' | 'hospitals' | 'chat' | 'profile';
