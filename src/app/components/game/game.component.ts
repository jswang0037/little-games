import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
// Assuming GameAttr, GameName, GameResult, GameStatus are from the main service.
// Side might be specific to Majority game.
import { GameAttr, GameName, GameResult, GameStatus, Side } from 'src/app/services/game.service';
// Import ColorChallenge specific types from the other service file path
import { ColorChallengeConfig, InstructionType } from '../../../../src/game/game.service';


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
  GameName = GameName; // This might conflict if GameName in src/game/game.service.ts is different
  InstructionType = InstructionType; // Expose to template
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
  playerResult!: GameResult[]; // Used for displaying final results

  // Color Challenge specific state variables
  currentInstructionType!: InstructionType;
  textToDisplay: string = '';
  textColor: string = 'black'; // CSS color value
  colorOptions: string[] = []; // Array of CSS color values or color names for buttons
  correctAnswer!: string; // CSS color value or color name
  roundTimer: number = 0;
  roundTimeRemaining: number = 0; // To show countdown
  roundInterval!: any;
  // playerScores: Map<string, number> = new Map(); // Store total scores: { playerId: score }
  // Storing scores in game.results directly as per subtask refinement.
  playerRoundData: Map<string, { choice: string, time: number, correct: boolean, details?: string }> = new Map(); // { playerId: { choice, time, correct } }

  // Helper for Color Challenge
  colorMapDisplayToCss: { [key: string]: string } = {
    '紅色': 'red', '藍色': 'blue', '綠色': 'green', '黃色': 'yellow',
    '黑色': 'black', '橙色': 'orange', '紫色': 'purple', '粉色': 'pink'
    // Add more if needed, ensure these keys match i18n for display if buttons show text
  };
  colorDisplayNames: string[] = Object.keys(this.colorMapDisplayToCss);
  cssColors: string[] = Object.values(this.colorMapDisplayToCss);
  cssToDisplayKeyMap: { [cssColor: string]: string } = {}; // For reverse lookup (e.g., 'red' -> '紅色')


  // Helper methods for template
  getColorKeyForLang(cssColor: string): string {
    // Assuming cssColor is 'red', 'blue', etc. and i18n keys are 'color_red', 'color_blue'
    // This method is to get the 'red' part from 'red'. It's just the color itself if it's already simple.
    // If cssColor could be complex (e.g. hex), a more robust mapping to key would be needed.
    // For now, direct use: 'color_' + cssColor
    return cssColor; 
  }

  getDisplayNameForCss(cssColor: string): string {
    return this.cssToDisplayKeyMap[cssColor] || cssColor; // Fallback to cssColor if no display name found
  }


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
    } else if (this.game.name === GameName.COLOR_CHALLENGE) { // Use the imported GameName
      // Ensure GameName.COLOR_CHALLENGE is available from the import
      // This might require merging GameName enums or fixing imports
      // For now, assuming GameName.COLOR_CHALLENGE from 'src/app/services/game.service' will work or be updated
      this.sharedService.setTitle(LanguagePack[this.language]['game-color-challenge'] || 'Color Challenge');
        }
        if(this.game.status === GameStatus.Waiting){
          this.readyUserCount = this.game.players.filter(p => p.ready).length;
        }
        if(this.game.status === GameStatus.Start){
      // Check if this.game.name is indeed COLOR_CHALLENGE from the correct enum
      // This is a potential point of failure if enums are not aligned.
      this.gameStart(); // gameStart will handle initializing based on game.name
      // gameStart for ColorChallenge will set status to Playing and update Firestore.
      // No, gameStart should initialize, then the caller (this block) updates status.
      // However, the original logic for Countdown does this update here.
      // For ColorChallenge, startNextRound will set to Playing.
      // Let's keep it consistent for now: gameStart initializes, then status is set and game updated.
      // But ColorChallenge's gameStart calls startNextRound which itself might set status.
      // Refined: gameStart will call startNextRound. startNextRound sets status to Playing.
      // So, the update here might be redundant or happen too early for CC.
      // Let gameStart() handle its own status updates if needed.
      // For other games:
      if (this.game.name !== GameName.COLOR_CHALLENGE) {
         this.game.status = GameStatus.Playing;
         this.gameService.updateGame(this.game.id, this.game);
      }
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
      if (!this.game.round) this.game.round = 1; // Initialize round if not present
    } else if (this.game.name === GameName.COLOR_CHALLENGE) {
      // Initialization for Color Challenge in gameStart
      // Initialize playerScores for all players to 0.
      // this.playerScores.clear(); // if it's a Map
      // this.game.players.forEach(p => this.playerScores.set(p.id, 0));
      // Scores will be in game.results, so initialize that.
      if (!this.game.results) this.game.results = [];
      this.game.players.forEach(player => {
        const existingResult = this.game.results?.find(r => r.playerId === player.id);
        if (!existingResult) {
          this.game.results?.push({ playerId: player.id, score: 0, player: player }); // Add player object if GameResult expects it
        } else {
          existingResult.score = 0; // Reset score
        }
      });

      if (!this.game.round) this.game.round = 1; // Reset round number
      // Firestore update for these initializations will be handled by startNextRound or gameStart caller.
      // Call a new method startNextRound() to begin the first round.
      // This call should ideally be triggered by admin starting game or auto-start.
      // For now, placing it here means it starts as soon as game.status is Start.
      this.startNextRound(); // This will also update the game on Firestore
    }
  }

  async logPlayerResult(value: string){ // value is the chosen color name (e.g., '紅色') or CSS color
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
      if(!(value==='left' || value==='right')){ // Ensure value is 'left' or 'right' for Majority
        return
      }
      const side = value === 'left' ? Side.Left : Side.Right;
      this.side = side;

      const result: GameResult = {
        // player: this.user, // GameResult from src/game/game.service.ts has playerId: string
        playerId: this.user.id,
        player: this.user, // Keep player object if current GameResult structure uses it
        round: this.game.round,
        side: side,
        // value: undefined // Ensure value is not carried over if GameResult is shared
      }
      await this.gameService.addResultToGame(this.game.id, result) // addResultToGame might need to handle the new GameResult structure
      this.isLogged = true;
    } else if (this.game.name === GameName.COLOR_CHALLENGE && this.user) {
      if (this.playerRoundData.has(this.user.id) || !this.game || this.game.status !== GameStatus.Playing) {
        return; // Already answered or round not active
      }

      const choice = value; // This is the color name (e.g. "紅色") or CSS color string clicked by user
      const timeTaken = this.roundTimer - this.roundTimeRemaining; // Time elapsed or remaining time
      
      let isCorrect = false;
      // The `value` from the button click should be a CSS color.
      // `correctAnswer` is also a CSS color.
      isCorrect = choice === this.correctAnswer;

      this.playerRoundData.set(this.user.id, {
        choice: choice,
        time: this.roundTimeRemaining, // Store remaining time, higher is better for bonus
        correct: isCorrect,
        details: `Instruction: ${this.currentInstructionType}, Text: ${this.textToDisplay} (color ${this.textColor}), Correct: ${this.correctAnswer}, Choice: ${choice}`
      });

      // Visually indicate player has answered (e.g., disable buttons in HTML via a component property)
      // this.currentPlayerAnswered = true; // A new variable for this

      // Check if all online/active players have answered
      // This needs a list of currently active players in the round.
      // For simplicity, using game.players.length for now.
      // A more robust check would be against players who haven't left the game.
      const onlinePlayers = this.game.players.filter(p => this.game?.playerIds.includes(p.id)); // Assuming playerIds are active players
      if (this.playerRoundData.size >= onlinePlayers.length) {
        if (this.roundInterval) clearInterval(this.roundInterval);
        this.endRound();
      }
      // Optional: update Firestore with this player's specific result for the round if needed for real-time display to others.
      // Or batch update in endRound().
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
          const userLoggedResult = this.game.results.find(r => r.playerId === userId || (r.player && r.player.id === userId))? true : false;
          if(userLoggedResult){
            this.isLogged = true;
          }else{
            if(!this.isPlaying){ // isPlaying seems to be a flag for CountDown's timer running
              this.gameStart(); // This will re-initiate the timer for this user
            }
          }
        }else if(this.game.name === GameName.Majority){
          const userLoggedResult = this.game.results.find(r => (r.playerId === userId || (r.player && r.player.id === userId)) && r.round === this.game?.round);
          if(userLoggedResult){
            this.isLogged = true;
            this.side = userLoggedResult.side!;
          }

          if(!this.game.round){ // game.round should be initialized by gameStart for Majority
            return;
          }

          const round = this.game.round;

          // Get Last Majority logic for Majority game
          if(round > 1){
            const lastLeftCount = this.game.results.filter(r => r.side === Side.Left && r.round === (round - 1)).length;
            const lastRightCount = this.game.results.filter(r => r.side === Side.Right && r.round === (round- 1)).length;
            const lastMajoritySide = lastLeftCount > lastRightCount? Side.Left : (lastRightCount > lastLeftCount ? Side.Right : undefined);

            const lastSide = this.game.results.find(r => (r.playerId === userId || (r.player && r.player.id === userId)) && r.round === (round - 1))?.side;

            if(lastSide){
              this.isRemain = !lastMajoritySide || lastMajoritySide === lastSide; // Survive if no clear majority or if on majority side
            }else{
              // If player didn't participate in previous round, they are out unless it was the first round.
              this.isRemain = false; 
            }
          } else {
            this.isRemain = true; // Everyone is 'in' for the first round
          }
        } else if (this.game.name === GameName.COLOR_CHALLENGE) {
          // For Color Challenge, check if user has already submitted for the current round
          if (this.playerRoundData.has(userId)) {
            // Player has submitted, UI should reflect this (e.g., show their answer or a waiting message)
          } else {
            // Player has not submitted, UI should show options.
            // Game state (text, color, options) should be synced from Firestore if it changed.
            // This is generally handled by the subscription, but a manual call might be needed if re-joining.
          }
          // Ensure round timer is running if game is Playing
          if (this.game.status === GameStatus.Playing && !this.roundInterval) {
             // This might happen if a player refreshes. We need to reconstruct the timer.
             // This is complex as server time is the source of truth.
             // For now, assume subscription keeps game.round and config, and startNextRound logic is sufficient.
          }
        }
      }else{
        // User is not in game.playerIds
        console.error('User Not In Game');
        // Allow re-joining if game is Waiting?
        // if (this.game.status === GameStatus.Waiting) { ... logic from above ... }
        // Else, redirect.
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
      this.game.status = GameStatus.Finished; // For Countdown, admin transitions to Finished
      this.gameService.updateGame(this.game.id, this.game);
    }else if(this.game.name === GameName.Majority){
      // Majority game's admin-triggered calculation/transition logic
      if(!this.game.round){
        return;
      }

      this.isLogged = false; // Reset for next round UI
      this.side = undefined; // Reset for next round UI
      const round = this.game.round;
      // Counts are already determined in checkGame if all players logged
      // This part is admin action to proceed
      if(this.user.id !== this.game.adminId){
        return;
      }

      // Determine winners of the round and if game ends
      const { target } = this.game.config as any; // Assuming MajorityConfig has 'target'
      const leftCount = this.game.results.filter(r => r.side === Side.Left && r.round === round).length;
      const rightCount = this.game.results.filter(r => r.side === Side.Right && r.round === round).length;
      
      let majoritySide: Side | undefined = undefined;
      if (leftCount > rightCount) majoritySide = Side.Left;
      else if (rightCount > leftCount) majoritySide = Side.Right;
      // If equal, all current players survive this round.

      let survivorsThisRound: UserAttr[] = [];
      if (majoritySide) {
        survivorsThisRound = this.game.results
          .filter(r => r.side === majoritySide && r.round === round)
          .map(r => r.player);
      } else { // Tie, all who participated in this round survive
        survivorsThisRound = this.game.results
          .filter(r => r.round === round)
          .map(r => r.player);
      }

      // Check if target survivor count is met
      if (survivorsThisRound.length <= target || survivorsThisRound.length === 0 && (leftCount > 0 || rightCount > 0) ) { // Game ends
        this.game.status = GameStatus.Finished;
        // Update results for Majority: mark winners or final survivors
        // This might involve setting a 'winner' flag on their GameResult or storing final round achieved.
      } else {
        // Game continues, setup for next round (handled by nextRound() or similar)
        // Admin will click "Next Round" which calls nextRound()
        // For now, this function simply updates status if game ends.
      }
      this.gameService.updateGame(this.game.id, this.game);

    } else if (this.game.name === GameName.COLOR_CHALLENGE) {
      // For Color Challenge, endRound() does calculations.
      // This function is for admin to manually trigger next step if needed.
      if (this.user?.id === this.game.adminId) {
        this.proceedToNextRoundOrFinish();
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
      res.sort((a, b) => Math.abs(a.value! - target) - Math.abs(b.value! - target)); // value is time diff for Countdown
      this.playerResult = res;
    }else if(this.game.name === GameName.Majority){
      // Majority game's result display logic
      const userMap = new Map<string, UserAttr>();
      const roundMap = new Map<string, number>(); // Max round reached by player
      this.game.results.forEach( r => {
        const player = r.player; // Assuming GameResult has 'player' UserAttr object
        if (!player) return;

        userMap.set(player.id, player);
        const currentMaxRound = roundMap.get(player.id) || 0;
        if (r.round && r.round > currentMaxRound) {
          roundMap.set(player.id, r.round);
        }
      });

      const res: GameResult[] = [];
      userMap.forEach((playerData, playerId) => {
        res.push({
          playerId: playerId,
          player: playerData, // UserAttr
          round: roundMap.get(playerId) || 0, // Max round reached
          // score: roundMap.get(playerId) || 0 // Or use score field for round
        });
      });
      res.sort((a, b) => (b.round ?? 0) - (a.round ?? 0)); // Sort by max round descending
      this.playerResult = res;
    } else if (this.game.name === GameName.COLOR_CHALLENGE) {
      if (!this.game.results) {
        this.playerResult = [];
        return;
      }
      // Sort by score, highest first
      this.playerResult = [...this.game.results].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
  }

  nextRound(){ // This is for Majority Game, triggered by Admin
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

    this.game.status = GameStatus.Start; // Triggers gameStart via subscription
    this.game.results = []; // Clear results for a fresh start
    if (this.game.name === GameName.COLOR_CHALLENGE) {
      this.game.round = 0; // gameStart will set to 1
      // Clear playerRoundData and other CC specific states if necessary
      this.playerRoundData.clear();
      // Player scores are in game.results, which are cleared above.
    } else if (this.game.name === GameName.Majority) {
      this.game.round = 0; // gameStart will set to 1
    }
    // For Countdown, results are just cleared.
    this.gameService.updateGame(this.game.id, this.game);
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

  async start(){ // Admin starts the game from Waiting status
    if(!this.game){
      return
    }

    this.game.status = GameStatus.Start; // This will trigger gameStart() via subscription
    await this.gameService.updateGame(this.game.id, this.game)
  }

  // ===== Color Challenge Core Methods =====

  startNextRound() {
    if (!this.game || this.game.name !== GameName.COLOR_CHALLENGE) return;
    
    const config = this.game.config as ColorChallengeConfig; // Type assertion

    // Check round limit
    // game.round is 1-indexed for display, so check against config.rounds
    if (this.game.round! > config.rounds) {
      this.game.status = GameStatus.Finished;
      this.gameService.updateGame(this.game.id, { status: GameStatus.Finished, round: this.game.round }); // Update Firestore
      this.showResult(); // Display final results
      return;
    }

    this.game.status = GameStatus.Playing;
    this.playerRoundData.clear();
    // this.currentPlayerAnswered = false; // Reset flag if using one

    // Determine currentInstructionType
    if (config.instructionChangePerRound) {
      this.currentInstructionType = Math.random() < 0.5 ? InstructionType.TextColor : InstructionType.TextMeaning;
    } else {
      this.currentInstructionType = config.initialInstructionType;
    }

    // Generate textToDisplay (random color name)
    const randomTextName = this.colorDisplayNames[Math.floor(Math.random() * this.colorDisplayNames.length)];
    this.textToDisplay = randomTextName; // e.g., "紅色"

    // Generate textColor (random CSS color)
    let randomCssColor = this.cssColors[Math.floor(Math.random() * this.cssColors.length)];
    // Ensure textColor is different from the color meaning of textToDisplay to make it tricky
    // (e.g., if textToDisplay is "紅色", textColor should not be 'red')
    while (this.currentInstructionType === InstructionType.TextMeaning && randomCssColor === this.colorMapDisplayToCss[this.textToDisplay]) {
        randomCssColor = this.cssColors[Math.floor(Math.random() * this.cssColors.length)];
    }
    // Or, if currentInstructionType is TextColor, ensure textColor IS NOT the color that textToDisplay means, to avoid ambiguity if that color is an option.
    // This logic can be refined. The goal is to make it non-trivial.
    this.textColor = randomCssColor; // e.g., 'blue'

    // Determine correctAnswer (CSS color value)
    if (this.currentInstructionType === InstructionType.TextColor) {
      this.correctAnswer = this.textColor; // Match the color the text is written in
    } else { // InstructionType.TextMeaning
      this.correctAnswer = this.colorMapDisplayToCss[this.textToDisplay]; // Match the meaning of the text
    }

    // Define colorOptions (array of CSS color values)
    // Must include correctAnswer. Add 3 other random distinct distractors.
    const incorrectOptions = this.cssColors.filter(c => c !== this.correctAnswer);
    // Shuffle incorrectOptions
    for (let i = incorrectOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrectOptions[i], incorrectOptions[j]] = [incorrectOptions[j], incorrectOptions[i]];
    }
    this.colorOptions = [this.correctAnswer, ...incorrectOptions.slice(0, 3)];
    // Shuffle colorOptions so correctAnswer is not always first
    for (let i = this.colorOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.colorOptions[i], this.colorOptions[j]] = [this.colorOptions[j], this.colorOptions[i]];
    }
    
    // Reset and start roundTimer
    this.roundTimer = config.timeLimitPerRound;
    this.roundTimeRemaining = config.timeLimitPerRound;
    if (this.roundInterval) clearInterval(this.roundInterval);
    this.roundInterval = setInterval(() => {
      this.roundTimeRemaining--;
      if (this.roundTimeRemaining <= 0) {
        clearInterval(this.roundInterval);
        this.endRound();
      }
    }, 1000);

    // Update game on Firestore
    // Include all relevant fields for players joining mid-round or refreshing
    this.gameService.updateGame(this.game.id, {
      status: this.game.status,
      round: this.game.round,
      // For client rendering:
      currentInstructionTypeDisplay: this.currentInstructionType, // Store the enum string value
      textToDisplay: this.textToDisplay,
      textColorCss: this.textColor, // Store the CSS value for color
      colorOptionsCss: this.colorOptions, // Store CSS values for buttons
      // correctAnswer is not sent to client during round
    });
  }

  endRound() {
    if (!this.game || this.game.name !== GameName.COLOR_CHALLENGE || this.game.status === GameStatus.Calculating) return;

    this.game.status = GameStatus.Calculating;
    if (this.roundInterval) clearInterval(this.roundInterval);

    const config = this.game.config as ColorChallengeConfig;
    let fastestTime = Infinity;
    let fastestPlayerId: string | null = null;

    this.playerRoundData.forEach((data, playerId) => {
      let scoreChange = 0;
      if (data.correct) {
        scoreChange += config.pointCorrect;
        if (data.time < fastestTime) { // time stored is remaining time, so higher is faster
             // Correction: time stored in playerRoundData is remaining time.
             // So a HIGHER value means faster.
             // Let's assume data.time is remaining seconds.
             // Fastest is player with highest data.time among correct answers.
             // This needs to be re-evaluated. If data.time is time TAKEN, lower is better.
             // The current logPlayerResult stores remaining time. So higher is better.
        }
      } else {
        scoreChange -= config.pointIncorrect; // Subtract if pointIncorrect is positive, effectively add if negative
      }
      
      // Update total score in game.results
      let playerResult = this.game.results?.find(r => r.playerId === playerId);
      if (playerResult) {
        playerResult.score = (playerResult.score ?? 0) + scoreChange;
      } else {
        // Should not happen if gameStart initialized results properly
        this.game.results?.push({ playerId: playerId, score: scoreChange, player: this.game.players.find(p=>p.id === playerId) });
      }
    });
    
    // Bonus for fastest (highest remaining time among correct answers)
    // This needs to iterate again AFTER all base scores are calculated OR find max remaining time during first pass
    this.playerRoundData.forEach((data, playerId) => {
        if (data.correct) {
            if (data.time > (this.playerRoundData.get(fastestPlayerId!)?.time ?? -1) ) { // higher remaining time is faster
                fastestPlayerId = playerId;
            }
        }
    });

    if (fastestPlayerId && config.pointFastestBonus > 0) {
        let fastestPlayerResult = this.game.results?.find(r => r.playerId === fastestPlayerId);
        if (fastestPlayerResult) {
            fastestPlayerResult.score = (fastestPlayerResult.score ?? 0) + config.pointFastestBonus;
        }
    }


    // Update game on Firestore
    this.gameService.updateGame(this.game.id, {
      status: GameStatus.Calculating,
      results: this.game.results,
      // Clear round-specific display fields from game object in Firestore if they were stored there
      currentInstructionTypeDisplay: null, 
      textToDisplay: null,
      textColorCss: null,
      colorOptionsCss: null,
    }).then(() => {
      // After Firestore update, admin proceeds. Others wait.
      if (this.user?.id === this.game?.adminId) {
        setTimeout(() => {
          this.proceedToNextRoundOrFinish();
        }, 3000); // Delay for players to see round summary if any UI for it
      }
    });
  }

  proceedToNextRoundOrFinish() {
    if (!this.game || this.game.name !== GameName.COLOR_CHALLENGE || this.user?.id !== this.game.adminId) return;

    const config = this.game.config as ColorChallengeConfig;
    if (this.game.round! >= config.rounds) {
      this.game.status = GameStatus.Finished;
      // showResult() will be called by the subscription handler when status changes to Finished
      this.gameService.updateGame(this.game.id, { status: GameStatus.Finished, round: this.game.round });
    } else {
      this.game.round!++;
      // status will be set to Playing by startNextRound
      this.startNextRound(); // This will also update Firestore
    }
  }

  // ===== End Color Challenge Core Methods =====

  ngOnInit(){
    // Populate reverse map
    for (const key in this.colorMapDisplayToCss) {
      this.cssToDisplayKeyMap[this.colorMapDisplayToCss[key]] = key;
    }

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
