import { RouterModule, Routes } from '@angular/router';

import { GameComponent } from './components/game/game.component';
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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
