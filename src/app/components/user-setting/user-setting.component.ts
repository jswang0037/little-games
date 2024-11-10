import { Component, OnInit } from '@angular/core';

import { LanguagePack } from 'src/app/i18n';
import { SharedService } from 'src/app/services/shared.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user-setting',
  templateUrl: './user-setting.component.html',
  styleUrls: ['./user-setting.component.scss']
})
export class UserSettingComponent implements OnInit{
  constructor(
    private sharedService: SharedService,
    private userService: UserService
  ){}

  language!: string;
  languagePack = LanguagePack;
  isSettingName! : boolean;
  isProduction = environment.isProduction;

  async setProfile(userId: string){
    const profile = {
      userId: userId,
      displayName: 'Test User'
    }

    this.sharedService.setProfile(profile);
    const user = await this.userService.getUserById(userId);
    this.sharedService.setUser(user);
  }

  ngOnInit() {
    this.sharedService.language.subscribe(value => {
      this.language = value;
      this.sharedService.setTitle(LanguagePack[this.language]['title'])
    })
    this.sharedService.isSettingUser.subscribe(value => {
      this.isSettingName = value;
    })
  }
}
