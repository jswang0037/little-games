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
        apiKey: "AIzaSyBPXWdWdIWOonMLe5-G4nvtecf_sIfDwl8",
        authDomain: "little-games-a78c1.firebaseapp.com",
        projectId: "little-games-a78c1",
        storageBucket: "little-games-a78c1.firebasestorage.app",
        messagingSenderId: "604049550614",
        appId: "1:604049550614:web:2e911b7ea7b0ed57bef437",
        measurementId: "G-7TGKKYXF3T"
      }
    )),
    provideFirestore(() => getFirestore())
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
