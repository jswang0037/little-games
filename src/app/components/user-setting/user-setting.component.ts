import { Component, OnInit } from '@angular/core';

import { LanguagePack } from 'src/app/i18n';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-user-setting',
  templateUrl: './user-setting.component.html',
  styleUrls: ['./user-setting.component.scss']
})
export class UserSettingComponent implements OnInit{
  constructor(
    private sharedService: SharedService,
  ){}

  language!: string;
  languagePack = LanguagePack;
  isSettingName! : boolean;

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
