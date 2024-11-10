import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { GameAttr, GameName, GameStatus } from 'src/app/services/game.service';

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
  GameName = GameName;
  readyUserCount = 0
  host = "https://little-games-5491a.web.app";
  startTime = 0;
  endTime = 0;
  count = 0;
  resultCount = 0;
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
        this.checkUser()
        const target = this.game.config.target;
        if(this.game.name == GameName.CountDown){
          this.sharedService.setTitle(LanguagePack[this.language]['game-countdown'])
        }
        if(this.game.status === GameStatus.Waiting){
          this.readyUserCount = this.game.players.filter(p => p.ready).length;
        }
        if(this.game.status === GameStatus.Start){
          this.gameStart()
          this.game.status = GameStatus.Playing;
          this.gameService.updateGame(this.game.id, this.game)
        }
        if(this.game.status === GameStatus.Playing){
          this.checkGame()
        }
        if(this.game.status === GameStatus.Calculating){
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.game.results.sort((a, b) => Math.abs(a.value! - target) - Math.abs(b.value! - target));
          this.game.status = GameStatus.Finished;
          this.gameService.updateGame(this.game.id, this.game)
        }
      }else{
        this.router.navigate(['/game-not-found'])
      }
    })
  }

  gameStart(){
    if(this.game){
      if(this.game.name === GameName.CountDown){
        this.isLogged = false;
        this.isReady = false;
        this.startTime = Timestamp.now().toMillis();
        this.interval = setInterval(() => {
          this.count  =  ((Timestamp.now().toMillis() - this.startTime) / 1000);
        }, 1)
      }else if(this.game.name === GameName.Majority){
        this.game.round = 1;
        this.gameService.updateGame(this.game.id, this.game)
      }
    }
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
    if(this.game && this.game.status === GameStatus.Playing){
      if(this.game.name === GameName.CountDown){
        this.resultCount = this.game.results.length;
        if(this.game.players.length === this.game.results.length){
          clearInterval(this.interval);
          this.game.status = GameStatus.Calculating;
          this.gameService.updateGame(this.game.id, this.game)
        }
      }
    }
  }

  async checkUser(){
    if(this.game && this.user){
      const userId = this.user.id;
      const userIsInGame = this.game.players.find(p => p.id === userId)? true : false;

      if(this.game.status === GameStatus.Waiting){
        if(userIsInGame){
          this.isReady = this.game.players.find(p => (p.id === this.user?.id && p.ready))? true : false;
        }else{
          if(this.user.created.toMillis() !== this.user.modified.toMillis()){
            await this.gameService.addPlayerToGame(this.game.id, this.user)
          }
        }
      }else if(this.game.status === GameStatus.Playing){
        if(userIsInGame){
          const userLoggedResult = this.game.results.find(p => p.player.id === userId)? true : false;
          if(userLoggedResult){
            this.isLogged = true;
          }else{
            this.gameStart();
          }
        }else{
          this.router.navigate(['/']);
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
      if(this.user){
        this.checkUser()
      }
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
