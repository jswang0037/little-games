import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { GameComponent } from './game.component';
import { GameService } from '../../services/game.service';
import { SharedService } from '../../services/shared.service';
import { UserAttr } from '../../services/user.service';
// Types from the other service file path, assuming these are the definitive versions
import { GameAttr, GameName, GameStatus, GameResult, InstructionType, ColorChallengeConfig } from '../../../../src/game/game.service';
import { LanguagePack } from 'src/app/i18n'; // For titles, etc.
import { Timestamp } from '@angular/fire/firestore'; 

// Mocks for services
class MockGameService {
  updateGame = jasmine.createSpy('updateGame').and.returnValue(Promise.resolve());
  getGameById = jasmine.createSpy('getGameById').and.returnValue(Promise.resolve(undefined)); 
  subscribeGame = jasmine.createSpy('subscribeGame').and.callFake((gameId, callback) => {
    this.gameSubscriptionCallback = callback;
    return () => {}; 
  });
  gameSubscriptionCallback!: (game: GameAttr | undefined) => void;
  addResultToGame = jasmine.createSpy('addResultToGame').and.returnValue(Promise.resolve());
}

class MockSharedService {
  user = new BehaviorSubject<UserAttr | undefined>(undefined);
  language = new BehaviorSubject<string>('en');
  liffClient = new BehaviorSubject<any | undefined>(undefined); 
  setTitle = jasmine.createSpy('setTitle');
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockActivatedRoute {
  params = of({ gameId: 'test-cc-game-id' }); 
}

describe('GameComponent - Color Challenge', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let mockGameService: MockGameService;
  let mockSharedService: MockSharedService;
  let mockRouter: MockRouter;
  // Helper data
  let currentUser: UserAttr;
  let otherPlayer1: UserAttr;
  let mockColorChallengeGame: GameAttr;

  beforeEach(async () => {
    mockGameService = new MockGameService();
    mockSharedService = new MockSharedService();
    mockRouter = new MockRouter();

    await TestBed.configureTestingModule({
      declarations: [GameComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: new MockActivatedRoute() }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;

    currentUser = {
      id: 'user-current-id', name: 'Current User', imgUrl: 'current.jpg', ready: false,
      created: Timestamp.fromDate(new Date()), modified: Timestamp.fromDate(new Date()),
    };
    otherPlayer1 = {
      id: 'user-other1-id', name: 'Other Player 1', imgUrl: 'other1.jpg', ready: false,
      created: Timestamp.fromDate(new Date()), modified: Timestamp.fromDate(new Date()),
    };

    const initialConfig: ColorChallengeConfig = {
      rounds: 3, timeLimitPerRound: 10, pointCorrect: 100, pointIncorrect: 50, 
      pointFastestBonus: 30, instructionChangePerRound: false,
      initialInstructionType: InstructionType.TextColor,
    };

    mockColorChallengeGame = {
      id: 'test-cc-game-id', name: GameName.COLOR_CHALLENGE, hostId: currentUser.id,
      adminId: currentUser.id, config: initialConfig, players: [currentUser, otherPlayer1],
      playerIds: [currentUser.id, otherPlayer1.id], status: GameStatus.Waiting,
      createdAt: Timestamp.fromDate(new Date()), updatedAt: Timestamp.fromDate(new Date()),
      results: [], round: 0,
      currentInstructionTypeDisplay: undefined, textToDisplay: undefined,
      textColorCss: undefined, colorOptionsCss: undefined,
    };
    
    mockSharedService.user.next(currentUser);
    mockSharedService.language.next('en');
    component.languagePack = LanguagePack; 

    spyOn(Math, 'random').and.returnValue(0.4); 
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('gameStart() for Color Challenge', () => {
    beforeEach(() => {
      component.game = JSON.parse(JSON.stringify(mockColorChallengeGame)); 
      component.game.status = GameStatus.Start; 
      spyOn(component, 'startNextRound').and.callThrough(); 
      component.user = currentUser;
      mockSharedService.user.next(currentUser);
    });

    it('should initialize player scores in game.results to 0', () => {
      component.gameStart();
      expect(component.game.results.length).toBe(component.game.players.length);
      component.game.results.forEach(result => {
        expect(result.score).toBe(0);
      });
    });

    it('should set game.round to 1', () => {
      component.gameStart();
      expect(component.game.round).toBe(1);
    });

    it('should call startNextRound()', () => {
      component.gameStart();
      expect(component.startNextRound).toHaveBeenCalled();
    });
  });

  describe('startNextRound() for Color Challenge', () => {
    beforeEach(() => {
      component.game = JSON.parse(JSON.stringify(mockColorChallengeGame));
      component.game.status = GameStatus.Playing; 
      component.game.round = 1;
      component.game.results = component.game.players.map(p => ({ playerId: p.id, score: 0, player: p }));
      spyOn(window, 'setInterval').and.returnValue(12345 as any); 
      spyOn(window, 'clearInterval').and.callThrough();
    });

    it('should set game status to Playing and update Firestore', () => {
      component.startNextRound();
      expect(component.game.status).toBe(GameStatus.Playing);
      expect(mockGameService.updateGame).toHaveBeenCalledWith(component.game.id, jasmine.objectContaining({ status: GameStatus.Playing }));
    });
    
    it('should generate textToDisplay, textColor, colorOptions, and include correctAnswer in options', () => {
      component.startNextRound();
      expect(component.textToDisplay).not.toBe('');
      expect(component.textColor).not.toBe('');
      expect(component.colorOptions.length).toBe(4); 
      expect(component.colorOptions).toContain(component.correctAnswer);
    });

    it('should determine correctAnswer based on TextColor instruction (fixed initial type)', () => {
      (component.game.config as ColorChallengeConfig).initialInstructionType = InstructionType.TextColor;
      (component.game.config as ColorChallengeConfig).instructionChangePerRound = false;
      component.startNextRound();
      expect(component.currentInstructionType).toBe(InstructionType.TextColor);
      expect(component.correctAnswer).toBe(component.textColor);
    });

    it('should determine correctAnswer based on TextMeaning instruction (fixed initial type)', () => {
      (component.game.config as ColorChallengeConfig).initialInstructionType = InstructionType.TextMeaning;
      (component.game.config as ColorChallengeConfig).instructionChangePerRound = false;
      component.startNextRound();
      expect(component.currentInstructionType).toBe(InstructionType.TextMeaning);
      expect(component.correctAnswer).toBe(component.colorMapDisplayToCss[component.textToDisplay]);
    });

    it('should change instruction type if instructionChangePerRound is true across rounds', () => {
        (component.game.config as ColorChallengeConfig).instructionChangePerRound = true;
        // Force different outcomes for Math.random to ensure instruction type changes
        const randomSpy = Math.random as jasmine.Spy;
        randomSpy.and.returnValues(0.2, 0.7); // -> TextColor, then TextMeaning (or vice-versa)
        
        component.startNextRound(); // Round 1
        const firstInstruction = component.currentInstructionType;
        
        component.game.round = 2; 
        component.startNextRound(); // Round 2
        const secondInstruction = component.currentInstructionType;

        expect(firstInstruction).not.toBe(secondInstruction);
    });
    
    it('should set roundTimeRemaining from config and start interval', () => {
      component.startNextRound();
      const config = component.game.config as ColorChallengeConfig;
      expect(component.roundTimeRemaining).toBe(config.timeLimitPerRound);
      expect(window.setInterval).toHaveBeenCalledWith(jasmine.any(Function), 1000);
    });

    it('should change game status to Finished if max rounds are reached', () => {
      const config = component.game.config as ColorChallengeConfig;
      component.game.round = config.rounds + 1; 
      component.startNextRound();
      expect(component.game.status).toBe(GameStatus.Finished);
      expect(mockGameService.updateGame).toHaveBeenCalledWith(component.game.id, jasmine.objectContaining({ status: GameStatus.Finished }));
    });

    it('should clear previous roundInterval if one exists', () => {
      component.roundInterval = window.setInterval(() => {}, 1000) as any; 
      component.startNextRound(); 
      expect(window.clearInterval).toHaveBeenCalledWith(component.roundInterval);
    });
  });

  describe('logPlayerResult() for Color Challenge', () => {
    beforeEach(() => {
      component.game = JSON.parse(JSON.stringify(mockColorChallengeGame));
      component.game.status = GameStatus.Playing;
      component.game.round = 1;
      component.user = currentUser; 
      mockSharedService.user.next(currentUser); 
      component.game.results = component.game.players.map(p => ({ playerId: p.id, score: 0, player: p }));
      component.startNextRound(); 
      spyOn(component, 'endRound').and.callThrough(); 
    });

    it('should record correct choice in playerRoundData and mark as answered', () => {
      const correctChoice = component.correctAnswer;
      component.logPlayerResult(correctChoice);
      const playerData = component.playerRoundData.get(currentUser.id);
      expect(playerData).toBeDefined();
      expect(playerData?.correct).toBeTrue();
      expect(playerData?.choice).toBe(correctChoice);
      expect(component.playerRoundData.has(currentUser.id)).toBeTrue();
    });

    it('should record incorrect choice in playerRoundData', () => {
      const incorrectChoice = component.colorOptions.find(opt => opt !== component.correctAnswer)!;
      component.logPlayerResult(incorrectChoice);
      const playerData = component.playerRoundData.get(currentUser.id);
      expect(playerData).toBeDefined();
      expect(playerData?.correct).toBeFalse();
      expect(playerData?.choice).toBe(incorrectChoice);
    });

    it('should not allow a player to answer twice in the same round', () => {
      component.logPlayerResult(component.correctAnswer); 
      const firstAnswerData = {...component.playerRoundData.get(currentUser.id)!};
      const differentChoice = component.colorOptions.find(opt => opt !== component.correctAnswer) || component.cssColors[0];
      component.logPlayerResult(differentChoice); 
      const secondAnswerData = component.playerRoundData.get(currentUser.id)!;
      expect(secondAnswerData.choice).toBe(firstAnswerData.choice);
    });

    it('should call endRound() if all players have answered', () => {
      component.logPlayerResult(component.correctAnswer); 
      component.user = otherPlayer1; 
      mockSharedService.user.next(otherPlayer1); 
      component.logPlayerResult(component.correctAnswer); 
      expect(component.endRound).toHaveBeenCalled();
    });

     it('should not call endRound() if not all players have answered', () => {
      component.logPlayerResult(component.correctAnswer); 
      expect(component.endRound).not.toHaveBeenCalled();
    });
  });

  describe('endRound() for Color Challenge', () => {
    let config: ColorChallengeConfig;
    beforeEach(() => {
      component.game = JSON.parse(JSON.stringify(mockColorChallengeGame));
      config = component.game.config as ColorChallengeConfig;
      component.game.status = GameStatus.Playing; 
      component.game.round = 1;
      component.user = currentUser; 
      mockSharedService.user.next(currentUser);
      component.game.results = component.game.players.map(p => ({ playerId: p.id, score: 0, player: p }));
      component.correctAnswer = 'red'; 
      component.playerRoundData.set(currentUser.id, { choice: 'red', time: config.timeLimitPerRound - 2, correct: true });
      component.playerRoundData.set(otherPlayer1.id, { choice: 'blue', time: config.timeLimitPerRound - 5, correct: false });
      spyOn(component, 'proceedToNextRoundOrFinish').and.callThrough();
      spyOn(window, 'clearInterval').and.callThrough(); 
      spyOn(window, 'setTimeout').and.callFake((cb: Function) => cb() as any); 
    });

    it('should set game status to Calculating', () => {
      component.endRound();
      expect(component.game.status).toBe(GameStatus.Calculating);
    });

    it('should clear the roundInterval', () => {
      component.roundInterval = setInterval(()=>{},1000) as any; 
      component.endRound();
      expect(window.clearInterval).toHaveBeenCalledWith(component.roundInterval);
    });

    it('should calculate scores correctly (correct/incorrect points)', () => {
      component.endRound();
      const userResult = component.game.results.find(r => r.playerId === currentUser.id);
      const otherPlayerResult = component.game.results.find(r => r.playerId === otherPlayer1.id);
      expect(userResult?.score).toBe(config.pointCorrect); 
      expect(otherPlayerResult?.score).toBe(0 - config.pointIncorrect); 
    });

    it('should award fastest bonus correctly to the single fastest correct player', () => {
      const slowerCorrectPlayer: UserAttr = { id: 'user-slower-id', name: 'Slower Correct', imgUrl: '', ready: true, created: Timestamp.now(), modified: Timestamp.now() };
      component.game.players.push(slowerCorrectPlayer);
      component.game.results.push({ playerId: slowerCorrectPlayer.id, score: 0, player: slowerCorrectPlayer });
      component.playerRoundData.set(slowerCorrectPlayer.id, { choice: 'red', time: config.timeLimitPerRound - 4, correct: true });
      component.endRound();
      const currentUserScore = component.game.results.find(r => r.playerId === currentUser.id)?.score;
      const slowerCorrectPlayerScore = component.game.results.find(r => r.playerId === slowerCorrectPlayer.id)?.score;
      expect(currentUserScore).toBe(config.pointCorrect + config.pointFastestBonus);
      expect(slowerCorrectPlayerScore).toBe(config.pointCorrect);
    });

    it('should update game.results and call gameService.updateGame', () => {
      component.endRound();
      expect(mockGameService.updateGame).toHaveBeenCalledWith(component.game.id, jasmine.objectContaining({
        status: GameStatus.Calculating,
        results: component.game.results
      }));
    });

    it('should call proceedToNextRoundOrFinish if current user is admin', () => {
      component.endRound(); 
      expect(component.proceedToNextRoundOrFinish).toHaveBeenCalled();
    });

    it('should NOT call proceedToNextRoundOrFinish if current user is not admin', () => {
      component.user = otherPlayer1; 
      mockSharedService.user.next(otherPlayer1);
      component.endRound();
      expect(component.proceedToNextRoundOrFinish).not.toHaveBeenCalled();
    });
  });

  describe('proceedToNextRoundOrFinish() for Color Challenge', () => {
    beforeEach(() => {
      component.game = JSON.parse(JSON.stringify(mockColorChallengeGame));
      component.user = currentUser; 
      mockSharedService.user.next(currentUser);
      component.game.status = GameStatus.Calculating; 
      spyOn(component, 'startNextRound').and.callThrough();
    });

    it('should increment game.round and call startNextRound() if not the last round', () => {
      component.game.round = 1;
      (component.game.config as ColorChallengeConfig).rounds = 3;
      component.proceedToNextRoundOrFinish();
      expect(component.game.round).toBe(2);
      expect(component.startNextRound).toHaveBeenCalled();
    });

    it('should set game status to Finished if it is the last round', () => {
      const config = component.game.config as ColorChallengeConfig;
      component.game.round = config.rounds; 
      component.proceedToNextRoundOrFinish();
      expect(component.game.status).toBe(GameStatus.Finished);
      expect(mockGameService.updateGame).toHaveBeenCalledWith(component.game.id, jasmine.objectContaining({ status: GameStatus.Finished }));
      expect(component.startNextRound).not.toHaveBeenCalled();
    });

    it('should not do anything if user is not admin', () => {
       component.user = otherPlayer1; 
       mockSharedService.user.next(otherPlayer1);
       component.game.round = 1;
       component.proceedToNextRoundOrFinish();
       expect(component.game.round).toBe(1); 
       expect(component.startNextRound).not.toHaveBeenCalled();
       const finishedCall = mockGameService.updateGame.calls.all().find(call => call.args[1].status === GameStatus.Finished);
       expect(finishedCall).toBeUndefined();
    });
  });

  describe('restart() for Color Challenge', () => {
    beforeEach(() => {
      component.game = JSON.parse(JSON.stringify(mockColorChallengeGame));
      component.game.status = GameStatus.Finished; 
      component.game.round = (component.game.config as ColorChallengeConfig).rounds;
      component.game.results = [ {playerId: currentUser.id, score: 100, player: currentUser}, {playerId: otherPlayer1.id, score: 50, player: otherPlayer1}];
      component.playerRoundData.set(currentUser.id, { choice: 'red', time: 5, correct: true }); 
    });

    it('should reset game.round to 0', () => {
      component.restart();
      expect(component.game.round).toBe(0);
    });

    it('should clear game.results', () => {
      component.restart();
      expect(component.game.results.length).toBe(0);
    });
    
    it('should clear playerRoundData', () => {
      component.restart();
      expect(component.playerRoundData.size).toBe(0);
    });

    it('should set game status to Start and update game service', () => {
      component.restart();
      expect(component.game.status).toBe(GameStatus.Start);
      expect(mockGameService.updateGame).toHaveBeenCalledWith(component.game.id, jasmine.objectContaining({
        status: GameStatus.Start,
        results: [],
        round: 0
      }));
    });
  });
});
