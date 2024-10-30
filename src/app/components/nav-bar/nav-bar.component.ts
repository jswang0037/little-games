import { Component, OnInit } from '@angular/core';
import { UserCreateAttr, UserService } from 'src/app/services/user.service';
import liff, { Liff } from '@line/liff';

import { AlertService } from 'src/app/services/alert.service';
import { Profile } from '@liff/get-profile';
import { SharedService } from 'src/app/services/shared.service';
import { environment } from 'src/environments/environment.dev';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit{
  constructor(
    private sharedService: SharedService,
    private userService: UserService,
    private alertService: AlertService
  ) { }

  isProduction = environment.isProduction
  fakeProfile: Profile = {
    userId: 'test-user',
    displayName: 'Test User'
  }

  liffId = '2006516939-5zbAVx6N';
  iconImgUrl = 'assets/imgs/bill-sharing-icon.png';
  defaultUserIconImgUrl = 'assets/imgs/user-icon.png';

  profile!: Profile | undefined;
  liffClient!: Liff | undefined;
  title!: string | undefined;
  language!: string;

  userIconImgUrl!: string | undefined;

  initLiff(): void {
    liff
      .init({
        liffId: this.liffId,
      })
      .then(async () => {
        this.sharedService.setLiff(liff);
        this.getProfile();
        this.getAppLanguage();
      })
      .catch((err) => {
        this.alertService.addAlert('danger', err)
        console.error(err);
      });
  }

  getAppLanguage(){
    if (!this.liffClient){
      return
    }

    const language = this.liffClient.getAppLanguage();
    this.language = language;
    if(language.substring(0, 2) === 'zh'){
      this.sharedService.setLanguage('zh-TW');
    }
  }

  async getProfile(){
    if (!this.liffClient){
      return
    }

    // Get profile
    if (this.isProduction){
      const isLoggedIn = this.liffClient.isLoggedIn();
      if(!isLoggedIn){
        this.liffClient.login();
        return
      }
      this.profile = await this.liffClient.getProfile();
    } else {
      this.profile = this.fakeProfile;
    }
    this.sharedService.setProfile(this.profile);

    // Create or update user in firestore
    const userId = this.profile.userId;
    const user = await this.userService.getUserById(userId);
    if (user) {
      this.userService.updateUser(userId, {
        name: this.profile.displayName,
        imgUrl: this.profile.pictureUrl? this.profile.pictureUrl : this.defaultUserIconImgUrl,
        accounts: user.accounts? user.accounts : []
      })
    } else {
      const newUser: UserCreateAttr = {
        id: userId,
        name: this.profile.displayName,
        imgUrl: this.profile.pictureUrl? this.profile.pictureUrl : this.defaultUserIconImgUrl,
        accounts: []
      };
      this.userService.createUserWithId(newUser)
    }
  }

  ngOnInit() {
    this.initLiff();

    this.sharedService.title.subscribe(value => {
      this.title = value
    })
    this.sharedService.profile.subscribe(value => {
      this.userIconImgUrl = value?.pictureUrl? value?.pictureUrl : this.defaultUserIconImgUrl;
    })
    this.sharedService.liffClient.subscribe(value => {
      this.liffClient = value;
    })
  }

}
