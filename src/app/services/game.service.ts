import { DocumentData, where } from '@angular/fire/firestore';
import { FirestoreService, GeneralAttr, IdAttr, Tables } from './firestore.service';

import { Injectable } from '@angular/core';
import { UserAttr } from './user.service';

export enum GameType {
  Many = 'Many'
}
export enum GameName {
  CountDown = 'game-countdown',
  Bingo = 'game-bingo',
  Majority = 'game-majority',
}
export enum GameStatus {
  Waiting = 'Waiting',
  Start = 'Start',
  Playing = 'Playing',
  Calculating = 'Calculating',
  Finished = 'Finished',
}
export enum Side {
  Left = 'Left',
  Right = 'Right',
}
export interface GameResult {
  player: UserAttr;
  value?: number;
  side?: Side;
  round?: number;
}
export interface SingleTargetConfig{
  target: number;
}
export interface GameCreateAttr {
  type: GameType
  name: GameName;
  status: GameStatus;
  adminId: string;
  playerIds: string[];
  players: UserAttr[];
  results: GameResult[];
  config: SingleTargetConfig;
  round?: number;
}
export type GameAttr = GameCreateAttr & GeneralAttr & IdAttr;

@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(
    private firestoreService: FirestoreService
  ) { }

  subscribeGame(gameId: string, callback: ( x: DocumentData | undefined) => void)
  {
    this.firestoreService.subscribeData(Tables.Game, gameId, callback);
  }

  async createGame(gameCreateAttr: GameCreateAttr): Promise<string> {
    return await this.firestoreService.addData(Tables.Game, gameCreateAttr);
  }
  async getGameById(id: string): Promise<GameAttr | undefined> {
    return await this.firestoreService.getDataById(Tables.Game, id);
  }
  async updateGame(id: string, gameAttr: Partial<GameAttr>): Promise<void> {
    await this.firestoreService.updateData(Tables.Game, id, gameAttr)
  }
  async addPlayerToGame(id: string, player: UserAttr): Promise<void> {
    await this.firestoreService.appendData(Tables.Game, id, 'players', player);
    await this.firestoreService.appendData(Tables.Game, id, 'playerIds', player.id);
  }
  async updatePlayerInGame(id: string, player: UserAttr): Promise<void> {
    const game = await this.getGameById(id);
    if(game){
      game.players.forEach((p, index) => {
        if(p.id === player.id){
          game.players[index] = player;
        }
      })
      await this.updateGame(id, game);
    }else{
      console.error("Game Not Found")
    }
  }
  async removePlayerFromGame(id: string, player: UserAttr): Promise<void> {
    const game = await this.getGameById(id);
    if(game){
      game.players = game.players.filter(p => p.id !== player.id);
      await this.firestoreService.updateData(Tables.Game, id, game);
    }
  }
  async addResultToGame(id: string, result: GameResult): Promise<void> {
    await this.firestoreService.appendData(Tables.Game, id, 'results', result);
  }
  async removeResultFromGame(id: string, result: GameResult): Promise<void> {
    const game = await this.getGameById(id);
    if(game){
      game.results = game.results.filter(r => r.player.id !== result.player.id);
      await this.firestoreService.updateData(Tables.Game, id, game);
    }
  }
  async getGamesIncludeUser(playerId: string): Promise<GameAttr[]> {
    return await this.firestoreService.getDocumentsByQuery(Tables.Game, [where('playerIds', 'array-contains', playerId)]);
  }
}
