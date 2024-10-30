import { Component, OnInit } from '@angular/core';
import { CountDownConfig, GameCreateAttr, GameName, GameService, GameStatus, GameType } from 'src/app/services/game.service';

import { LanguagePack } from 'src/app/i18n';
import { Liff } from '@line/liff';
import { Profile } from '@liff/get-profile';
import { SharedService } from 'src/app/services/shared.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit{
  constructor(
    private sharedService: SharedService,
    private gameService: GameService,
    private userService: UserService

  ){}

  liffClient!: Liff | undefined;
  profile!: Profile | undefined;
  language!: string;
  languagePack = LanguagePack;
  isCreating = false;

  async createGame(){
    if(!this.profile){
      return
    }

    const config: CountDownConfig = {
      target: 10,
    }

    const newGame: GameCreateAttr = {
      type: GameType.Many,
      name: GameName.CountDown,
      status: GameStatus.Waiting,
      adminId: this.profile.userId,
      players: [],
      results: [],
      config: config
    }

    const gameId = await this.gameService.createGame(newGame);
    const user = await this.userService.getUserById(this.profile.userId);
    if(user){
      await this.gameService.addPlayerToGame(gameId, user)
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
  }
}
