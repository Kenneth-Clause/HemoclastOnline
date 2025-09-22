/**
 * UI Demo - Demonstrates UI functionality with sample data and interactions
 * Run this to test all UI components and their features
 */

import { UIManager } from '../components/UIManager';
import { GameStore } from '../stores/gameStore';

export class UIDemo {
  private uiManager: UIManager;
  private gameStore: GameStore;
  private demoInterval?: number;
  private isRunning: boolean = false;

  constructor(uiManager: UIManager) {
    this.uiManager = uiManager;
    this.gameStore = GameStore.getInstance();
  }

  public startDemo(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🎮 Starting UI Demo...');
    
    // Initialize sample data for all components
    this.initializeSampleInventory();
    this.initializeSampleCharacterSheet();
    this.initializeCombatUI();
    this.initializeAchievements();
    this.initializeDailyTasks();
    
    // Set up demo scenarios
    this.setupDemoScenarios();
    
    // Start demo loop
    this.demoInterval = window.setInterval(() => {
      this.runDemoLoop();
    }, 2000);
    
    console.log('📱 UI Demo is running! Available keyboard shortcuts:');
    console.log('  F12 - Toggle all UI');
    console.log('  F1-F3 - Toggle individual components');
    console.log('  I - Toggle Inventory');
    console.log('  C - Toggle Character Sheet');
    console.log('  J - Toggle Quest Tracker');
    console.log('⚔️ Click action bar slots to test cooldowns and abilities');
    console.log('👥 Party frames show different member states and buffs');
    console.log('🎯 Target frame will show enemy casting and threat levels');
  }

  public stopDemo(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = undefined;
    }
    
