# 🩸 HemoclastOnline

**Gothic Fantasy MMO-lite** - A browser-based 3D MMO with dark, atmospheric gameplay inspired by Blood Omen: Legacy of Kain/Neverwinter Nights.

## 🎮 Game Overview

HemoclastOnline is a casual MMO-lite RPG where players create characters, battle monsters in turn-based combat, unlock skills, collect loot, and join guilds to take down raid bosses together — all in short, social, sticky sessions.

### Key Features
- **3D Gothic Fantasy** - Dark medieval aesthetic with atmospheric lighting
- **Turn-based Combat** - Strategic skill-based battles with status effects
- **Guild System** - Cooperative raid bosses and social features
- **Progression System** - Levels 1-30, skill unlocks, equipment upgrades
- **Browser-based** - No downloads required, works on desktop & mobile

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Primary database for game data
- **Redis** - Caching, sessions, and real-time features
- **WebSockets** - Real-time guild chat and events
- **Docker** - Containerized deployment

### Frontend
- **Phaser 3** - 2D game engine for sprites and isometric rendering
- **TypeScript** - Type-safe game development
- **Vite** - Fast build tool and dev server
- **Zustand** - Lightweight state management

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd HemoclastOnline
```

### 2. Start with Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Development Setup

### Backend Development
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env

# Run development server
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Management
```bash
# Access PostgreSQL container
docker exec -it hemoclast_postgres psql -U hemoclast -d hemoclast_db

# View database logs
docker-compose logs postgres

# Reset database (WARNING: destroys all data)
docker-compose down -v
docker-compose up -d
```

## 📁 Project Structure

```
HemoclastOnline/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # REST API endpoints
│   │   ├── core/           # Configuration & database
│   │   ├── models/         # SQLAlchemy models
│   │   └── websocket/      # WebSocket handlers
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Phaser frontend
│   ├── src/
│   │   ├── scenes/         # Phaser game scenes
│   │   ├── stores/         # Zustand state management
│   │   ├── config/         # Game configuration
│   │   └── styles/         # CSS styles
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Docker services
└── README.md
```

## 🎯 Development Roadmap

### Milestone 0 - Foundations ✅
- [x] Project scaffolding (client/server)
- [x] Health check endpoints
- [x] Guest login system
- [x] Basic sprite rendering
- [x] WebSocket echo functionality

### Milestone 1 - Core Loop
- [ ] Map nodes and quest system
- [ ] Battle resolution engine
- [ ] XP and loot distribution
- [ ] Inventory & equipment system
- [ ] Daily rewards
- [ ] Basic leaderboards

### Milestone 2 - Social Layer
- [ ] Guild creation/management
- [ ] Guild chat system
- [ ] Raid boss prototype
- [ ] Town plaza with AOI (Area of Interest)
- [ ] Player presence system

### Milestone 3 - Polish & Content
- [ ] Shop system with rotating items
- [ ] Seasonal battle pass
- [ ] Profile/camp decoration
- [ ] Gothic asset integration
- [ ] Weather and lighting effects

### Milestone 4 - Production Ready
- [ ] Anti-cheat protections
- [ ] Analytics dashboard
- [ ] Content balancing tools
- [ ] Load testing (100-200 concurrent players)
- [ ] Performance optimizations

## 🎨 Game Design

### Classes
- **Warrior** (STR/VIT) - Tanky frontline with bleed/stun mechanics
- **Rogue** (AGI/STR) - Mobile combos with critical hit focus
- **Mage** (INT/VIT) - AoE control with elemental synergies

### Combat System
- **Turn-based** with skill loadouts (3 actives, 1 ultimate, 2 passives)
- **Status effects**: Bleed, Burn, Chill, Poison, Stun
- **Server-authoritative** for fair gameplay
- **Elemental combos** for advanced strategy

### Progression
- **Levels 1-30** with exponential XP curve
- **Skill unlocks** every ~3 levels
- **Equipment slots**: Weapon, Head, Chest, Charm
- **Currency**: Gold (soft) and Gems (premium)

## 🔧 Configuration

### Environment Variables
Copy `backend/env.example` to `backend/.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `SECRET_KEY` - JWT signing key (change in production!)
- `ALLOWED_ORIGINS` - CORS allowed origins

### Game Settings
- `MAX_LEVEL=30` - Maximum character level
- `GUILD_MAX_MEMBERS=25` - Maximum guild size
- `CITY_MAX_PLAYERS=200` - Town plaza capacity

## 🐛 Troubleshooting

### Common Issues

**Docker containers won't start:**
```bash
# Check if ports are in use
lsof -i :5432 -i :6379 -i :8000 -i :5173

# Reset Docker state
docker-compose down -v
docker system prune -f
```

**Frontend can't connect to backend:**
- Verify backend is running on port 8000
- Check CORS configuration in backend settings
- Ensure proxy configuration in `vite.config.ts`

**Database connection errors:**
- Verify PostgreSQL container is running
- Check DATABASE_URL in environment variables
- Ensure database exists and migrations are applied

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎮 Play Now

Visit [HemoclastOnline](http://localhost:5173) to start your gothic adventure!

---

*"In the shadows of forgotten castles, heroes rise to claim their destiny..."*
