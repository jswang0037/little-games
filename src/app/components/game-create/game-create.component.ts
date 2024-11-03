import { Component, OnInit } from '@angular/core';
import { CountDownConfig, GameAttr, GameCreateAttr, GameName, GameService, GameStatus, GameType } from 'src/app/services/game.service';

import { HtmlService } from 'src/app/services/html.service';
import { LanguagePack } from 'src/app/i18n';
import { Liff } from '@line/liff';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';
import { UserAttr } from 'src/app/services/user.service';

@Component({
  selector: 'app-game-create',
  templateUrl: './game-create.component.html',
  styleUrls: ['./game-create.component.scss']
})
export class GameCreateComponent  implements OnInit{
  constructor(
    private sharedService: SharedService,
    private gameService: GameService,
    private htmlService: HtmlService,
    private router: Router
  ){}

  liffClient!: Liff | undefined;
  language!: string;
  languagePack = LanguagePack;
  isCreating = false;
  user!: UserAttr | undefined;
  games: GameAttr[] = [];
  GameStatus = GameStatus;
  GameName = GameName
  gameName!: GameName;

  async createGame(){
    if(!this.user){
      return
    }

    const config: CountDownConfig = {
      target: Number(this.htmlService.getInputValue("input-countdown-target")) || 0,
    }

    const newGame: GameCreateAttr = {
      type: GameType.Many,
      name: GameName.CountDown,
      status: GameStatus.Waiting,
      adminId: this.user.id,
      maxPlayers: 100,
      playerIds: [],
      players: [],
      results: [],
      config: config
    }

    const gameId = await this.gameService.createGame(newGame);
    if(this.user){
      await this.gameService.addPlayerToGame(gameId, this.user)
    }

    this.router.navigate(['/game', gameId])
  }

  async getGames(){
    if(this.user){
      this.games = await this.gameService.getGamesIncludeUser(this.user.id)
    }
  }

  check(){
    const gameName = this.htmlService.getInputValue('select-game-name')
    if(gameName === GameName.CountDown){
      this.gameName = GameName.CountDown;
    }
  }

  ngOnInit(){
    this.sharedService.user.subscribe(value => {
      this.user = value;
    })
    this.sharedService.language.subscribe(value => {
      this.language = value;
      this.sharedService.setTitle(LanguagePack[this.language]['title'])
    })
  }
}
