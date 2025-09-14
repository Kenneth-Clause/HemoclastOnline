#!/usr/bin/env python3
"""
HemoclastOnline Database Seeding Script
Creates sample data for development and testing
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session, engine, Base
from app.models import *
from datetime import datetime, timedelta

class DatabaseSeeder:
    def __init__(self):
        self.session: AsyncSession = None
    
    async def create_tables(self):
        """Create all database tables"""
        print("🗄️ Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables created")
    
    async def seed_items(self):
        """Create sample items"""
        print("⚔️ Seeding items...")
        
        # Weapons
        items = [
            # Warrior Weapons
            Item(
                name="Iron Sword",
                description="A sturdy iron blade, reliable in battle",
                slot=ItemSlot.WEAPON,
                rarity=ItemRarity.COMMON,
                level_requirement=1,
                stats={"strength": 5, "damage": 15},
                art_reference="sword_iron",
                base_value=50
            ),
            Item(
                name="Bloodthirsty Axe",
                description="An axe that grows stronger with each kill",
                slot=ItemSlot.WEAPON,
                rarity=ItemRarity.RARE,
                level_requirement=5,
                stats={"strength": 12, "damage": 25, "bleed_chance": 15},
                art_reference="axe_bloodthirsty",
                base_value=200
            ),
            
            # Rogue Weapons
            Item(
                name="Shadow Dagger",
                description="A blade that seems to drink in light",
                slot=ItemSlot.WEAPON,
                rarity=ItemRarity.UNCOMMON,
                level_requirement=3,
                stats={"agility": 8, "damage": 20, "crit_chance": 10},
                art_reference="dagger_shadow",
                base_value=100
            ),
            
            # Mage Weapons
            Item(
                name="Ember Staff",
                description="A staff crackling with elemental fire",
                slot=ItemSlot.WEAPON,
                rarity=ItemRarity.UNCOMMON,
                level_requirement=4,
                stats={"intelligence": 10, "damage": 18, "fire_damage": 5},
                art_reference="staff_ember",
                base_value=150
            ),
            
            # Armor - Head
            Item(
                name="Leather Cap",
                description="Simple protection for the head",
                slot=ItemSlot.HEAD,
                rarity=ItemRarity.COMMON,
                level_requirement=1,
                stats={"vitality": 3, "defense": 5},
                art_reference="cap_leather",
                base_value=25
            ),
            Item(
                name="Iron Helm",
                description="Heavy protection forged from iron",
                slot=ItemSlot.HEAD,
                rarity=ItemRarity.UNCOMMON,
                level_requirement=5,
                stats={"vitality": 8, "defense": 12},
                art_reference="helm_iron",
                base_value=80
            ),
            
            # Armor - Chest
            Item(
                name="Cloth Robe",
                description="Simple robes for aspiring mages",
                slot=ItemSlot.CHEST,
                rarity=ItemRarity.COMMON,
                level_requirement=1,
                stats={"intelligence": 4, "mana": 10},
                art_reference="robe_cloth",
                base_value=30
            ),
            Item(
                name="Chain Mail",
                description="Interlocking metal rings provide solid protection",
                slot=ItemSlot.CHEST,
                rarity=ItemRarity.UNCOMMON,
                level_requirement=6,
                stats={"vitality": 10, "defense": 15},
                art_reference="mail_chain",
                base_value=120
            ),
            
            # Charms
            Item(
                name="Bone Talisman",
                description="A grisly charm that radiates dark energy",
                slot=ItemSlot.CHARM,
                rarity=ItemRarity.COMMON,
                level_requirement=2,
                stats={"intelligence": 3, "dark_resistance": 5},
                art_reference="talisman_bone",
                base_value=40
            ),
            Item(
                name="Blood Ruby",
                description="A crimson gem that pulses with inner fire",
                slot=ItemSlot.CHARM,
                rarity=ItemRarity.EPIC,
                level_requirement=10,
                stats={"strength": 6, "vitality": 6, "fire_damage": 8},
                art_reference="ruby_blood",
                base_value=500
            ),
        ]
        
        for item in items:
            self.session.add(item)
        
        await self.session.commit()
        print(f"✅ Created {len(items)} items")
    
    async def seed_quest_nodes(self):
        """Create sample quest nodes"""
        print("🗺️ Seeding quest nodes...")
        
        nodes = [
            QuestNode(
                name="Whispering Woods",
                description="Dark woods where shadows move of their own accord",
                biome=BiomeType.FOREST,
                map_x=100,
                map_y=150,
                difficulty_level=1,
                enemy_types=["goblin_scout", "shadow_wolf"],
                drop_table={"1": 0.8, "2": 0.3, "5": 0.1},  # Item IDs and drop chances
                unlock_requirements={"level": 1}
            ),
            QuestNode(
                name="Abandoned Crypt",
                description="Ancient burial grounds filled with restless undead",
                biome=BiomeType.CRYPT,
                map_x=200,
                map_y=100,
                difficulty_level=3,
                enemy_types=["skeleton_warrior", "wraith"],
                drop_table={"3": 0.6, "4": 0.4, "9": 0.2},
                unlock_requirements={"level": 3, "completed_nodes": [1]}
            ),
            QuestNode(
                name="Cursed Ruins",
                description="The remains of a once-great civilization",
                biome=BiomeType.RUINS,
                map_x=300,
                map_y=200,
                difficulty_level=5,
                enemy_types=["stone_golem", "cursed_mage"],
                drop_table={"6": 0.7, "8": 0.5, "10": 0.15},
                unlock_requirements={"level": 5, "completed_nodes": [1, 2]}
            ),
            QuestNode(
                name="Crimson Caverns",
                description="Deep caves stained with the blood of ancient battles",
                biome=BiomeType.CAVE,
                map_x=150,
                map_y=300,
                difficulty_level=7,
                enemy_types=["blood_spider", "cave_troll"],
                drop_table={"7": 0.8, "10": 0.3, "blood_essence": 0.6},
                unlock_requirements={"level": 7, "completed_nodes": [2, 3]}
            ),
        ]
        
        for node in nodes:
            self.session.add(node)
        
        await self.session.commit()
        print(f"✅ Created {len(nodes)} quest nodes")
    
    async def seed_players_and_characters(self):
        """Create sample players and characters"""
        print("👥 Seeding players and characters...")
        
        # Create sample players
        players = [
            Player(
                name="DarkKnight_92",
                email="darkknight@example.com",
                login_streak=5,
                last_daily_reward=datetime.now() - timedelta(days=1),
                cosmetics={"title": "Shadow Walker", "aura": "dark_flame"}
            ),
            Player(
                name="MysticMage",
                email="mystic@example.com",
                login_streak=12,
                last_daily_reward=datetime.now(),
                cosmetics={"title": "Arcane Scholar", "pet": "crystal_familiar"}
            ),
            Player(
                name="SilentBlade",
                email="blade@example.com",
                login_streak=3,
                cosmetics={"title": "Ghost Walker"}
            ),
        ]
        
        for player in players:
            self.session.add(player)
        
        await self.session.flush()  # Get player IDs
        
        # Create characters for each player
        characters = [
            Character(
                player_id=players[0].id,
                name="Grimjaw",
                character_class=CharacterClass.WARRIOR,
                level=8,
                experience=1250,
                strength=18,
                agility=12,
                intelligence=8,
                vitality=20,
                health_max=200,
                mana_max=40,
                active_skills=[1, 2, 3],  # Skill IDs (would need skill system)
                ultimate_skill=10,
                passive_skills=[5, 6]
            ),
            Character(
                player_id=players[1].id,
                name="Nethys",
                character_class=CharacterClass.MAGE,
                level=10,
                experience=2100,
                strength=8,
                agility=10,
                intelligence=22,
                vitality=15,
                health_max=150,
                mana_max=110,
                active_skills=[11, 12, 13],
                ultimate_skill=20,
                passive_skills=[15, 16]
            ),
            Character(
                player_id=players[2].id,
                name="Whisper",
                character_class=CharacterClass.ROGUE,
                level=6,
                experience=800,
                strength=14,
                agility=20,
                intelligence=12,
                vitality=12,
                health_max=120,
                mana_max=60,
                active_skills=[21, 22, 23],
                ultimate_skill=30,
                passive_skills=[25, 26]
            ),
        ]
        
        for character in characters:
            self.session.add(character)
        
        await self.session.commit()
        print(f"✅ Created {len(players)} players and {len(characters)} characters")
        
        return players, characters
    
    async def seed_guilds(self, players):
        """Create sample guilds"""
        print("🏰 Seeding guilds...")
        
        # Create guild
        guild = Guild(
            name="Crimson Brotherhood",
            motto="United in darkness, forged in blood",
            description="An elite guild of warriors who have sworn a blood oath to protect the realm from ancient evils.",
            max_members=25,
            is_recruiting=True
        )
        
        self.session.add(guild)
        await self.session.flush()
        
        # Add guild members
        guild_members = [
            GuildMember(
                guild_id=guild.id,
                player_id=players[0].id,
                role=GuildRole.LEADER
            ),
            GuildMember(
                guild_id=guild.id,
                player_id=players[1].id,
                role=GuildRole.OFFICER
            ),
            GuildMember(
                guild_id=guild.id,
                player_id=players[2].id,
                role=GuildRole.MEMBER
            ),
        ]
        
        for member in guild_members:
            self.session.add(member)
        
        await self.session.commit()
        print(f"✅ Created guild with {len(guild_members)} members")
    
    async def seed_economy_data(self, players):
        """Create sample economy data"""
        print("💰 Seeding economy data...")
        
        economy_entries = [
            # Player 1 transactions
            EconomyLedger(
                player_id=players[0].id,
                currency_type=CurrencyType.GOLD,
                delta=100,
                balance_after=100,
                reason="quest_reward",
                reference_id="quest_1"
            ),
            EconomyLedger(
                player_id=players[0].id,
                currency_type=CurrencyType.GOLD,
                delta=-50,
                balance_after=50,
                reason="shop_purchase",
                reference_id="item_1"
            ),
            EconomyLedger(
                player_id=players[0].id,
                currency_type=CurrencyType.GEMS,
                delta=25,
                balance_after=25,
                reason="daily_reward"
            ),
            
            # Player 2 transactions
            EconomyLedger(
                player_id=players[1].id,
                currency_type=CurrencyType.GOLD,
                delta=200,
                balance_after=200,
                reason="quest_reward",
                reference_id="quest_2"
            ),
            EconomyLedger(
                player_id=players[1].id,
                currency_type=CurrencyType.GEMS,
                delta=50,
                balance_after=50,
                reason="level_up_bonus"
            ),
        ]
        
        for entry in economy_entries:
            self.session.add(entry)
        
        await self.session.commit()
        print(f"✅ Created {len(economy_entries)} economy transactions")
    
    async def run_full_seed(self):
        """Run complete database seeding"""
        print("🩸 HemoclastOnline Database Seeding")
        print("="*40)
        
        async with async_session() as session:
            self.session = session
            
            try:
                await self.create_tables()
                await self.seed_items()
                await self.seed_quest_nodes()
                players, characters = await self.seed_players_and_characters()
                await self.seed_guilds(players)
                await self.seed_economy_data(players)
                
                print("\n🎉 Database seeding completed successfully!")
                print("🎮 Your HemoclastOnline world is ready for adventure!")
                
            except Exception as e:
                await session.rollback()
                print(f"❌ Seeding failed: {str(e)}")
                raise
            finally:
                await session.close()

async def main():
    seeder = DatabaseSeeder()
    await seeder.run_full_seed()

if __name__ == "__main__":
    asyncio.run(main())
