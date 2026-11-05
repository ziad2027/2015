import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  increment,
  addDoc,
  getDoc,
  getDocs,
  limit,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Conversation, ChatMessage, ConversationStatus } from '../types';

const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Subscribe to all conversations (Admin only)
 */
export const subscribeToAllConversations = (callback: (conversations: Conversation[]) => void) => {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Conversation));
    callback(conversations);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, CONVERSATIONS_COLLECTION);
  });
};

/**
 * Subscribe to a single conversation (User or Admin)
 */
export const subscribeToConversation = (userId: string, callback: (conversation: Conversation | null) => void) => {
  const docRef = doc(db, CONVERSATIONS_COLLECTION, userId);

  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Conversation);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `${CONVERSATIONS_COLLECTION}/${userId}`);
  });
};

/**
 * Subscribe to messages in a conversation
 */
export const subscribeToMessages = (userId: string, callback: (messages: ChatMessage[]) => void) => {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION, userId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage));
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `${CONVERSATIONS_COLLECTION}/${userId}/messages`);
  });
};

/**
 * Send a message
 */
export const sendMessage = async (
  userId: string, 
  senderId: string, 
  text: string, 
  isAdmin: boolean,
  userProfile?: { displayName: string, phone?: string }
) => {
  try {
    const convRef = doc(db, CONVERSATIONS_COLLECTION, userId);
    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, userId, 'messages');

    // 1. Add the message
    await addDoc(messagesRef, {
      senderId,
      text: text.trim(),
      isAdmin,
      createdAt: serverTimestamp()
    });

    // 2. Update conversation metadata
    const convSnap = await getDoc(convRef);
    const updateData: any = {
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: isAdmin ? 'replied' : 'new'
    };

    if (isAdmin) {
      updateData.unreadCountByUser = increment(1);
    } else {
      updateData.unreadCountByAdmin = increment(1);
      // Ensure user info is up to date if starting a new chat
      if (!convSnap.exists() && userProfile) {
        updateData.userId = userId;
        updateData.userDisplayName = userProfile.displayName;
        updateData.userPhone = userProfile.phone || '';
        updateData.unreadCountByUser = 0;
      }
    }

    await setDoc(convRef, updateData, { merge: true });

    // 3. Trigger Notification
    try {
      let targetToken: string | null = null;
      let title = '';
      let body = text.length > 50 ? text.substring(0, 47) + '...' : text;

      if (isAdmin) {
        // Notify the user
        const userSnap = await getDoc(doc(db, 'users', userId));
        targetToken = userSnap.exists() ? userSnap.data().fcmToken : null;
        title = 'رد من إدارة تطبيق قطرة دم';
      } else {
        // Notify admins (simplified to first admin found for this demo)
        const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'), limit(1));
        const adminsSnap = await getDocs(adminsQuery);
        if (!adminsSnap.empty) {
          targetToken = adminsSnap.docs[0].data().fcmToken;
        }
        title = `رسالة جديدة من ${userProfile?.displayName || 'مستخدم'}`;
      }

      if (targetToken) {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: targetToken, title, body })
        });
      }
    } catch (notifyErr) {
      console.warn('Notification trigger failed:', notifyErr);
    }

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CONVERSATIONS_COLLECTION);
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (userId: string, isAdmin: boolean) => {
  try {
    const convRef = doc(db, CONVERSATIONS_COLLECTION, userId);
    const updateData: any = {};
    
    if (isAdmin) {
      updateData.unreadCountByAdmin = 0;
      updateData.status = 'read';
    } else {
      updateData.unreadCountByUser = 0;
    }

    await updateDoc(convRef, updateData);
  } catch (error) {
    // Fail silently if doc doesn't exist yet
  }
};

/**
 * Update conversation status
 */
export const updateConversationStatus = async (userId: string, status: ConversationStatus) => {
  try {
    const convRef = doc(db, CONVERSATIONS_COLLECTION, userId);
    await updateDoc(convRef, { status, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, CONVERSATIONS_COLLECTION);
  }
};
/**
 * Update FCM token for a user
 */
export const updateFCMToken = async (userId: string, token: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { fcmToken: token, updatedAt: serverTimestamp() });
  } catch (error) {
    // Fail silently or handle if user doc doesn't exist
  }
};
