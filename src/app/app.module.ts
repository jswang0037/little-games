import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { MainComponent } from './components/main/main.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { UserComponent } from './components/user/user.component';
import { GameComponent } from './components/game/game.component';
import { GameNotFoundComponent } from './components/game-not-found/game-not-found.component';
import { GameCreateComponent } from './components/game-create/game-create.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    NavBarComponent,
    UserComponent,
    GameComponent,
    GameNotFoundComponent,
    GameCreateComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp({"projectId":"little-games-a78c1","appId":"1:604049550614:web:2e911b7ea7b0ed57bef437","storageBucket":"little-games-a78c1.appspot.com","apiKey":"AIzaSyBPXWdWdIWOonMLe5-G4nvtecf_sIfDwl8","authDomain":"little-games-a78c1.firebaseapp.com","messagingSenderId":"604049550614","measurementId":"G-7TGKKYXF3T"})),
    provideFirestore(() => getFirestore())
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
