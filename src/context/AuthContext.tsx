import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  updateProfile,
  updatePassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { sanitizePhone } from '../services/phoneVerificationService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isGuest: boolean;
  isLoading: boolean;
  loginWithPhone: (phone: string, pass: string) => Promise<void>;
  registerWithPhone: (phone: string, pass: string, fullName: string) => Promise<void>;
  resetPasswordDirect: (phone: string, newPass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  updateUserName: (newName: string) => Promise<void>;
  updateUserProfileAndAccount: (fullName: string, phone: string, newPassword?: string) => Promise<void>;
  activeRole: 'user' | 'admin';
  switchActiveRole: (role: 'user' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to format email for phone-based Firebase Auth accounts
export function getPhoneAuthEmail(cleanPhone: string, version: number = 1): string {
  return `user_967${cleanPhone}_v${version}@qataba-blood.app`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('blood_app_guest') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<'user' | 'admin'>('user');

  // Sync user profile from Firestore
  const fetchUserProfile = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      const isAdminEmail = user.email === 'ziadalsyyadi@gmail.com' || user.email === 'user_967773633918_v1@qataba-blood.app';

      if (snap.exists()) {
        const data = snap.data();
        
        // Force admin role in Firestore if it's the master admin email but role is different
        if (isAdminEmail && data.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin' });
        }

        setUserProfile({
          uid: user.uid,
          displayName: data.displayName || user.displayName || 'مستخدم',
          phone: data.phone || '',
          phoneVerified: data.phoneVerified ?? true,
          role: isAdminEmail ? 'admin' : (data.role || 'user'),
          createdAt: data.createdAt,
        });
      } else {
        // Extract phone number from email pattern
        const phoneMatch = user.email?.match(/user_967(\d+)_/);
        const legacyMatch = user.email?.match(/user_(\d+)@/);
        const extractedPhone = phoneMatch ? phoneMatch[1] : (legacyMatch ? legacyMatch[1] : '');

        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || (extractedPhone ? `مستخدم ${extractedPhone}` : 'فاعل خير'),
          phone: extractedPhone,
          phoneVerified: true,
          role: isAdminEmail ? 'admin' : 'user',
        };
        await setDoc(userDocRef, {
          displayName: newProfile.displayName,
          phone: extractedPhone,
          phoneVerified: true,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: serverTimestamp(),
        });
        setUserProfile(newProfile);
      }
      
      // Update active role based on user profile
      const actualRole = isAdminEmail ? 'admin' : (snap.exists() ? (snap.data()?.role || 'user') : 'user');
      setActiveRole(actualRole);

    } catch (err) {
      console.warn('Could not fetch user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsGuest(false);
        localStorage.removeItem('blood_app_guest');
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to fetch credential version for a phone number
  const getPhoneAuthVersion = async (cleanPhone: string): Promise<number> => {
    try {
      const authDoc = await getDoc(doc(db, 'phone_auth', cleanPhone));
      if (authDoc.exists()) {
        const data = authDoc.data();
        return Number(data.version) || 1;
      }
    } catch (err) {
      console.warn('Error reading phone_auth record:', err);
    }
    return 1;
  };

  /**
   * Direct Login: Phone number + Password (no SMS code required)
   */
  const loginWithPhone = async (phone: string, pass: string) => {
    setIsLoading(true);
    try {
      const cleanPhone = sanitizePhone(phone);
      if (!cleanPhone || cleanPhone.length < 7) {
        throw new Error('يرجى إدخال رقم الهاتف بشكل صحيح');
      }
      if (!pass) {
        throw new Error('يرجى إدخال كلمة المرور');
      }

      const version = await getPhoneAuthVersion(cleanPhone);
      const email = getPhoneAuthEmail(cleanPhone, version);

      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (loginErr: any) {
        if (loginErr.code === 'auth/operation-not-allowed') {
          const e = new Error('خدمة تسجيل الدخول بكلمة المرور (Email/Password) غير مفعلة في مشروع Firebase حتى الآن.');
          (e as any).code = 'auth/operation-not-allowed';
          throw e;
        }
        // Fallback for legacy formats if existing user
        if (loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/user-not-found') {
          try {
            await signInWithEmailAndPassword(auth, `user_${cleanPhone}@qataba-blood.app`, pass);
            return;
          } catch (e) {
            // Re-throw original error
            throw loginErr;
          }
        }
        throw loginErr;
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Direct Register: Phone number + Password only (no verification code, instant 1-step sign-up)
   */
  const registerWithPhone = async (phone: string, pass: string, fullName: string) => {
    setIsLoading(true);
    try {
      const cleanPhone = sanitizePhone(phone);
      if (cleanPhone.length < 7 || cleanPhone.length > 12) {
        throw new Error('يرجى إدخال رقم هاتف يمني صحيح (مثال: 771234567)');
      }

      if (!pass || pass.length < 6) {
        throw new Error('كلمة المرور يجب أن لا تقل عن 6 خانات');
      }

      if (!fullName || fullName.trim().length < 2) {
        throw new Error('يرجى إدخال الاسم الكامل (3 أحرف على الأقل)');
      }

      // Check if phone is already registered in phone_auth
      try {
        const existingAuthDoc = await getDoc(doc(db, 'phone_auth', cleanPhone));
        if (existingAuthDoc.exists()) {
          throw new Error('هذا الرقم مسجل بالفعل في التطبيق. يرجى تسجيل الدخول مباشرة أو استعادة كلمة المرور.');
        }
      } catch (authDocErr: any) {
        if (authDocErr.message?.includes('مسجل بالفعل')) {
          throw authDocErr;
        }
      }

      // Register new account in Firebase Auth
      const version = 1;
      const email = getPhoneAuthEmail(cleanPhone, version);
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, email, pass);
      } catch (authErr: any) {
        if (authErr.code === 'auth/operation-not-allowed') {
          const e = new Error('خدمة تسجيل الدخول بكلمة المرور (Email/Password) غير مفعلة في مشروع Firebase حتى الآن. يرجى تفعيلها لمرة واحدة من لوحة التحكم.');
          (e as any).code = 'auth/operation-not-allowed';
          throw e;
        }
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error('هذا الرقم مسجل بالفعل في التطبيق. يرجى تسجيل الدخول مباشرة أو استعادة كلمة المرور.');
        }
        if (authErr.code === 'auth/weak-password') {
          throw new Error('كلمة المرور ضعيفة. يرجى اختيار كلمة مرور لا تقل عن 6 خانات.');
        }
        throw authErr;
      }

      const displayName = fullName.trim();
      try {
        await updateProfile(cred.user, { displayName });
      } catch (e) {
        console.warn('Could not update Auth displayName:', e);
      }

      // Save phone auth version tracking
      try {
        await setDoc(doc(db, 'phone_auth', cleanPhone), {
          phone: cleanPhone,
          version: 1,
          userId: cred.user.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (phoneErr) {
        console.warn('Could not save phone_auth doc:', phoneErr);
      }

      // Save user profile in Firestore
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          displayName,
          phone: cleanPhone,
          phoneVerified: true,
          role: 'user',
          createdAt: serverTimestamp(),
        });
      } catch (userDocErr) {
        console.warn('Could not save user profile doc:', userDocErr);
      }

      setUserProfile({
        uid: cred.user.uid,
        displayName,
        phone: cleanPhone,
        phoneVerified: true,
        role: 'user',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Password Reset with Scrambled Captcha:
   * Increments credential version and registers new password securely in Firebase Auth
   */
  const resetPasswordDirect = async (phone: string, newPass: string) => {
    setIsLoading(true);
    try {
      const cleanPhone = sanitizePhone(phone);
      if (!cleanPhone || cleanPhone.length < 7) {
        throw new Error('يرجى إدخال رقم الهاتف بشكل صحيح');
      }
      if (!newPass || newPass.length < 6) {
        throw new Error('كلمة المرور الجديدة يجب أن لا تقل عن 6 خانات');
      }

      // Read current version
      const authDocRef = doc(db, 'phone_auth', cleanPhone);
      let currentVersion = 1;
      let existingUserId = '';

      try {
        const authSnap = await getDoc(authDocRef);
        if (authSnap.exists()) {
          const data = authSnap.data();
          currentVersion = Number(data.version) || 1;
          existingUserId = data.userId || '';
        } else {
          // Check publicly readable donors collection
          const donorQ = query(collection(db, 'donors'), where('phone', '==', cleanPhone));
          const donorSnap = await getDocs(donorQ);
          if (!donorSnap.empty) {
            existingUserId = donorSnap.docs[0].data().userId || '';
          }
          currentVersion = 1;
        }
      } catch (e) {
        console.warn('Error reading phone_auth or donors during reset:', e);
      }

      const nextVersion = currentVersion + 1;
      const newEmail = getPhoneAuthEmail(cleanPhone, nextVersion);

      // Create updated credential with new password in Firebase Auth
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, newEmail, newPass);
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          const bumpVersion = nextVersion + 1;
          cred = await createUserWithEmailAndPassword(auth, getPhoneAuthEmail(cleanPhone, bumpVersion), newPass);
        } else {
          throw authErr;
        }
      }

      const defaultName = `فاعل خير (${cleanPhone})`;
      try {
        await updateProfile(cred.user, { displayName: defaultName });
      } catch (e) {
        console.warn('Could not update profile:', e);
      }

      // Update phone_auth mapping
      try {
        await setDoc(authDocRef, {
          phone: cleanPhone,
          version: nextVersion,
          userId: cred.user.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not set phone_auth doc:', e);
      }

      // Update user doc in Firestore
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          displayName: defaultName,
          phone: cleanPhone,
          phoneVerified: true,
          role: 'user',
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not update users doc:', e);
      }

      // If user had existing donor record under old UID, update its userId so they keep their donor profile
      if (existingUserId && existingUserId !== cred.user.uid) {
        try {
          const donorDocRef = doc(db, 'donors', `donor_${existingUserId}`);
          const donorSnap = await getDoc(donorDocRef);
          if (donorSnap.exists()) {
            const dData = donorSnap.data();
            await setDoc(doc(db, 'donors', `donor_${cred.user.uid}`), {
              ...dData,
              userId: cred.user.uid,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (donorErr) {
          console.warn('Could not migrate donor doc:', donorErr);
        }
      }

      setUserProfile({
        uid: cred.user.uid,
        displayName: defaultName,
        phone: cleanPhone,
        phoneVerified: true,
        role: 'user',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        setIsGuest(false);
        localStorage.removeItem('blood_app_guest');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('blood_app_guest', 'true');
  };

  const logout = async () => {
    await signOut(auth);
    setIsGuest(false);
    localStorage.removeItem('blood_app_guest');
  };

  const updateUserName = async (newName: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    const trimmed = newName.trim();
    if (trimmed.length < 2) throw new Error('الاسم يجب أن يتكون من حرفين على الأقل');

    await updateProfile(currentUser, { displayName: trimmed });
    await setDoc(doc(db, 'users', currentUser.uid), {
      displayName: trimmed,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setUserProfile(prev => prev ? { ...prev, displayName: trimmed } : null);
  };

  const updateUserProfileAndAccount = async (fullName: string, phone: string, newPassword?: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً');
    
    const cleanName = fullName.trim();
    if (cleanName.length < 2) {
      throw new Error('الاسم الكامل يجب أن يتكون من حرفين على الأقل');
    }

    const cleanPhone = sanitizePhone(phone);

    // 1. Update Auth displayName
    await updateProfile(currentUser, { displayName: cleanName });

    // 2. Update Firestore users doc
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, {
      displayName: cleanName,
      phone: cleanPhone || userProfile?.phone || '',
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 3. Update donor record if user is registered as a donor
    try {
      const donorDocRef = doc(db, 'donors', `donor_${currentUser.uid}`);
      const donorSnap = await getDoc(donorDocRef);
      if (donorSnap.exists()) {
        await updateDoc(donorDocRef, {
          fullName: cleanName,
          phone: cleanPhone || donorSnap.data().phone,
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn('Could not update donor profile during account update:', e);
    }

    // 4. Update Password if provided
    if (newPassword && newPassword.trim().length >= 6) {
      try {
        await updatePassword(currentUser, newPassword.trim());
      } catch (passErr: any) {
        if (passErr.code === 'auth/requires-recent-login') {
          throw new Error('لتغيير كلمة المرور، يرجى الخروج وتسجيل الدخول مجدداً ثم المحاولة.');
        }
        throw new Error(passErr.message || 'فشل تحديث كلمة المرور');
      }
    }

    // 5. Update local state
    setUserProfile(prev => prev ? {
      ...prev,
      displayName: cleanName,
      phone: cleanPhone || prev.phone
    } : {
      uid: currentUser.uid,
      displayName: cleanName,
      phone: cleanPhone,
      phoneVerified: true,
      role: 'user'
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isGuest,
        isLoading,
        loginWithPhone,
        registerWithPhone,
        resetPasswordDirect,
        loginWithGoogle,
        continueAsGuest,
        logout,
        updateUserName,
        updateUserProfileAndAccount,
        activeRole,
        switchActiveRole: (role) => setActiveRole(role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
