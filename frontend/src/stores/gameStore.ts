/**
 * Global game state management using Zustand
 * Handles player data, UI state, and game settings
 */

import { create } from 'zustand';

export interface Player {
  id: number;
  name: string;
  level: number;
  experience: number;
  health: number;
  healthMax: number;
  mana: number;
  manaMax: number;
  gold: number;
  gems: number;
}

export interface Character {
  id: number;
  name: string;
  characterClass: string;
  level: number;
  experience: number;
  stats: {
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
  };
}

export interface GameState {
  // Authentication
  isAuthenticated: boolean;
  authToken: string | null;
  
  // Player data
  player: Player | null;
  currentCharacter: Character | null;
  
  // UI state
  isLoading: boolean;
  currentScene: string;
  previousScene: string | null;
  showInventory: boolean;
  showCharacterSheet: boolean;
  showGuildPanel: boolean;
  
  // Network
  isConnected: boolean;
  websocket: WebSocket | null;
  
  // Game settings
  soundEnabled: boolean;
  musicEnabled: boolean;
  
  // Actions
  setPlayer: (player: Player) => void;
  setCharacter: (character: Character) => void;
  setLoading: (loading: boolean) => void;
  setScene: (scene: string) => void;
  setPreviousScene: (scene: string) => void;
  toggleInventory: () => void;
  toggleCharacterSheet: () => void;
  toggleGuildPanel: () => void;
  setWebSocket: (ws: WebSocket | null) => void;
  setConnected: (connected: boolean) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  authToken: null,
  player: null,
  currentCharacter: null,
  isLoading: true,
  currentScene: 'boot',
  previousScene: null,
  showInventory: false,
  showCharacterSheet: false,
  showGuildPanel: false,
  isConnected: false,
  websocket: null,
  soundEnabled: true,
  musicEnabled: true,
  
  // Actions
  setPlayer: (player) => set({ player }),
  setCharacter: (character) => set({ currentCharacter: character }),
  setLoading: (loading) => set({ isLoading: loading }),
  setScene: (scene) => set((state) => ({ 
    previousScene: state.currentScene, 
    currentScene: scene 
  })),
  setPreviousScene: (scene) => set({ previousScene: scene }),
  toggleInventory: () => set((state) => ({ showInventory: !state.showInventory })),
  toggleCharacterSheet: () => set((state) => ({ showCharacterSheet: !state.showCharacterSheet })),
  toggleGuildPanel: () => set((state) => ({ showGuildPanel: !state.showGuildPanel })),
  setWebSocket: (ws) => set({ websocket: ws }),
  setConnected: (connected) => set({ isConnected: connected }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
}));

// Singleton pattern for accessing store from Phaser scenes
export class GameStore {
  private static instance: GameStore;
  public store = useGameStore;
  
  static getInstance(): GameStore {
    if (!GameStore.instance) {
      GameStore.instance = new GameStore();
    }
    return GameStore.instance;
  }
  
  getState() {
    return this.store.getState();
  }
  
  subscribe(callback: (state: GameState) => void) {
    return this.store.subscribe(callback);
  }
}
