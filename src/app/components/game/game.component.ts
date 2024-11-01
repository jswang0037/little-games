import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { GameAttr, GameName, GameStatus } from 'src/app/services/game.service';

import { AlertService } from 'src/app/services/alert.service';
import { GameService } from '../../services/game.service';
import { LanguagePack } from 'src/app/i18n';
import { Liff } from '@line/liff';
import { SharedService } from 'src/app/services/shared.service';
import { Timestamp } from '@angular/fire/firestore';
import { UserAttr } from 'src/app/services/user.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit{
  constructor(
    private sharedService: SharedService,
    private route: ActivatedRoute,
    private gameService: GameService,
    private router: Router,
  ){}

  language!: string;
  languagePack = LanguagePack;
  user!: UserAttr | undefined;
  game!: GameAttr | undefined;
  liffClient!: Liff | undefined;
  GameStatus = GameStatus;
  readyUserCount = 0
  host = "https://little-games-a78c1.web.app";
  startTime = 0;
  endTime = 0;
  count = 0;
  interval!: NodeJS.Timeout;
  isLogged = false;
  isReady = false;

  async getGame(gameId: string){
    this.game = await this.gameService.getGameById(gameId);
  }

  subscribeGame(gameId: string){
    this.gameService.subscribeGame(gameId, (g) => {
      this.game = g as GameAttr;

      if(this.game){
        const target = this.game.config.target;
        if(this.game.name == GameName.CountDown){
          this.sharedService.setTitle(LanguagePack[this.language]['game-countdown'])
        }
        if(this.game.status === GameStatus.Waiting){
          this.readyUserCount = this.game.players.filter(p => p.ready).length;
          this.checkUser()
        }
        if(this.game.status === GameStatus.Start){
          this.gameStart()
          this.isLogged = false;
          this.isReady = false;
          this.game.status = GameStatus.Playing;
          this.gameService.updateGame(this.game.id, this.game)
        }
        if(this.game.status === GameStatus.Playing){
          this.checkGame()
        }
        if(this.game.status === GameStatus.Calculating){
          this.game.results.sort((a, b) => Math.abs(a.value - target) - Math.abs(b.value - target));
          this.game.status = GameStatus.Finished;
          this.gameService.updateGame(this.game.id, this.game)
        }
      }else{
        this.router.navigate(['/game-not-found'])
      }
    })
  }

  gameStart(){
    this.startTime = Timestamp.now().toMillis();
    this.interval = setInterval(() => {
      this.count  =  ((Timestamp.now().toMillis() - this.startTime) / 1000);
    }, 1)
  }

  async logPlayerResult(){
    if(this.game && this.user){
      if(this.game.results.find(r => r.player.id === this.user?.id)){
        this.isLogged = true;
      }
      this.endTime = Timestamp.now().toMillis();
      const result = {
        player: this.user,
        value: (this.endTime - this.startTime) / 1000
      }
      await this.gameService.addResultToGame(this.game.id, result)
      this.isLogged = true;
    }
  }

  checkGame(){
    if(this.game){
      if(this.game.status === GameStatus.Playing && this.game.players.length === this.game.results.length){
        this.game.status = GameStatus.Calculating;
        clearInterval(this.interval);
        this.gameService.updateGame(this.game.id, this.game)
      }
    }
  }

  async checkUser(){
    if(this.game && this.user){
      this.isReady = this.game.players.find(p => (p.id === this.user?.id && p.ready))? true : false;
      if(this.user.created.toMillis() == this.user.modified.toMillis()){
        return
      }
      if(!this.game.players.find(p => p.id === this.user?.id)){
        if(this.game.status === GameStatus.Waiting){
          await this.gameService.addPlayerToGame(this.game.id, this.user)
        }else{
          console.error("Game is not waiting")
        }
      }
    }else{
      console.error("Game or User Not Found")
    }
  }

  restart(){
    if(this.game){
      this.game.status = GameStatus.Start;
      this.game.results = [];
      this.gameService.updateGame(this.game.id, this.game)
    }
  }

  async ready(){
    if(this.game && this.user){
      this.user.ready = true;
      this.isReady = true;
      await this.gameService.updatePlayerInGame(this.game.id, this.user)
    }else{
      console.error("Game or User Not Found")
    }
  }

  async sendInvitation(game: GameAttr){
    if (!this.liffClient) {
      return
    }

    const eventUri = await this.liffClient.permanentLink.createUrlBy(`${this.host}/game/${game.id}`);
    this.liffClient
      .shareTargetPicker([
        {
          "type": "text",
          "text": eventUri
        }
      ])
  }

  async start(){
    if(this.game){
      this.game.status = GameStatus.Start;
      await this.gameService.updateGame(this.game.id, this.game)
    }
  }

  ngOnInit(){
    this.sharedService.language.subscribe(value => {
      this.language = value;
      this.sharedService.setTitle(LanguagePack[this.language]['game-countdown'])
    })
    this.sharedService.user.subscribe(value => {
      this.user = value;
      this.checkUser()
    })
    this.sharedService.liffClient.subscribe(value => {
      this.liffClient = value;
    })
    this.route.params.subscribe(async s => {
      const gameId = s['gameId'];
      if(gameId){
        this.subscribeGame(gameId)
      }
    });
  }

}