    console.log('🛑 UI Demo stopped');
  }

  private setupDemoScenarios(): void {
    // Set up dynamic player stats that will change over time
    this.gameStore.store.setState((state) => ({
      ...state,
      demo: {
        playerHealthDirection: -1, // -1 for decreasing, 1 for increasing
        playerManaDirection: -1,
        targetCastProgress: 0,
        threatLevel: 0,
        scenarioStep: 0
      }
    }));

    // Set up sample target
    this.setDemoTarget();
    
    // Add some buffs to player
    this.addPlayerBuffs();
    
    // Simulate party member status changes
    this.simulatePartyChanges();
  }

  private runDemoLoop(): void {
    const state = this.gameStore.getState();
    const demo = state.demo || {};
    
    // Cycle through different demo scenarios
    switch (demo.scenarioStep % 11) {
      case 0:
        this.simulateCombatScenario();
        break;
      case 1:
        this.simulateHealingScenario();
        break;
      case 2:
        this.simulateTargetCasting();
        break;
        case 3:
          this.simulatePartyBuffs();
          break;
        case 4:
          this.triggerInventoryDemo();
          break;
        case 5:
          this.triggerQuestDemo();
          break;
        case 6:
          this.triggerChatDemo();
          break;
        case 7:
          this.triggerSocialDemo();
          break;
        case 8:
          this.triggerCombatUIDemo();
          break;
        case 9:
          this.triggerAchievementDemo();
          break;
        case 10:
          this.triggerDailyTaskDemo();
          break;
    }
    
    // Increment scenario step
    this.gameStore.store.setState((state) => ({
      ...state,
      demo: {
        ...state.demo,
        scenarioStep: (state.demo?.scenarioStep || 0) + 1
      }
    }));
  }

  private simulateCombatScenario(): void {
    console.log('⚔️ Demo: Combat scenario - health/mana changes');
    
    const state = this.gameStore.getState();
    const player = state.player;
    const demo = state.demo || {};
    
    if (!player) return;
    
    // Simulate health changes
    let newHealth = player.health + (demo.playerHealthDirection * 15);
    if (newHealth <= 50) {
      demo.playerHealthDirection = 1; // Start healing
      newHealth = 50;
    } else if (newHealth >= player.maxHealth) {
      demo.playerHealthDirection = -1; // Start taking damage
      newHealth = player.maxHealth;
    }
    
    // Simulate mana changes
    let newMana = player.mana + (demo.playerManaDirection * 10);
    if (newMana <= 20) {
      demo.playerManaDirection = 1; // Start regenerating
      newMana = 20;
    } else if (newMana >= player.maxMana) {
      demo.playerManaDirection = -1; // Start using mana
      newMana = player.maxMana;
    }
    
    // Update class resource (rage)
    const newRage = Math.min(100, (player.classResource?.value || 0) + 10);
    
    this.gameStore.store.setState((state) => ({
      ...state,
      player: {
        ...player,
        health: newHealth,
        mana: newMana,
        classResource: {
          ...player.classResource!,
          value: newRage
        }
      },
      demo
    }));
  }

  private simulateHealingScenario(): void {
    console.log('💚 Demo: Healing scenario - party member healing');
    
    const state = this.gameStore.getState();
    const party = state.party;
    
    if (!party?.members) return;
    
    // Heal a random party member
    const members = [...party.members];
    const memberIndex = Math.floor(Math.random() * members.length);
    const member = members[memberIndex];
    
    if (member.health < member.maxHealth) {
      member.health = Math.min(member.maxHealth, member.health + 25);
      
      this.gameStore.store.setState((state) => ({
        ...state,
        party: {
          ...party,
          members
        }
      }));
    }
  }

  private simulateTargetCasting(): void {
    console.log('🔮 Demo: Target casting spell');
    
    const targetFrame = this.uiManager.getTargetFrame();
    if (targetFrame) {
      targetFrame.startCasting({
        spellName: 'Shadow Bolt',
        castTime: 3000,
        maxCastTime: 3000,
        canInterrupt: true
      });
      
      // Simulate threat changes
      targetFrame.setThreat({
        playerThreat: Math.random() * 100,
        maxThreat: 100,
        threatLevel: ['low', 'medium', 'high', 'tanking'][Math.floor(Math.random() * 4)] as any
      });
    }
  }

  private simulatePartyBuffs(): void {
    console.log('✨ Demo: Adding party buffs');
    
    const partyFrames = this.uiManager.getPartyFrames();
    if (!partyFrames) return;
    
    const state = this.gameStore.getState();
    const party = state.party;
    
    if (!party?.members) return;
    
    const members = [...party.members];
    
    // Add random buffs to party members
    members.forEach(member => {
      const buffIcons = ['⚔️', '🛡️', '💨', '🔥', '❄️', '⚡'];
      const buffNames = ['Attack Boost', 'Defense Up', 'Haste', 'Fire Shield', 'Frost Armor', 'Lightning Speed'];
      
      if (Math.random() > 0.7) { // 30% chance to add a buff
        const buffIndex = Math.floor(Math.random() * buffIcons.length);
        const newBuff = {
          id: `buff_${Date.now()}_${Math.random()}`,
          name: buffNames[buffIndex],
          icon: buffIcons[buffIndex],
          duration: 30000 + Math.random() * 30000 // 30-60 seconds
        };
        
        member.buffs.push(newBuff);
        
        // Limit to 3 buffs per member
        if (member.buffs.length > 3) {
          member.buffs.shift();
        }
      }
    });
    
    this.gameStore.store.setState((state) => ({
      ...state,
      party: {
        ...party,
        members
      }
    }));
  }

  private setDemoTarget(): void {
    const targets = [
      {
        id: 'boss_1',
        name: 'Crypt Guardian',
        level: 10,
        type: 'boss' as const,
        health: 850,
        maxHealth: 1000,
        classification: 'Dungeon Boss'
      },
      {
        id: 'elite_1',
        name: 'Shadow Assassin',
        level: 8,
        type: 'elite' as const,
        health: 320,
        maxHealth: 400,
        shield: 50,
        maxShield: 100,
        classification: 'Elite'
      },
      {
        id: 'npc_1',
        name: 'Goblin Warrior',
        level: 6,
        type: 'npc' as const,
        health: 120,
        maxHealth: 150
      }
    ];
    
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    
    this.gameStore.store.setState((state) => ({
      ...state,
      target: randomTarget
    }));
  }

  private addPlayerBuffs(): void {
    const playerFrame = this.uiManager.getPlayerFrame();
    if (!playerFrame) return;
    
    // Add some sample buffs
    playerFrame.addBuff({
      id: 'warrior_stance',
      name: 'Battle Stance',
      icon: '⚔️',
      duration: 120000,
      maxDuration: 120000,
      type: 'buff'
    });
    
    playerFrame.addBuff({
      id: 'defense_up',
      name: 'Fortification',
      icon: '🛡️',
      duration: 60000,
      maxDuration: 60000,
      type: 'buff',
      stacks: 3
    });
    
    // Add a debuff for demonstration
    setTimeout(() => {
      playerFrame.addBuff({
        id: 'poison',
        name: 'Poison',
        icon: '☠️',
        duration: 15000,
        maxDuration: 15000,
        type: 'debuff'
      });
    }, 5000);
  }

  private simulatePartyChanges(): void {
    // Simulate party member going out of range/line of sight
    setTimeout(() => {
      const state = this.gameStore.getState();
      const party = state.party;
      
      if (party?.members && party.members.length > 2) {
        const members = [...party.members];
        members[2].isInRange = false;
        
        this.gameStore.store.setState((state) => ({
          ...state,
          party: {
            ...party,
            members
          }
        }));
        
        console.log('📡 Demo: Party member went out of range');
      }
    }, 10000);
    
    // Bring them back in range
    setTimeout(() => {
      const state = this.gameStore.getState();
      const party = state.party;
      
      if (party?.members && party.members.length > 2) {
        const members = [...party.members];
        members[2].isInRange = true;
        
        this.gameStore.store.setState((state) => ({
          ...state,
          party: {
            ...party,
            members
          }
        }));
        
        console.log('📡 Demo: Party member back in range');
      }
    }, 20000);
  }

  public triggerActionBarDemo(): void {
    const actionBar = this.uiManager.getActionBar();
    if (!actionBar) return;
    
    console.log('⚡ Demo: Triggering action bar abilities');
    
    // Simulate using abilities with cooldowns
    actionBar.activateSlot('slot_0'); // Power Strike
    
    setTimeout(() => {
      actionBar.activateSlot('slot_1'); // Shield Slam
    }, 2000);
    
    setTimeout(() => {
      actionBar.activateSlot('slot_2'); // Health Potion
    }, 4000);
  }

  public triggerCombatDemo(): void {
    console.log('⚔️ Demo: Triggering combat scenario');
    
    // Simulate taking damage
    const state = this.gameStore.getState();
    const player = state.player;
    
    if (player) {
      this.gameStore.store.setState((state) => ({
        ...state,
        player: {
          ...player,
          health: Math.max(1, player.health - 50)
        }
      }));
    }
    
    // Add combat buff
    const playerFrame = this.uiManager.getPlayerFrame();
    if (playerFrame) {
      playerFrame.addBuff({
        id: 'combat_fury',
        name: 'Combat Fury',
        icon: '💢',
        duration: 30000,
        maxDuration: 30000,
        type: 'buff',
        stacks: 2
      });
    }
  }

  public initializeSampleInventory(): void {
    const inventory = this.uiManager.getInventory();
    if (!inventory) return;

    // Add sample items to inventory
    const sampleItems = [
      {
        id: 'sword_basic',
        name: 'Iron Sword',
        icon: '⚔️',
        rarity: 'common' as const,
        type: 'weapon' as const,
        stackSize: 1,
        maxStackSize: 1,
        description: 'A sturdy iron sword. Reliable in battle.',
        value: 50,
        level: 5,
        stats: { strength: 8, dexterity: 2 }
      },
      {
        id: 'health_potion',
        name: 'Health Potion',
        icon: '🍷',
        rarity: 'common' as const,
        type: 'consumable' as const,
        stackSize: 5,
        maxStackSize: 10,
        description: 'Restores 50 health when consumed.',
        value: 25
      },
      {
        id: 'leather_boots',
        name: 'Leather Boots',
        icon: '👢',
        rarity: 'uncommon' as const,
        type: 'armor' as const,
        stackSize: 1,
        maxStackSize: 1,
        description: 'Well-crafted leather boots. Provides good protection.',
        value: 75,
        level: 6,
        stats: { dexterity: 3, constitution: 2 },
        slot: 'feet'
      },
      {
        id: 'mana_crystal',
        name: 'Mana Crystal',
        icon: '💎',
        rarity: 'rare' as const,
        type: 'material' as const,
        stackSize: 3,
        maxStackSize: 5,
        description: 'A crystallized form of pure mana. Used in enchanting.',
        value: 150
      }
    ];

    sampleItems.forEach(item => {
      inventory.addItem(item);
    });

    console.log('📦 Demo: Inventory initialized with sample items');
  }

  public initializeSampleCharacterSheet(): void {
    const characterSheet = this.uiManager.getCharacterSheet();
    if (!characterSheet) return;

    // Update character info with sample data
    characterSheet.updateCharacterInfo({
      name: 'Grimjaw the Warrior',
      level: 8,
      experience: 1250,
      maxExperience: 1500,
      gearScore: 245
    });

    console.log('📋 Demo: Character sheet initialized with sample data');
  }

  public triggerInventoryDemo(): void {
    const inventory = this.uiManager.getInventory();
    if (!inventory) return;

    console.log('🎒 Demo: Adding random item to inventory');
    
    const randomItems = [
      {
        id: 'random_gem',
        name: 'Mysterious Gem',
        icon: '💠',
        rarity: 'epic' as const,
        type: 'material' as const,
        stackSize: 1,
        maxStackSize: 3,
        description: 'A gem that pulses with mysterious energy.',
        value: 500
      },
      {
        id: 'scroll_fireball',
        name: 'Fireball Scroll',
        icon: '📜',
        rarity: 'uncommon' as const,
        type: 'consumable' as const,
        stackSize: 2,
        maxStackSize: 5,
        description: 'Casts a powerful fireball when used.',
        value: 100
      }
    ];

    const randomItem = randomItems[Math.floor(Math.random() * randomItems.length)];
    inventory.addItem(randomItem);
  }

  public triggerQuestDemo(): void {
    const questTracker = this.uiManager.getQuestTracker();
    if (!questTracker) return;

    console.log('📋 Demo: Updating quest progress');
    
    // Update progress on existing quest
    questTracker.updateQuestProgress('main_001', 'obj_001', 5); // Update wolf kills
    
    // Add a new quest
    setTimeout(() => {
      questTracker.addQuest({
        id: 'demo_quest',
        title: 'Demo Quest Added',
        description: 'A quest added during the demo.',
        level: 8,
        type: 'side',
        giver: 'Demo NPC',
        location: 'Demo Area',
        objectives: [
          {
            id: 'demo_obj',
            description: 'Complete the demo',
            completed: false
          }
        ],
        rewards: {
          experience: 500,
          gold: 75
        },
        isCompleted: false,
        isTracked: true
      });
    }, 2000);
  }

  public triggerChatDemo(): void {
    const chatSystem = this.uiManager.getChatSystem();
    if (!chatSystem) return;

    console.log('💬 Demo: Adding chat messages');
    
    const demoMessages = [
      { channel: 'general' as const, sender: 'PlayerDemo', content: 'Anyone want to group up for the dungeon?' },
      { channel: 'guild' as const, sender: 'GuildOfficer', content: 'Guild raid starting in 10 minutes!' },
      { channel: 'trade' as const, sender: 'MerchantPlayer', content: 'WTS [Epic Sword] - 500 gold!' },
      { channel: 'party' as const, sender: 'PartyMember', content: 'Ready for the boss fight!' }
    ];

    const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
    
    chatSystem.addMessage({
      id: `demo_${Date.now()}`,
      channel: randomMessage.channel,
      sender: randomMessage.sender,
      content: randomMessage.content,
      timestamp: new Date(),
      type: 'message'
    });

    // Occasionally add system messages
    if (Math.random() > 0.7) {
      chatSystem.sendSystemMessage('Server restart in 30 minutes for maintenance.');
    }

    // Add combat messages during combat scenarios
    if (Math.random() > 0.8) {
      chatSystem.sendCombatMessage('You dealt 45 damage to Goblin Warrior!');
    }
  }

  public triggerSocialDemo(): void {
    console.log('👥 Demo: Updating social systems');
    
    // Update friend status
    const friendsList = this.uiManager.getFriendsList();
    if (friendsList) {
      // Simulate friend coming online/offline
      const friends = friendsList.getFriends();
      if (friends.length > 0) {
        const randomFriend = friends[Math.floor(Math.random() * friends.length)];
        friendsList.updateFriendStatus(randomFriend.id, {
          isOnline: !randomFriend.isOnline,
          status: randomFriend.isOnline ? 'offline' : 'online',
          location: randomFriend.isOnline ? undefined : 'Whispering Woods'
        });
      }
    }

    // Update guild info
    const guildPanel = this.uiManager.getGuildPanel();
    if (guildPanel) {
      // Simulate guild treasury change
      guildPanel.updateGuildInfo({
        treasury: 12500 + Math.floor(Math.random() * 1000) - 500 // Random change
      });
    }
  }

  public triggerGuildDemo(): void {
    const guildPanel = this.uiManager.getGuildPanel();
    if (!guildPanel) return;

    console.log('🏰 Demo: Guild activity simulation');
    
    // Add a new guild member
    const newMemberNames = ['NewRecruit', 'FreshPlayer', 'EagerAdventurer', 'YoungWarrior'];
    const classes = ['Fighter', 'Wizard', 'Rogue', 'Cleric'];
    
    const randomName = newMemberNames[Math.floor(Math.random() * newMemberNames.length)];
    const randomClass = classes[Math.floor(Math.random() * classes.length)];
    
    guildPanel.addGuildMember({
      id: `member_${Date.now()}`,
      name: randomName,
      level: Math.floor(Math.random() * 10) + 1,
      class: randomClass,
      rank: 'Recruit',
      isOnline: true,
      lastSeen: new Date(),
      contributionPoints: 0,
      joinDate: new Date()
    });
  }

  public triggerFriendsDemo(): void {
    const friendsList = this.uiManager.getFriendsList();
    if (!friendsList) return;

    console.log('👫 Demo: Friends list activity');
    
    // Add a new friend
    const friendNames = ['NewFriend', 'HelpfulPlayer', 'CoolWarrior', 'FriendlyMage'];
    const classes = ['Guardian', 'Elementalist', 'Assassin', 'Oracle'];
    
    const randomName = friendNames[Math.floor(Math.random() * friendNames.length)];
    const randomClass = classes[Math.floor(Math.random() * classes.length)];
    
    friendsList.addFriend({
      id: `friend_${Date.now()}`,
      name: randomName,
      level: Math.floor(Math.random() * 20) + 10,
      class: randomClass,
      isOnline: Math.random() > 0.5,
      status: Math.random() > 0.5 ? 'online' : 'offline',
      location: 'Demo Area',
      lastSeen: new Date()
    });
  }

  public initializeCombatUI(): void {
    const combatUI = this.uiManager.getCombatUI();
    if (!combatUI) return;

    console.log('⚔️ Demo: Combat UI initialized');
  }

  public initializeAchievements(): void {
    const achievementPanel = this.uiManager.getAchievementPanel();
    if (!achievementPanel) return;

    console.log('🏆 Demo: Achievement panel initialized with sample achievements');
  }

  public initializeDailyTasks(): void {
    const dailyTasks = this.uiManager.getDailyTasks();
    if (!dailyTasks) return;

    console.log('📅 Demo: Daily tasks initialized');
  }

  public triggerCombatUIDemo(): void {
    const combatUI = this.uiManager.getCombatUI();
    if (!combatUI) return;

    console.log('💥 Demo: Triggering combat events');
    
    // Simulate various combat events
    const { width, height } = this.uiManager['scene'].scale;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Random damage
    const damage = Math.floor(Math.random() * 100) + 20;
    const isCrit = Math.random() > 0.8;
    combatUI.showDamage('Goblin Warrior', damage, isCrit, { 
      x: centerX + (Math.random() - 0.5) * 200, 
      y: centerY + (Math.random() - 0.5) * 100 
    });
    
    // Occasional healing
    if (Math.random() > 0.7) {
      const healing = Math.floor(Math.random() * 50) + 10;
      combatUI.showHealing('You', healing, false, { 
        x: centerX - 100, 
        y: centerY - 50 
      });
    }
    
    // Occasional special events
    if (Math.random() > 0.8) {
      const events = ['dodge', 'resist', 'block'];
      const eventType = events[Math.floor(Math.random() * events.length)];
      
      switch (eventType) {
        case 'dodge':
          combatUI.showDodge('You', { x: centerX - 100, y: centerY });
          break;
        case 'resist':
          combatUI.showResist('You', { x: centerX - 100, y: centerY });
          break;
        case 'block':
          combatUI.showBlock('You', 15, { x: centerX - 100, y: centerY });
          break;
      }
    }
    
    // Enter combat if not already
    if (!combatUI.getCombatStats().inCombat) {
      combatUI.enterCombat();
    }
  }

  public triggerAchievementDemo(): void {
    const achievementPanel = this.uiManager.getAchievementPanel();
    if (!achievementPanel) return;

    console.log('🏆 Demo: Updating achievement progress');
    
    // Update progress on various achievements
    achievementPanel.updateAchievementProgress('damage_dealer', 8000);
    achievementPanel.updateAchievementProgress('critical_master', 75);
    achievementPanel.updateAchievementProgress('explorer', 6);
    
    // Occasionally complete an achievement
    if (Math.random() > 0.9) {
      achievementPanel.completeAchievement('social_butterfly');
    }
  }

  public triggerDailyTaskDemo(): void {
    const dailyTasks = this.uiManager.getDailyTasks();
    if (!dailyTasks) return;

    console.log('📅 Demo: Updating daily task progress');
    
    // Update progress on daily tasks
    dailyTasks.updateTaskProgress('daily_001', 10); // Monster kills
    dailyTasks.updateTaskProgress('daily_002', 15); // Herb gathering
    dailyTasks.updateTaskProgress('daily_003', 4);  // Social interaction
    
    // Update weekly tasks
    dailyTasks.updateTaskProgress('weekly_001', 2); // Dungeons
    dailyTasks.updateTaskProgress('weekly_002', 6); // PvP wins
  }

  public triggerLootDemo(): void {
    const lootWindow = this.uiManager.getLootWindow();
    if (!lootWindow) return;

    console.log('💎 Demo: Adding loot items');
    
    // Add some sample loot
    const sampleLoot = [
      {
        id: 'epic_sword',
        name: 'Flamebrand Sword',
        icon: '🗡️',
        rarity: 'epic' as const,
        type: 'weapon' as const,
        level: 10,
        stats: { strength: 15, dexterity: 8 },
        value: 500,
        description: 'A sword wreathed in eternal flames.',
        bindType: 'boe' as const,
        quantity: 1
      },
      {
        id: 'rare_boots',
        name: 'Boots of Swiftness',
        icon: '👢',
        rarity: 'rare' as const,
        type: 'armor' as const,
        level: 8,
        stats: { dexterity: 10, constitution: 5 },
        value: 200,
        description: 'These boots make you move like the wind.',
        bindType: 'boe' as const,
        quantity: 1
      }
    ];
    
    const randomLoot = sampleLoot[Math.floor(Math.random() * sampleLoot.length)];
    lootWindow.addLoot(randomLoot, Math.random() > 0.5); // 50% chance personal loot
  }

  public triggerVendorDemo(): void {
    const vendorUI = this.uiManager.getVendorUI();
    if (!vendorUI) return;

    console.log('🛒 Demo: Setting up vendor');
    
    // Set up sample vendor
    vendorUI.setVendor({
      id: 'vendor_001',
      name: 'Blacksmith Gareth',
      type: 'weapons',
      greeting: 'Welcome to my forge! I have the finest weapons in the realm.',
      buybackMultiplier: 0.25,
      repairCost: 5,
      items: [
        {
          id: 'iron_sword',
          name: 'Iron Sword',
          icon: '⚔️',
          rarity: 'common',
          type: 'weapon',
          price: 100,
          currency: 'gold',
          level: 5,
          stats: { strength: 8 },
          description: 'A well-crafted iron sword.',
          stock: 5,
          category: 'weapons'
        },
        {
          id: 'steel_armor',
          name: 'Steel Chestplate',
          icon: '🦺',
          rarity: 'uncommon',
          type: 'armor',
          price: 200,
          currency: 'gold',
          level: 8,
          stats: { constitution: 12 },
          description: 'Sturdy steel protection.',
          stock: 3,
          category: 'armor'
        }
      ]
    });
  }
}

