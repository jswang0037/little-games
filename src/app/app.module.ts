import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { GameComponent } from './components/game/game.component';
import { GameCreateComponent } from './components/game-create/game-create.component';
import { GameNotFoundComponent } from './components/game-not-found/game-not-found.component';
import { MainComponent } from './components/main/main.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { NgModule } from '@angular/core';
import { UserComponent } from './components/user/user.component';
import { UserSettingComponent } from './components/user-setting/user-setting.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    NavBarComponent,
    UserComponent,
    GameComponent,
    GameNotFoundComponent,
    GameCreateComponent,
    UserSettingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(
      {
        apiKey: "AIzaSyD7drFmFJ0vOqjYjeRtK6mufVAnY_mj1K0",
        authDomain: "little-games-5491a.firebaseapp.com",
        projectId: "little-games-5491a",
        storageBucket: "little-games-5491a.firebasestorage.app",
        messagingSenderId: "714814843570",
        appId: "1:714814843570:web:9f681703e48933b56637ab",
        measurementId: "G-6DMTHF93B8"
      }
    )),
    provideFirestore(() => getFirestore())
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
