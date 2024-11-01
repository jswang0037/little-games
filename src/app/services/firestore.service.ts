import { DocumentData, QueryConstraint, QuerySnapshot, Timestamp, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, query, setDoc, updateDoc } from '@angular/fire/firestore';

import { FirebaseApp } from '@angular/fire/app';
import { Injectable } from '@angular/core';
import { nanoid } from 'nanoid';

export enum Tables {
  User = 'Users',
  Game = 'Games',
}
export interface GeneralAttr {
  created: Timestamp;
  modified: Timestamp;
}
export interface IdAttr {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(
    private afApp: FirebaseApp,
  ){}
  db = getFirestore();

  // General
  docsToArray<T>(querySnapshot: QuerySnapshot<DocumentData>): T[]{
    const dataAry: T[] = [];
    querySnapshot.forEach((element) => {
      const tempDict = {} as T;
      for (const key in element.data()) {
        tempDict[key as keyof T] = element.data()[key];
      }
      dataAry.push(tempDict);
    });
    return dataAry;
  }

  // Create
  async addData<T>(table: Tables, data: T): Promise<string> {
    try {
      const id = nanoid();
      const timestampNow = Timestamp.now();
      type K = T & GeneralAttr;
      const newData: K = {
        ...data,
        id,
        created: timestampNow,
        modified: timestampNow,
      };
      // await addDoc(collection(this.db, table), data);
      await setDoc(doc(this.db, table, id), newData);
      return id;
    } catch (e) {
      console.error('addData error: ', e);
      return '';
    }
  }
  async addDataWithId<T>(table: Tables, data: T, id: string): Promise<void> {
    try {
      const timestampNow = Timestamp.now();
      type K = T & GeneralAttr;
      const newData: K = {
        ...data,
        created: timestampNow,
        modified: timestampNow,
      };
      // await addDoc(collection(this.db, table), data);
      await setDoc(doc(this.db, table, id), newData);
    } catch (e) {
      console.error('addData error: ', e);
    }
  }

  // Read
  async getDataById<T>(table: Tables, id: string): Promise<T | undefined> {
    try {
      const docRef = doc(this.db, table, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as T;
      } else {
        console.log("No such document!");
        return undefined;
      }
    } catch (e) {
      console.error('getDataById error: ', e);
      return undefined;
    }
  }

  async getDocumentsByQuery<T>(table: Tables, queryConstraints: QueryConstraint[]): Promise<T[]> {
    try {
      const q = query(collection(this.db, table), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      return this.docsToArray(querySnapshot);
    } catch (e) {
      console.error('getDocumentsByQuery error: ', e);
      return [];
    }
  }

  // Update
  async updateData<T>(table: Tables, id: string, data: Partial<T>): Promise<void> {
    try {
      const timestampNow = Timestamp.now();
      const dataToUpdate: Partial<T> = {
        ...data,
        modified: timestampNow,
      };
      await updateDoc(doc(this.db, table, id), dataToUpdate);
    } catch (e) {
      console.error('updateData error: ', e);
    }
  }

  async appendData<T>(table: Tables, id: string, arrayKey: string, newData: T): Promise<void> {
    try {
      await updateDoc(doc(this.db, table, id), {
        [arrayKey]: arrayUnion(newData)
      });
    } catch (e) {
      console.error('appendData error: ', e);
    }
  }

  // Delete
  async deleteData(table: Tables, id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, table, id));
    } catch (e) {
      console.error('deleteData error: ', e);
    }
  }

  // Subscribe
  subscribeData(table: Tables, id: string, callback: ( x: DocumentData | undefined) => void){
    const docRef = doc(this.db, table, id);
    onSnapshot(docRef, (doc) => {
      callback(doc.data())
    });
  }

}
