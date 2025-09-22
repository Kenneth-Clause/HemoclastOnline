/**
 * DebugConsole - In-game debug console that can't be filtered by browser
 * Enhanced with log levels and filtering capabilities
 */

export type LogLevel = 'VERBOSE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type LogCategory = 'NETWORK' | 'ANIMATION' | 'MOVEMENT' | 'SCENE' | 'PHYSICS' | 'PERFORMANCE' | 'ASSETS' | 'GAMESTATE' | 'INPUT' | 'GENERAL';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  count?: number;
}

export class DebugConsole {
  private static instance: DebugConsole | null = null;
  private container: HTMLDivElement;
  private logArea: HTMLDivElement;
  private inputArea: HTMLInputElement;
  private filterContainer: HTMLDivElement;
  private isVisible: boolean = false;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private currentLogLevel: LogLevel = 'INFO';
  private enabledCategories: Set<LogCategory> = new Set(['SCENE', 'GENERAL', 'GAMESTATE', 'PERFORMANCE']);
  private messageCounters: Map<string, number> = new Map();
  private lastMessages: Map<string, number> = new Map();

  private constructor() {
    this.container = this.createConsoleContainer();
    this.filterContainer = this.createFilterContainer();
    this.logArea = this.createLogArea();
    this.inputArea = this.createInputArea();
    this.setupControls();
    this.setupKeyBindings();
    
    // Append to body
    document.body.appendChild(this.container);
    
    // Override console methods to capture logs
    this.interceptConsoleLogs();
  }

  public static getInstance(): DebugConsole {
    if (!DebugConsole.instance) {
      DebugConsole.instance = new DebugConsole();
    }
    return DebugConsole.instance;
  }

