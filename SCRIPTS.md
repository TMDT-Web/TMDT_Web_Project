# LuxeFurniture - Utility Scripts Guide

## Available Scripts

### 1. `.\start_app.ps1` - Fresh Start
**Use when**: First time setup or want clean database
- Builds Docker images
- Creates fresh containers
- **WARNING**: Wipes database!
- Auto-initializes with admin user

### 2. `.\rebuild_app.ps1` - Full Rebuild ⭐ NEW
**Use when**: Changed Dockerfile or dependencies
- Stops containers
- Rebuilds images from scratch (no cache)
- Starts containers
- Waits for backend health check
- **Auto-runs init_db** to create admin user
- Preserves database unless volumes removed

### 3. `.\restart_app.ps1` - Quick Restart ⭐ NEW  
**Use when**: Changed code but not dependencies
- Restarts containers only
- No rebuild (fast!)
- Database preserved
- Good for quick code changes

### 4. Manual Database Init
**Use when**: Need to recreate admin user
```powershell
docker-compose exec backend python -m app.init_db
```

---

## Quick Reference

| Scenario | Command |
|----------|---------|
| First time setup | `.\start_app.ps1` |
| Changed code only | `.\restart_app.ps1` |
| Changed requirements.txt or package.json | `.\rebuild_app.ps1` |
| Changed Dockerfile | `.\rebuild_app.ps1` |
| Lost admin user | `docker-compose exec backend python -m app.init_db` |
| Clean everything | `docker-compose down -v` then `.\rebuild_app.ps1` |

---

## Default Credentials

After any initialization:
- **Email**: admin@luxefurniture.com  
- **Password**: Admin@123456

---

## Troubleshooting

**Port already in use**:
```powershell
docker-compose down
.\rebuild_app.ps1
```

**Database issues**:
```powershell
docker-compose exec backend python -m app.init_db
```

**Complete reset**:
```powershell
docker-compose down -v
.\rebuild_app.ps1
```
