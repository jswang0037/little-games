import { Component, OnInit } from '@angular/core';
import { UserAttr, UserService } from 'src/app/services/user.service';

import { HtmlService } from 'src/app/services/html.service';
import { LanguagePack } from 'src/app/i18n';
import { Profile } from '@liff/get-profile';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit{
  constructor(
    private sharedService: SharedService,
    private userService: UserService,
    private htmlService: HtmlService
  ){}

  profile!: Profile | undefined;
  isViewAccount = false;
  user!: UserAttr | undefined;
  nameIsValid = true;
  language!: string;
  languagePack = LanguagePack;

  validate(){
    const name = this.htmlService.getInputValue("input-name");
    this.nameIsValid = name !== '';
  }

  async updateUser(){
    const name = this.htmlService.getInputValue("input-name");
    if(!this.profile){
      return
    }

    const userUpdateAttr: Partial<UserAttr> = {
      name: name
    }
    await this.userService.updateUser(this.profile.userId, userUpdateAttr)

    const user = await this.userService.getUserById(this.profile.userId)
    this.sharedService.setUser(user)
    this.sharedService.setIsSettingUser(false)
  }

  ngOnInit(){
    this.sharedService.profile.subscribe(value => {
      this.profile = value;
    })
    this.sharedService.language.subscribe(value => {
      this.language = value;
    })
    this.sharedService.user.subscribe(value => {
      this.user = value;
    })
  }
}
