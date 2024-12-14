import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { GameAttr, GameName, GameResult, GameStatus, Side } from 'src/app/services/game.service';

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
  host = "https://little-games-a78c1.web.app/";
  startTime = 0;
  endTime = 0;
  count = 0;
  resultCount = 0;
  interval!: NodeJS.Timeout;
  isLogged = false;
  isReady = false;
  isPlaying = false;
  side!: Side | undefined;
  Side = Side;
  leftCount = 0;
  rightCount = 0;
  remainPlayerCount = 0;
  loggedPlayerCount = 0;
  isRemain = true;
  playerResult!: GameResult[];

  async getGame(gameId: string){
    this.game = await this.gameService.getGameById(gameId);
  }

  async deleteGame(game: GameAttr){
    const confirmed = window.confirm(`${LanguagePack[this.language]['delete']}${LanguagePack[this.language]['space']}${LanguagePack[this.language]['this']}${LanguagePack[this.language]['space']}${LanguagePack[this.language]['game']}?`);
    if(!confirmed){
      return
    }
    await this.gameService.deleteGame(game.id)
    this.router.navigate(['/'])
  }

  subscribeGame(gameId: string){
    this.gameService.subscribeGame(gameId, (g) => {
      this.game = g as GameAttr;

      if(this.game){
        this.checkUser()
        if(this.language){
          this.sharedService.setTitle(LanguagePack[this.language][this.game.name])
        }
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
          this.calculateResult();
        }
        if(this.game.status === GameStatus.Finished){
          this.showResult();
        }
      }else{
        this.router.navigate(['/game-not-found'])
      }
    })
  }

  gameStart(){
    if(!this.game){
      return
    }
    if(this.game.name === GameName.CountDown){
      this.isLogged = false;
      this.isReady = false;
      this.isPlaying = true;
      this.startTime = Timestamp.now().toMillis();
      this.interval = setInterval(() => {
        this.count  =  ((Timestamp.now().toMillis() - this.startTime) / 1000);
      }, 1)
    }else if(this.game.name === GameName.Majority){
      this.isLogged = false;
      this.side = undefined;
      this.game.round = 1;
    }
  }

  async logPlayerResult(value = ""){
    if(!(this.game && this.user)){
      return
    }

    if(this.game.name === GameName.CountDown){
      if(this.game.results.find(r => r.player.id === this.user?.id)){
        this.isLogged = true;
        return;
      }
      this.endTime = Timestamp.now().toMillis();
      const result: GameResult = {
        player: this.user,
        value: (this.endTime - this.startTime) / 1000
      }
      await this.gameService.addResultToGame(this.game.id, result)
      this.isLogged = true;
    }else if(this.game.name === GameName.Majority){
      if(!(value==='left' || value==='right')){
        return
      }
      const side = value === 'left' ? Side.Left : Side.Right;
      this.side = side;

      const result: GameResult = {
        player: this.user,
        round: this.game.round,
        side: side
      }
      await this.gameService.addResultToGame(this.game.id, result)
      this.isLogged = true;
    }

  }

  checkGame(){
    if(!this.game){
      return
    }

    if(this.game.status === GameStatus.Playing){
      if(this.game.name === GameName.CountDown){
        this.resultCount = this.game.results.length;
        if(this.game.players.length === this.game.results.length){
          clearInterval(this.interval);
          this.game.status = GameStatus.Calculating;
          this.gameService.updateGame(this.game.id, this.game)
        }
      }else if(this.game.name === GameName.Majority){
        if(!this.game.round){
          return;
        }
        const round = this.game.round;

        this.remainPlayerCount = this.game.playerIds.length;
        this.loggedPlayerCount = this.game.results.filter(r => r.round === round).length;

        // Get Last Majority
        if(round > 1){
          const lastLeftCount = this.game.results.filter(r => r.side === Side.Left && r.round === (round - 1)).length;
          const lastRightCount = this.game.results.filter(r => r.side === Side.Right && r.round === (round- 1)).length;
          const lastMajorityCount = lastLeftCount >= lastRightCount ? lastLeftCount : lastRightCount;
          this.remainPlayerCount = lastLeftCount === lastRightCount? (lastLeftCount + lastRightCount) : lastMajorityCount;
        }

        // Get Current Status
        const leftCount = this.game.results.filter(r => r.side === Side.Left && r.round === round).length;
        const rightCount = this.game.results.filter(r => r.side === Side.Right && r.round === round).length;
        if(leftCount + rightCount === this.remainPlayerCount){
          this.leftCount = leftCount;
          this.rightCount = rightCount;
          this.game.status = GameStatus.Calculating;
          this.gameService.updateGame(this.game.id, this.game)
        }

      }
    }
  }

  async checkUser(){
    if(!(this.game && this.user)){
      return
    }

    const userId = this.user.id;
    const userIsInGame = this.game.playerIds.includes(userId);

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
        if(this.game.name === GameName.CountDown){
          const userLoggedResult = this.game.results.find(p => p.player.id === userId)? true : false;
          if(userLoggedResult){
            this.isLogged = true;
          }else{
            if(!this.isPlaying){
              this.gameStart();
            }
          }
        }else if(this.game.name === GameName.Majority){
          const userLoggedResult = this.game.results.find(p => p.player.id === userId && p.round === this.game?.round);
          if(userLoggedResult){
            this.isLogged = true;
            this.side = userLoggedResult.side!;
          }

          if(!this.game.round){
            return;
          }

          const round = this.game.round;

          // Get Last Majority
          if(round > 1){
            const lastLeftCount = this.game.results.filter(r => r.side === Side.Left && r.round === (round - 1)).length;
            const lastRightCount = this.game.results.filter(r => r.side === Side.Right && r.round === (round- 1)).length;
            const lastMajoritySide = lastLeftCount > lastRightCount? Side.Left : Side.Right;

            const lastSide = this.game.results.find(r => r.player.id === userId && r.round === (round - 1))?.side;

            if(lastSide){
              this.isRemain = lastLeftCount === lastRightCount? true : lastMajoritySide == lastSide;
            }else{
              this.isRemain = false;
            }
          }
        }
      }else{
        console.error('User Not In Game')
        this.router.navigate(['/']);
      }
    }
  }
  calculateResult(){
    if(!(this.game && this.user)){
      return
    }

    const game = this.game;

    if(this.game.name === GameName.CountDown){
      if(this.user.id !== this.game.adminId){
        return
      }
      this.game.status = GameStatus.Finished;
      this.gameService.updateGame(this.game.id, this.game)
    }else if(this.game.name === GameName.Majority){
      if(!this.game.round){
        return;
      }

      this.isLogged = false;
      this.side = undefined;
      const round = this.game.round;
      const leftCount = this.game.results.filter(r => r.side === Side.Left && r.round === round).length;
      const rightCount = this.game.results.filter(r => r.side === Side.Right && r.round === round).length;
      this.leftCount = leftCount;
      this.rightCount = rightCount;
      if(leftCount === rightCount){
        return
      }

      if(this.user.id !== this.game.adminId){
        return
      }
      if(leftCount > rightCount){
        if(leftCount <= this.game.config.target){
          this.game.results.filter(r => r.side === Side.Left && r.round === round).forEach( async _r =>{

            const result: GameResult = {
              player: _r.player,
              round: round + 1,
            }
            await this.gameService.addResultToGame(game.id, result)
          });
          this.game.status = GameStatus.Finished;
          this.gameService.updateGame(this.game.id, this.game)
        }
      }else if(rightCount > leftCount){
        if(rightCount <= this.game.config.target){
          this.game.results.filter(r => r.side === Side.Right && r.round === round).forEach( async _r =>{

            const result: GameResult = {
              player: _r.player,
              round: round + 1,
            }
            await this.gameService.addResultToGame(game.id, result)
          });
          this.game.status = GameStatus.Finished;
          this.gameService.updateGame(this.game.id, this.game)
        }
      }
    }
  }

  showResult(){
    if(!this.game){
      return
    }

    if(this.game.name === GameName.CountDown){
      const target = this.game.config.target
      const res = this.game.results;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      res.sort((a, b) => Math.abs(a.value! - target) - Math.abs(b.value! - target));
      this.playerResult = res;
    }else if(this.game.name === GameName.Majority){
      const userMap = new Map<string, UserAttr>();
      const roundMap = new Map<string, number>();
      this.game.results.forEach( r => {
        userMap.set(r.player.id, r.player);
        const userCount = roundMap.get(r.player.id);
        const round = r.round;
        if(!round){
          return
        }

        if((userCount && round > userCount) || !userCount){
          roundMap.set(r.player.id, round)
        }
      });

      const res: GameResult[] = [];
      userMap.forEach(r => {
        const result: GameResult = {
          player: r,
          round: roundMap.get(r.id)
        }
        res.push(result);
      })
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      res.sort((a, b) => b.round! - a.round!);
      this.playerResult = res;
    }
  }

  nextRound(){
    if(!(this.game && this.user)){
      return
    }

    if(this.user.id !== this.game.adminId){
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.game.round = this.game.round! + 1;
    this.game.status = GameStatus.Playing;
    this.gameService.updateGame(this.game.id, this.game)
  }

  restart(){
    if(!this.game){
      return
    }

    this.game.status = GameStatus.Start;
    this.game.results = [];
    this.gameService.updateGame(this.game.id, this.game)
  }

  async ready(){
    if(!(this.game && this.user)){
      return
    }

    this.user.ready = true;
    this.isReady = true;
    await this.gameService.updatePlayerInGame(this.game.id, this.user)
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
    if(!this.game){
      return
    }

    this.game.status = GameStatus.Start;
    await this.gameService.updateGame(this.game.id, this.game)
  }

  ngOnInit(){
    this.sharedService.language.subscribe(value => {
      this.language = value;
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
