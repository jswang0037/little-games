import { RouterModule, Routes } from '@angular/router';

import { GameComponent } from './components/game/game.component';
import { GameCreateComponent } from './components/game-create/game-create.component';
import { GameNotFoundComponent } from './components/game-not-found/game-not-found.component';
import { MainComponent } from './components/main/main.component';
import { NgModule } from '@angular/core';
import { UserSettingComponent } from './components/user-setting/user-setting.component';

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
  },
  {
    path: 'create-game',
    component: GameCreateComponent
  },
  {
    path: 'user-setting',
    component: UserSettingComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
