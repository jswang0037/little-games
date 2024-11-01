import { Component, OnInit } from '@angular/core';
import { CountDownConfig, GameAttr, GameCreateAttr, GameName, GameService, GameStatus, GameType } from 'src/app/services/game.service';

import { HtmlService } from '../../services/html.service';
import { LanguagePack } from 'src/app/i18n';
import { Liff } from '@line/liff';
import { Profile } from '@liff/get-profile';
import { Router } from '@angular/router';
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
    private htmlService: HtmlService,
    private router: Router
  ){}

  liffClient!: Liff | undefined;
  profile!: Profile | undefined;
  language!: string;
  languagePack = LanguagePack;
  isCreating = false;
  user!: UserAttr | undefined;
  games: GameAttr[] = [];
  GameStatus = GameStatus;

  async createGame(){
    if(!this.profile){
      return
    }

    const config: CountDownConfig = {
      target: Number(this.htmlService.getInputValue("input-countdown-target")) || 0,
    }

    const newGame: GameCreateAttr = {
      type: GameType.Many,
      name: GameName.CountDown,
      status: GameStatus.Waiting,
      adminId: this.profile.userId,
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
      console.log(this.games)
    }
  }

  ngOnInit(){
    this.sharedService.liffClient.subscribe(value => {
      this.liffClient = value;
    })
    this.sharedService.language.subscribe(value => {
      this.language = value;
      this.sharedService.setTitle(LanguagePack[this.language]['title'])
    })
    this.sharedService.profile.subscribe(value => {
      this.profile = value;
    })
    this.sharedService.user.subscribe(value => {
      this.user = value;
      this.getGames()
    })
  }
}
