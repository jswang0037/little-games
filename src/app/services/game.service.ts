import { FirestoreService, GeneralAttr, IdAttr, Tables } from './firestore.service';

import { Injectable } from '@angular/core';
import { UserAttr } from './user.service';

export enum GameType {
  Many = 'Many'
}
export enum GameName {
  CountDown = 'CountDown',
}
export enum GameStatus {
  Waiting = 'Waiting',
  Playing = 'Playing',
  Finished = 'Finished',
}
export interface GameResult {
  player: UserAttr;
  value: number;
}
export interface CountDownConfig{
  target: number;
}
export interface GameCreateAttr {
  type: GameType
  name: GameName;
  status: GameStatus;
  adminId: string;
  players: UserAttr[];
  results: GameResult[];
  config: CountDownConfig;
}
export type GameAttr = GameCreateAttr & GeneralAttr & IdAttr;

@Injectable({
  providedIn: 'root'
})
export class GameService {
  constructor(
    private firestoreService: FirestoreService
  ) { }

  async createGame(gameCreateAttr: GameCreateAttr): Promise<string> {
    return await this.firestoreService.addData(Tables.Game, gameCreateAttr);
  }
  async getGameById(id: string): Promise<GameCreateAttr | undefined> {
    return await this.firestoreService.getDataById(Tables.Game, id);
  }
  async updateGame(id: string, gameAttr: Partial<GameCreateAttr>): Promise<void> {
    await this.firestoreService.updateData(Tables.Game, id, gameAttr)
  }
  async addPlayerToGame(id: string, player: UserAttr): Promise<void> {
    const game = await this.getGameById(id);
    if(game){
      if(!game.players){
        game.players = [];
      }
      game.players.push(player);
      await this.firestoreService.updateData(Tables.Game, id, game);
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
    const game = await this.getGameById(id);
    if(game){
      if(!game.results){
        game.results = [];
      }
      game.results.push(result);
      await this.firestoreService.updateData(Tables.Game, id, game);
    }
  }
  async removeResultFromGame(id: string, result: GameResult): Promise<void> {
    const game = await this.getGameById(id);
    if(game){
      game.results = game.results.filter(r => r.player.id !== result.player.id);
      await this.firestoreService.updateData(Tables.Game, id, game);
    }
  }
}