  private createConsoleContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 50%;
      background: rgba(0, 0, 0, 0.95);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      display: none;
      flex-direction: column;
      border-bottom: 2px solid #00ff00;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    `;
    return container;
  }

  private createFilterContainer(): HTMLDivElement {
    const filterContainer = document.createElement('div');
    filterContainer.style.cssText = `
      display: flex;
      gap: 5px;
      padding: 5px 10px;
      background: rgba(0, 0, 0, 0.9);
      border-bottom: 1px solid #00ff00;
      flex-wrap: wrap;
      align-items: center;
    `;

    // Log level selector
    const levelLabel = document.createElement('span');
    levelLabel.textContent = 'Level:';
    levelLabel.style.cssText = 'color: #00ff00; font-size: 11px; margin-right: 5px;';
    
    const levelSelect = document.createElement('select');
    levelSelect.style.cssText = `
      background: #000; color: #00ff00; border: 1px solid #00ff00; 
      font-size: 11px; padding: 2px; margin-right: 10px;
    `;
    ['ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE'].forEach(level => {
      const option = document.createElement('option');
      option.value = level;
      option.textContent = level;
      option.selected = level === this.currentLogLevel;
      levelSelect.appendChild(option);
    });
    levelSelect.addEventListener('change', () => {
      this.currentLogLevel = levelSelect.value as LogLevel;
      this.refreshDisplay();
    });

    // Category filters
    const categoryLabel = document.createElement('span');
    categoryLabel.textContent = 'Categories:';
    categoryLabel.style.cssText = 'color: #00ff00; font-size: 11px; margin-right: 5px;';

    const categories: LogCategory[] = ['NETWORK', 'ANIMATION', 'MOVEMENT', 'SCENE', 'PHYSICS', 'PERFORMANCE', 'ASSETS', 'GAMESTATE', 'INPUT', 'GENERAL'];
    const categoryCheckboxes: HTMLInputElement[] = [];
    
    categories.forEach(category => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = this.enabledCategories.has(category);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.enabledCategories.add(category);
        } else {
          this.enabledCategories.delete(category);
        }
        this.refreshDisplay();
      });
      
      const label = document.createElement('label');
      label.style.cssText = 'color: #00ff00; font-size: 10px; margin-right: 8px; cursor: pointer;';
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(category));
      
      filterContainer.appendChild(label);
      categoryCheckboxes.push(checkbox);
    });

    filterContainer.appendChild(levelLabel);
    filterContainer.appendChild(levelSelect);
    filterContainer.appendChild(categoryLabel);
    this.container.appendChild(filterContainer);
    return filterContainer;
  }

  private createLogArea(): HTMLDivElement {
    const logArea = document.createElement('div');
    logArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: rgba(0, 0, 0, 0.8);
      font-size: 11px;
      line-height: 1.3;
    `;
    this.container.appendChild(logArea);
    return logArea;
  }

  private createInputArea(): HTMLInputElement {
    const inputArea = document.createElement('input');
    inputArea.type = 'text';
    inputArea.placeholder = 'Enter debug command...';
    inputArea.style.cssText = `
      height: 30px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      border: 1px solid #00ff00;
      padding: 5px 10px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      outline: none;
    `;
    
    inputArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.executeCommand(inputArea.value);
        inputArea.value = '';
      }
    });
    
    this.container.appendChild(inputArea);
    return inputArea;
  }

  private setupControls(): void {
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      padding: 5px 10px;
      background: rgba(0, 0, 0, 0.9);
      border-top: 1px solid #00ff00;
    `;

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.style.cssText = `
      background: #ff4444;
      color: white;
      border: none;
      padding: 5px 10px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 11px;
    `;
    clearBtn.addEventListener('click', () => this.clear());

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy All';
    copyBtn.style.cssText = `
      background: #4444ff;
      color: white;
      border: none;
      padding: 5px 10px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 11px;
    `;
    copyBtn.addEventListener('click', () => this.copyToClipboard());

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close (~)';
    closeBtn.style.cssText = `
      background: #666;
      color: white;
      border: none;
      padding: 5px 10px;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 11px;
    `;
    closeBtn.addEventListener('click', () => this.toggle());

    controlsContainer.appendChild(clearBtn);
    controlsContainer.appendChild(copyBtn);
    controlsContainer.appendChild(closeBtn);
    this.container.appendChild(controlsContainer);
  }

  private setupKeyBindings(): void {
    document.addEventListener('keydown', (e) => {
      // Toggle with tilde (~) key
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        this.toggle();
      }
      // Close with Escape when console is open
      else if (e.key === 'Escape' && this.isVisible) {
        e.preventDefault();
        this.hide();
      }
    });
  }

  private interceptConsoleLogs(): void {
    // Don't intercept all console logs - too much spam
    // Only capture specific debug logs manually
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public show(): void {
    this.container.style.display = 'flex';
    this.isVisible = true;
    this.inputArea.focus();
    this.scrollToBottom();
  }

  public hide(): void {
    this.container.style.display = 'none';
    this.isVisible = false;
  }

  public addLog(level: LogLevel, category: LogCategory, message: string, throttleMs?: number): void {
    // Throttling for high-frequency messages
    if (throttleMs) {
      const messageKey = `${category}:${message}`;
      const now = Date.now();
      const lastTime = this.lastMessages.get(messageKey) || 0;
      
      if (now - lastTime < throttleMs) {
        // Update counter for this message
        const count = (this.messageCounters.get(messageKey) || 0) + 1;
        this.messageCounters.set(messageKey, count);
        return; // Skip logging this time
      }
      
      // Reset throttle timer
      this.lastMessages.set(messageKey, now);
      
      // Add count if we've been throttling
      const count = this.messageCounters.get(messageKey);
      if (count && count > 0) {
        message += ` (x${count + 1})`;
        this.messageCounters.delete(messageKey);
      }
    }

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logEntry: LogEntry = {
      timestamp,
      level,
      category,
      message
    };

    this.logs.push(logEntry);

    // Limit log count
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Only add to DOM if it passes current filters
    if (this.shouldShowLog(logEntry)) {
      this.addLogToDOM(logEntry);
    }
    
    // Auto-scroll to bottom
    if (this.isVisible) {
      this.scrollToBottom();
    }
  }

  private shouldShowLog(logEntry: LogEntry): boolean {
    // Check log level
    const levelPriority = { 'VERBOSE': 0, 'DEBUG': 1, 'INFO': 2, 'WARN': 3, 'ERROR': 4 };
    if (levelPriority[logEntry.level] < levelPriority[this.currentLogLevel]) {
      return false;
    }

    // Check category filter
    if (!this.enabledCategories.has(logEntry.category)) {
      return false;
    }

    return true;
  }

  private addLogToDOM(logEntry: LogEntry): void {
    const colorMap: Record<LogLevel, string> = {
      'VERBOSE': '#888888',
      'DEBUG': '#00ff00',
      'INFO': '#00ffff',
      'WARN': '#ffff00',
      'ERROR': '#ff4444'
    };

    const logElement = document.createElement('div');
    logElement.style.cssText = `
      color: ${colorMap[logEntry.level]};
      margin-bottom: 1px;
      font-size: 11px;
    `;
    
    const categoryBadge = `[${logEntry.category}]`;
    logElement.textContent = `[${logEntry.timestamp}] ${categoryBadge} ${logEntry.level}: ${logEntry.message}`;
    
    this.logArea.appendChild(logElement);
  }

  private refreshDisplay(): void {
    // Clear current display
    this.logArea.innerHTML = '';
    
    // Re-add all logs that pass current filters
    this.logs.forEach(logEntry => {
      if (this.shouldShowLog(logEntry)) {
        this.addLogToDOM(logEntry);
      }
    });
    
    this.scrollToBottom();
  }

  // Legacy method for backward compatibility
  public addLogLegacy(type: 'LOG' | 'WARN' | 'ERROR', args: any[]): void {
    const message = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        if (arg.constructor) {
          return `[${arg.constructor.name}]`;
        }
        return '[Object]';
      }
      return String(arg);
    }).join(' ');
    
    const levelMap = { 'LOG': 'INFO', 'WARN': 'WARN', 'ERROR': 'ERROR' } as const;
    this.addLog(levelMap[type], 'GENERAL', message);
  }

  private scrollToBottom(): void {
    this.logArea.scrollTop = this.logArea.scrollHeight;
  }

  public clear(): void {
    this.logs = [];
    this.messageCounters.clear();
    this.lastMessages.clear();
    this.logArea.innerHTML = '';
    this.addLog('INFO', 'GENERAL', '🧹 Debug console cleared');
  }

  public copyToClipboard(): void {
    const allLogs = this.logs.map(log => 
      `[${log.timestamp}] [${log.category}] ${log.level}: ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(allLogs).then(() => {
      this.addLog('INFO', 'GENERAL', '📋 Logs copied to clipboard');
    }).catch(() => {
      this.addLog('ERROR', 'GENERAL', '❌ Failed to copy to clipboard');
    });
  }

  private executeCommand(command: string): void {
    this.addLog('INFO', 'GENERAL', `> ${command}`);
    
    try {
      // Basic debug commands
      switch (command.toLowerCase()) {
        case 'clear':
          this.clear();
          break;
        case 'help':
          this.addLog('INFO', 'GENERAL', 'Available commands: clear, help, scene, character, camera, network, movement, performance, assets, gamestate, input, ui, uihelp, uitest, uidemo');
          break;
        case 'scene':
          // Access scene info if available
          if ((window as any).debugScene) {
            const scene = (window as any).debugScene;
            this.addLog('INFO', 'SCENE', `Scene children: ${scene.children.length}`);
          } else {
            this.addLog('WARN', 'SCENE', 'Scene not available in debug context');
          }
          break;
        case 'character':
          if ((window as any).debugCharacter) {
            const char = (window as any).debugCharacter;
            this.addLog('INFO', 'SCENE', `Character position: ${JSON.stringify(char.getPosition())}`);
          } else {
            this.addLog('WARN', 'SCENE', 'Character not available in debug context');
          }
          break;
        case 'camera':
          if ((window as any).debugCamera) {
            const cam = (window as any).debugCamera;
            this.addLog('INFO', 'SCENE', `Camera position: ${JSON.stringify(cam.position)}`);
          } else {
            this.addLog('WARN', 'SCENE', 'Camera not available in debug context');
          }
          break;
        case 'network':
          this.enabledCategories.add('NETWORK');
          this.currentLogLevel = 'DEBUG';
          this.refreshDisplay();
          this.addLog('INFO', 'GENERAL', 'Network debugging enabled');
          break;
        case 'movement':
          this.enabledCategories.add('MOVEMENT');
          this.currentLogLevel = 'DEBUG';
          this.refreshDisplay();
          this.addLog('INFO', 'GENERAL', 'Movement debugging enabled');
          break;
        case 'performance':
          this.enabledCategories.add('PERFORMANCE');
          this.currentLogLevel = 'DEBUG';
          this.refreshDisplay();
          this.addLog('INFO', 'GENERAL', 'Performance monitoring enabled');
          break;
        case 'assets':
          this.enabledCategories.add('ASSETS');
          this.currentLogLevel = 'DEBUG';
          this.refreshDisplay();
          this.addLog('INFO', 'GENERAL', 'Asset debugging enabled');
          break;
        case 'gamestate':
          this.enabledCategories.add('GAMESTATE');
          this.currentLogLevel = 'DEBUG';
          this.refreshDisplay();
          this.addLog('INFO', 'GENERAL', 'Game state debugging enabled');
          break;
        case 'input':
          this.enabledCategories.add('INPUT');
          this.currentLogLevel = 'DEBUG';
          this.refreshDisplay();
          this.addLog('INFO', 'GENERAL', 'Input debugging enabled');
          break;
        case 'ui':
          this.debugUISystem();
          break;
        case 'uihelp':
          this.showUIHelp();
          break;
        case 'uitest':
          this.testUIComponents();
          break;
        case 'uidemo':
          this.activateUIDemo();
          break;
        default:
          // Try to evaluate as JavaScript
          try {
            const result = eval(command);
            this.addLog('INFO', 'GENERAL', `Result: ${JSON.stringify(result)}`);
          } catch (error) {
            this.addLog('ERROR', 'GENERAL', `Command failed: ${error}`);
          }
      }
    } catch (error) {
      this.addLog('ERROR', 'GENERAL', `Command execution failed: ${error}`);
    }
  }

  // Public static methods for easy logging from external sources
  public static log(level: LogLevel, category: LogCategory, message: string, throttleMs?: number): void {
    const instance = DebugConsole.getInstance();
    instance.addLog(level, category, message, throttleMs);
  }

  public static verbose(category: LogCategory, message: string, throttleMs?: number): void {
    DebugConsole.log('VERBOSE', category, message, throttleMs);
  }

  public static debug(category: LogCategory, message: string, throttleMs?: number): void {
    DebugConsole.log('DEBUG', category, message, throttleMs);
  }

  public static info(category: LogCategory, message: string): void {
    DebugConsole.log('INFO', category, message);
  }

  public static warn(category: LogCategory, message: string): void {
    DebugConsole.log('WARN', category, message);
  }

  public static error(category: LogCategory, message: string): void {
    DebugConsole.log('ERROR', category, message);
  }

  // Legacy method for backward compatibility
  public static logLegacy(type: 'LOG' | 'WARN' | 'ERROR', ...args: any[]): void {
    const instance = DebugConsole.getInstance();
    instance.addLogLegacy(type, args);
  }

  // UI Debug Methods
  private debugUISystem(): void {
    this.addLog('INFO', 'GENERAL', '🎮 UI System Debug Information:');
    
    // Check for UIScene
    const uiScene = (window as any).game?.scene?.getScene('UIScene');
    if (uiScene) {
      this.addLog('INFO', 'GENERAL', `✅ UIScene found - Active: ${uiScene.scene.isActive()}`);
      
      if (uiScene.uiManager) {
        this.addLog('INFO', 'GENERAL', '✅ UIManager found in UIScene');
        this.debugUIManager(uiScene.uiManager);
      } else {
        this.addLog('WARN', 'GENERAL', '⚠️ UIManager not found in UIScene');
      }
    } else {
      this.addLog('WARN', 'GENERAL', '⚠️ UIScene not found');
    }
    
    // Check for Direct UI
    const directUI = (window as any).directUI;
    if (directUI) {
      this.addLog('INFO', 'GENERAL', `✅ Direct UI found - Active: ${directUI.isUIActive()}`);
      
      const uiManager = directUI.getUIManager();
      if (uiManager) {
        this.addLog('INFO', 'GENERAL', '✅ UIManager found in Direct UI');
        this.debugUIManager(uiManager);
      }
    } else {
      this.addLog('WARN', 'GENERAL', '⚠️ Direct UI not found');
    }
    
    // Check for UI Demo
    const uiDemo = (window as any).uiDemo;
    if (uiDemo) {
      this.addLog('INFO', 'GENERAL', '✅ UI Demo found and available');
    } else {
      this.addLog('WARN', 'GENERAL', '⚠️ UI Demo not found');
    }
  }

  private debugUIManager(uiManager: any): void {
    const components = [
      'ActionBar', 'PlayerFrame', 'TargetFrame', 'PartyFrames',
      'Inventory', 'CharacterSheet', 'QuestTracker', 'ChatSystem',
      'GuildPanel', 'FriendsList', 'LootWindow', 'CurrencyTracker',
      'VendorUI', 'DungeonUI', 'CombatUI', 'AchievementPanel', 'DailyTasks'
    ];
    
    components.forEach(component => {
      const getter = `get${component}`;
      if (typeof uiManager[getter] === 'function') {
        const instance = uiManager[getter]();
        const status = instance ? '✅' : '❌';
        this.addLog('INFO', 'GENERAL', `${status} ${component}: ${instance ? 'Loaded' : 'Not loaded'}`);
      }
    });
  }

  private showUIHelp(): void {
    this.addLog('INFO', 'GENERAL', '🎮 UI System Help:');
    this.addLog('INFO', 'GENERAL', '');
    this.addLog('INFO', 'GENERAL', '⌨️ Keyboard Shortcuts:');
    this.addLog('INFO', 'GENERAL', '  F12 - Toggle all UI');
    this.addLog('INFO', 'GENERAL', '  I - Inventory, C - Character Sheet, J - Quest Tracker');
    this.addLog('INFO', 'GENERAL', '  G - Guild Panel, O - Friends List');
    this.addLog('INFO', 'GENERAL', '  Y - Achievements, L - Daily Tasks, V - Vendor');
    this.addLog('INFO', 'GENERAL', '  1-0, Q, E - Action Bar abilities');
    this.addLog('INFO', 'GENERAL', '');
    this.addLog('INFO', 'GENERAL', '🔧 Debug Commands:');
    this.addLog('INFO', 'GENERAL', '  ui - Check UI system status');
    this.addLog('INFO', 'GENERAL', '  uitest - Test all UI components');
    this.addLog('INFO', 'GENERAL', '  uidemo - Activate UI demo');
    this.addLog('INFO', 'GENERAL', '');
    this.addLog('INFO', 'GENERAL', '🎯 Console Commands:');
    this.addLog('INFO', 'GENERAL', '  activateFullUIDemo() - Show complete guide');
    this.addLog('INFO', 'GENERAL', '  uiDemo.triggerActionBarDemo() - Test abilities');
    this.addLog('INFO', 'GENERAL', '  directUI.toggleUI() - Toggle direct UI');
  }

  private testUIComponents(): void {
    this.addLog('INFO', 'GENERAL', '🧪 Testing UI Components...');
    
    // Try to access UI systems
    const directUI = (window as any).directUI;
    const uiDemo = (window as any).uiDemo;
    
    if (directUI && directUI.isUIActive()) {
      this.addLog('INFO', 'GENERAL', '✅ Direct UI is active');
      
      const uiManager = directUI.getUIManager();
      if (uiManager) {
        // Test each component
        const tests = [
          { name: 'ActionBar', method: 'getActionBar' },
          { name: 'PlayerFrame', method: 'getPlayerFrame' },
          { name: 'Inventory', method: 'getInventory' },
          { name: 'CharacterSheet', method: 'getCharacterSheet' },
          { name: 'QuestTracker', method: 'getQuestTracker' },
          { name: 'ChatSystem', method: 'getChatSystem' },
          { name: 'GuildPanel', method: 'getGuildPanel' },
          { name: 'FriendsList', method: 'getFriendsList' }
        ];
        
        tests.forEach(test => {
          try {
            const component = uiManager[test.method]();
            this.addLog('INFO', 'GENERAL', `✅ ${test.name}: ${component ? 'Working' : 'Not found'}`);
          } catch (error) {
            this.addLog('ERROR', 'GENERAL', `❌ ${test.name}: Error - ${error}`);
          }
        });
      }
    } else {
      this.addLog('WARN', 'GENERAL', '⚠️ Direct UI not active - try "uidemo" command');
    }
    
    if (uiDemo) {
      this.addLog('INFO', 'GENERAL', '✅ UI Demo available');
      
      // Trigger a quick test
      try {
        uiDemo.triggerActionBarDemo();
        this.addLog('INFO', 'GENERAL', '✅ Action Bar demo triggered');
      } catch (error) {
        this.addLog('ERROR', 'GENERAL', `❌ Demo test failed: ${error}`);
      }
    } else {
      this.addLog('WARN', 'GENERAL', '⚠️ UI Demo not available');
    }
  }

  private activateUIDemo(): void {
    this.addLog('INFO', 'GENERAL', '🎮 Activating UI Demo...');
    
    // Try direct UI first
    const directUI = (window as any).directUI;
    if (directUI) {
      if (!directUI.isUIActive()) {
        directUI.activate();
        this.addLog('INFO', 'GENERAL', '✅ Direct UI activated');
      } else {
        this.addLog('INFO', 'GENERAL', '✅ Direct UI already active');
      }
    } else {
      // Try to create direct UI
      try {
        const currentScene = (window as any).game?.scene?.scenes?.find((s: any) => s.scene.isActive());
        if (currentScene) {
          this.addLog('INFO', 'GENERAL', `🎯 Creating Direct UI in scene: ${currentScene.constructor.name}`);
          const { createDirectUI } = require('./DirectUIActivation');
          createDirectUI(currentScene);
          this.addLog('INFO', 'GENERAL', '✅ Direct UI created successfully');
        } else {
          this.addLog('ERROR', 'GENERAL', '❌ No active scene found');
        }
      } catch (error) {
        this.addLog('ERROR', 'GENERAL', `❌ Failed to create Direct UI: ${error}`);
      }
    }
    
    // Activate demo functions
    this.time.delayedCall(1000, () => {
      const guide = (window as any).activateFullUIDemo;
      if (guide) {
        guide();
        this.addLog('INFO', 'GENERAL', '✅ UI guide activated');
      }
      
      const demo = (window as any).uiDemo;
      if (demo) {
        demo.triggerActionBarDemo();
        this.addLog('INFO', 'GENERAL', '✅ UI demo triggered');
      }
    });
  }

  // Add timer reference for delayed calls
  private time = {
    delayedCall: (delay: number, callback: () => void) => {
      setTimeout(callback, delay);
    }
  };
}
