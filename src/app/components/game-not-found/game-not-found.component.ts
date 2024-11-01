import { Component, OnInit } from '@angular/core';

import { LanguagePack } from 'src/app/i18n';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-game-not-found',
  templateUrl: './game-not-found.component.html',
  styleUrls: ['./game-not-found.component.scss']
})
export class GameNotFoundComponent implements OnInit{
  constructor(
    private sharedService: SharedService,
  ){}

  imgUrl = 'assets/imgs/game-not-found.png'
  language!: string;
  languagePack = LanguagePack;

  ngOnInit(){
    this.sharedService.language.subscribe(value => {
      this.language = value;
      this.sharedService.setTitle(LanguagePack[this.language]['game-not-found'])
    })
  }
}
