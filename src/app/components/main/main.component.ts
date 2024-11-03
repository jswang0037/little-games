import { Component, OnInit } from '@angular/core';
import { GameAttr, GameService, GameStatus } from 'src/app/services/game.service';

import { LanguagePack } from 'src/app/i18n';
import { SharedService } from 'src/app/services/shared.service';
import { UserAttr } from 'src/app/services/user.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit{
  constructor(
    private sharedService: SharedService,
    private gameService: GameService,
  ){}

  language!: string;
  languagePack = LanguagePack;
  user!: UserAttr | undefined;
  games: GameAttr[] = [];
  GameStatus = GameStatus;

  async getGames(){
    if(this.user){
      this.games = await this.gameService.getGamesIncludeUser(this.user.id)
    }
  }

  ngOnInit(){
    this.sharedService.language.subscribe(value => {
      this.language = value;
      this.sharedService.setTitle(LanguagePack[this.language]['title'])
    })
    this.sharedService.user.subscribe(value => {
      this.user = value;
      this.getGames()
    })
  }
}
