import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Liff } from '@line/liff';

// Updated import: Removed GeneralKnowledgeConfig, GameName might come from a different path if the previous one was an error
import { GameCreateAttr, GameName, ColorChallengeConfig } from '../../../../src/game/game.service'; 
import { GameService } from '../../services/game.service';
import { HtmlService } from '../../services/html.service';
import { LanguagePack } from '../../i18n';
import { SharedService } from '../../services/shared.service';
import { UserAttr } from '../../services/user.service';

@Component({
  selector: 'app-game-create',
  templateUrl: './game-create.component.html',
  styleUrls: ['./game-create.component.scss']
})
export class GameCreateComponent implements OnInit {
  liffClient!: Liff | undefined;
  language!: string;
  languagePack = LanguagePack;
  isCreating = false;
  user!: UserAttr | undefined;

  GameName = GameName; // Expose GameName enum to the template
  selectedGameName: GameName = GameName.COLOR_CHALLENGE; // Default to ColorChallenge
  configIsValid = false;

  // Default configurations
  defaultConfigs = {
    [GameName.COLOR_CHALLENGE]: {
      rounds: 10,
      timeLimitPerRound: 30,
      pointCorrect: 100,
      pointIncorrect: -50,
      pointFastestBonus: 50,
      instructionChangePerRound: true,
      initialInstructionType: 'text',
    } as ColorChallengeConfig,
  };

  // Current config, to be bound to form inputs
  currentConfig: ColorChallengeConfig;

  constructor(
    private sharedService: SharedService,
    private gameService: GameService,
    private htmlService: HtmlService,
    private router: Router
  ) {
    // Initialize with ColorChallenge config
    this.currentConfig = { ...this.defaultConfigs[GameName.COLOR_CHALLENGE] };
  }

  ngOnInit() {
    this.sharedService.user.subscribe(value => {
      this.user = value;
    });
    this.sharedService.language.subscribe(value => {
      this.language = value;
      this.sharedService.setTitle(LanguagePack[this.language]['title']);
    });
    // Set initial game type and validate
    this.onGameTypeChange(); // Will set up for COLOR_CHALLENGE
  }

  onGameTypeChange() {
    // This component now focuses on ColorChallenge.
    // If other game types were to be supported, logic to switch would go here.
    // For now, it always assumes/resets to ColorChallenge.
    const gameNameValue = this.htmlService.getInputValue('select-game-name');
    
    // Ensure selectedGameName is correctly typed if coming from select
    let newSelectedGameName: GameName;
    if (gameNameValue === GameName.COLOR_CHALLENGE.toString()) { // Ensure string comparison if needed
        newSelectedGameName = GameName.COLOR_CHALLENGE;
    } else {
        // Fallback or error handling if unexpected value
        // Forcing COLOR_CHALLENGE as per current scope
        newSelectedGameName = GameName.COLOR_CHALLENGE; 
    }

    this.selectedGameName = newSelectedGameName;
    this.currentConfig = { ...this.defaultConfigs[this.selectedGameName] };
    this.validateConfig();
  }
  
  // Getter for easier access in the template, ensuring it's ColorChallengeConfig
  get CCConfig(): ColorChallengeConfig {
    return this.currentConfig;
  }

  validateConfig() {
    this.configIsValid = false;
    if (this.selectedGameName === GameName.COLOR_CHALLENGE) {
      const config = this.currentConfig; // Already typed as ColorChallengeConfig
      this.configIsValid = config.rounds > 0 && 
                           config.timeLimitPerRound > 0 && 
                           config.pointCorrect >= 0 && 
                           config.pointIncorrect <= 0 && // Assuming negative or zero for incorrect
                           config.pointFastestBonus >= 0 &&
                           (config.initialInstructionType === 'text' || config.initialInstructionType === 'color');
    }
    // No other game types to validate in this version
  }

  updateConfigValue(field: keyof ColorChallengeConfig, value: any, isBoolean = false, isNumber = false) {
    // Directly update ColorChallengeConfig
    const config = this.currentConfig;
    if (isBoolean) {
      (config[field] as any) = value === 'true' || value === true;
    } else if (isNumber) {
      (config[field] as any) = Number(value);
    } else {
      (config[field] as any) = value;
    }
    this.validateConfig();
  }

  async createGame() {
    if (!this.user || !this.configIsValid) {
      console.error('User not logged in or config is invalid.');
      return;
    }

    // Ensure the game name is explicitly ColorChallenge for creation
    if (this.selectedGameName !== GameName.COLOR_CHALLENGE) {
        console.error('Invalid game type selected for creation.');
        return;
    }

    const gameToCreate: GameCreateAttr = {
      name: GameName.COLOR_CHALLENGE, // Hardcoded to ColorChallenge
      config: this.currentConfig,
      hostId: this.user.id,
    };

    try {
      this.isCreating = true;
      const game = await this.gameService.createGame(gameToCreate);
      this.router.navigate(['/game', game.id]);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      this.isCreating = false;
    }
  }
}
