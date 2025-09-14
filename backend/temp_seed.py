import asyncio
import sys
import os
sys.path.append("/app")

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session
from app.models.quest import QuestNode, BiomeType

async def create_quest_nodes():
    async with async_session() as session:
        # Check if nodes already exist
        from sqlalchemy import select
        result = await session.execute(select(QuestNode))
        existing = result.scalars().all()
        
        if existing:
            print(f"Found {len(existing)} existing quest nodes")
            return
        
        # Create sample quest nodes
        nodes = [
            QuestNode(
                name="Whispering Woods",
                description="Dark woods where shadows move of their own accord",
                biome=BiomeType.FOREST,
                map_x=100,
                map_y=150,
                difficulty_level=1,
                enemy_types=["goblin_scout", "shadow_wolf"],
                drop_table={"common_loot": 0.8, "uncommon_loot": 0.3},
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
                drop_table={"uncommon_loot": 0.6, "rare_loot": 0.2},
                unlock_requirements={"level": 3}
            ),
            QuestNode(
                name="Cursed Ruins",
                description="The remains of a once-great civilization",
                biome=BiomeType.RUINS,
                map_x=300,
                map_y=200,
                difficulty_level=5,
                enemy_types=["stone_golem", "cursed_mage"],
                drop_table={"rare_loot": 0.4, "epic_loot": 0.1},
                unlock_requirements={"level": 5}
            ),
            QuestNode(
                name="Crimson Caverns",
                description="Deep caves stained with the blood of ancient battles",
                biome=BiomeType.CAVE,
                map_x=150,
                map_y=300,
                difficulty_level=7,
                enemy_types=["blood_spider", "cave_troll"],
                drop_table={"epic_loot": 0.3, "legendary_loot": 0.05},
                unlock_requirements={"level": 7}
            ),
            QuestNode(
                name="Bloodmoon Swamp",
                description="A cursed swampland where the moon always appears red",
                biome=BiomeType.SWAMP,
                map_x=50,
                map_y=250,
                difficulty_level=4,
                enemy_types=["bog_wraith", "poison_frog"],
                drop_table={"poison_essence": 0.7, "rare_loot": 0.3},
                unlock_requirements={"level": 4}
            ),
        ]
        
        for node in nodes:
            session.add(node)
        
        await session.commit()
        print(f"Created {len(nodes)} quest nodes successfully!")

if __name__ == "__main__":
    asyncio.run(create_quest_nodes())