// Export a function to easily start the demo from console
export function startUIDemo(uiManager: UIManager): UIDemo {
  const demo = new UIDemo(uiManager);
  demo.startDemo();
  
  // Make demo methods available globally for console testing
  (window as any).uiDemo = demo;
  
  console.log('🎮 UI Demo started! Available commands:');
  console.log('  uiDemo.triggerActionBarDemo() - Test action bar abilities');
  console.log('  uiDemo.triggerCombatDemo() - Simulate combat damage and buffs');
  console.log('  uiDemo.triggerInventoryDemo() - Add random items to inventory');
  console.log('  uiDemo.triggerQuestDemo() - Update quest progress and add new quest');
  console.log('  uiDemo.triggerChatDemo() - Add chat messages');
  console.log('  uiDemo.triggerGuildDemo() - Add guild members and activity');
  console.log('  uiDemo.triggerFriendsDemo() - Add friends and update status');
  console.log('  uiDemo.triggerCombatUIDemo() - Show floating combat text');
  console.log('  uiDemo.triggerAchievementDemo() - Update achievement progress');
  console.log('  uiDemo.triggerDailyTaskDemo() - Update daily/weekly tasks');
  console.log('  uiDemo.triggerLootDemo() - Add loot items');
  console.log('  uiDemo.triggerVendorDemo() - Set up vendor interface');
  console.log('  uiDemo.stopDemo() - Stop the automatic demo loop');
  
  return demo;
}
