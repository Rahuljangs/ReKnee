import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export { firebase, auth, firestore };

export const db = firestore();

export const usersCollection = db.collection('users');

export function getUserDoc(uid: string) {
  return usersCollection.doc(uid);
}

export function getMessagesCollection(uid: string) {
  return usersCollection.doc(uid).collection('messages');
}

export function getDailyLogsCollection(uid: string) {
  return usersCollection.doc(uid).collection('daily_logs');
}
