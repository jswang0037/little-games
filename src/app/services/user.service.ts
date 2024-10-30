import { FirestoreService, GeneralAttr, Tables } from './firestore.service';

import { Injectable } from '@angular/core';
export interface UserCreateAttr {
  id: string;
  name: string;
  imgUrl: string;
  accounts: Account[];
}
export type UserAttr = UserCreateAttr & GeneralAttr;
export interface Account {
  bank: string;
  accountNo: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private firestoreService: FirestoreService
  ) { }

  async createUserWithId(userCreateAttr: UserCreateAttr): Promise<void> {
    await this.firestoreService.addDataWithId(Tables.User, userCreateAttr, userCreateAttr.id);
  }

  async getUserById(id: string): Promise<UserAttr | undefined> {
    return await this.firestoreService.getDataById(Tables.User, id);
  }

  async updateUser(id: string, userAttr: Partial<UserAttr>): Promise<void> {
    await this.firestoreService.updateData(Tables.User, id, userAttr)
  }

  async appendAccount(id: string, account: Account): Promise<void> {
    const user = await this.getUserById(id);
    if(user){
      if(!user.accounts){
        user.accounts = [];
      }
      user.accounts.push(account);
      await this.firestoreService.updateData(Tables.User, id, user);
    }
  }

  async removeAccount(id: string, account: Account): Promise<void> {
    const user = await this.getUserById(id);
    if(user){
      user.accounts = user.accounts.filter(a => a.bank !== account.bank && a.accountNo !== account.accountNo);
      await this.firestoreService.updateData(Tables.User, id, user);
    }
  }
}
