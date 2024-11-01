import { RouterModule, Routes } from '@angular/router';

import { GameComponent } from './components/game/game.component';
import { GameNotFoundComponent } from './components/game-not-found/game-not-found.component';
import { MainComponent } from './components/main/main.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: MainComponent
  },
  {
    path: 'game/:gameId',
    component: GameComponent
  },
  {
    path: 'game-not-found',
    component: GameNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
