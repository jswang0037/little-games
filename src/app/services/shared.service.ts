import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { Liff } from '@line/liff';
import { Profile } from '@liff/get-profile';
import { UserAttr } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private profileSubject = new BehaviorSubject<Profile|undefined>(undefined);
  public profile: Observable<Profile|undefined> = this.profileSubject.asObservable();
  private liffClientSubject = new BehaviorSubject<Liff|undefined>(undefined);
  public liffClient: Observable<Liff|undefined> = this.liffClientSubject.asObservable();
  private titleSubject = new BehaviorSubject<string|undefined>(undefined);
  public title: Observable<string|undefined> = this.titleSubject.asObservable();
  private languageObject = new BehaviorSubject<string>('en');
  public language: Observable<string> = this.languageObject.asObservable();
  private userSubject = new BehaviorSubject<UserAttr|undefined>(undefined);
  public user: Observable<UserAttr|undefined> = this.userSubject.asObservable();
  private isSettingUserSubject = new BehaviorSubject<boolean>(false);
  public isSettingUser: Observable<boolean> = this.isSettingUserSubject.asObservable();

  setProfile(profile: Profile): void {
    this.profileSubject.next(profile);
  }
  setUser(user: UserAttr | undefined): void {
    this.userSubject.next(user);
  }
  setLiff(liff: Liff): void {
    this.liffClientSubject.next(liff);
  }
  setTitle(title: string): void {
    this.titleSubject.next(title);
  }
  setLanguage(language: string): void {
    this.languageObject.next(language);
  }
  setIsSettingUser(isSettingUser: boolean): void {
    this.isSettingUserSubject.next(isSettingUser);
  }
}
