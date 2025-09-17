/**
 * DebugConsole - In-game debug console that can't be filtered by browser
 */

export class DebugConsole {
  private static instance: DebugConsole | null = null;
  private container: HTMLDivElement;
  private logArea: HTMLDivElement;
  private inputArea: HTMLInputElement;
  private isVisible: boolean = false;
  private logs: string[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    this.container = this.createConsoleContainer();
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

  private createLogArea(): HTMLDivElement {
    const logArea = document.createElement('div');
    logArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: rgba(0, 0, 0, 0.8);
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

  public addLog(type: 'LOG' | 'WARN' | 'ERROR', args: any[]): void {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const message = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        // Simple object representation for performance
        if (arg.constructor) {
          return `[${arg.constructor.name}]`;
        }
        return '[Object]';
      }
      return String(arg);
    }).join(' ');
    
    const colorMap = {
      LOG: '#00ff00',
      WARN: '#ffff00', 
      ERROR: '#ff4444'
    };

    const logEntry = `[${timestamp}] ${type}: ${message}`;
    this.logs.push(logEntry);

    // Limit log count
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Add to DOM
    const logElement = document.createElement('div');
    logElement.style.color = colorMap[type];
    logElement.style.marginBottom = '2px';
    logElement.textContent = logEntry;
    
    this.logArea.appendChild(logElement);
    
    // Auto-scroll to bottom
    if (this.isVisible) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    this.logArea.scrollTop = this.logArea.scrollHeight;
  }

  public clear(): void {
    this.logs = [];
    this.logArea.innerHTML = '';
    this.addLog('LOG', ['🧹 Debug console cleared']);
  }

  public copyToClipboard(): void {
    const allLogs = this.logs.join('\n');
    navigator.clipboard.writeText(allLogs).then(() => {
      this.addLog('LOG', ['📋 Logs copied to clipboard']);
    }).catch(() => {
      this.addLog('ERROR', ['❌ Failed to copy to clipboard']);
    });
  }

  private executeCommand(command: string): void {
    this.addLog('LOG', [`> ${command}`]);
    
    try {
      // Basic debug commands
      switch (command.toLowerCase()) {
        case 'clear':
          this.clear();
          break;
        case 'help':
          this.addLog('LOG', ['Available commands: clear, help, scene, character, camera']);
          break;
        case 'scene':
          // Access scene info if available
          if ((window as any).debugScene) {
            const scene = (window as any).debugScene;
            this.addLog('LOG', [`Scene children: ${scene.children.length}`]);
          } else {
            this.addLog('WARN', ['Scene not available in debug context']);
          }
          break;
        case 'character':
          if ((window as any).debugCharacter) {
            const char = (window as any).debugCharacter;
            this.addLog('LOG', [`Character position: ${JSON.stringify(char.getPosition())}`]);
          } else {
            this.addLog('WARN', ['Character not available in debug context']);
          }
          break;
        case 'camera':
          if ((window as any).debugCamera) {
            const cam = (window as any).debugCamera;
            this.addLog('LOG', [`Camera position: ${JSON.stringify(cam.position)}`]);
          } else {
            this.addLog('WARN', ['Camera not available in debug context']);
          }
          break;
        default:
          // Try to evaluate as JavaScript
          try {
            const result = eval(command);
            this.addLog('LOG', [`Result: ${JSON.stringify(result)}`]);
          } catch (error) {
            this.addLog('ERROR', [`Command failed: ${error}`]);
          }
      }
    } catch (error) {
      this.addLog('ERROR', [`Command execution failed: ${error}`]);
    }
  }

  // Public method to add logs from external sources
  public static log(type: 'LOG' | 'WARN' | 'ERROR', ...args: any[]): void {
    const instance = DebugConsole.getInstance();
    instance.addLog(type, args);
  }
}
