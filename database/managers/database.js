/**
 * Database Manager
 * SQLite database initialization and management
 * All tables and middleware for Premium, NoPrefix, etc.
 */

const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.dbPath = config.database.path;
        this.ensureDatabaseDirectory();
        this.db = new Database(this.dbPath);
        this.db.pragma('journal_mode = WAL');
        this.initTables();
        this.initMiddleware();
    }

    ensureDatabaseDirectory() {
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
    }

    initTables() {
        // Guilds table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS guilds (
                guild_id TEXT PRIMARY KEY,
                guild_name TEXT NOT NULL,
                prefix TEXT DEFAULT '!',
                dj_role TEXT,
                dj_channel TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Users table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT,
                discriminator TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Premium table (Guild-based)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS premium (
                guild_id TEXT PRIMARY KEY,
                guild_name TEXT NOT NULL,
                activated_by TEXT NOT NULL,
                activated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                expiry_date DATETIME NOT NULL,
                remaining_days INTEGER,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // NoPrefix table (User-based)
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS noprefix (
                user_id TEXT PRIMARY KEY,
                added_by TEXT NOT NULL,
                added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                expiry_date DATETIME NOT NULL,
                remaining_days INTEGER,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Prefix table for custom prefixes
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS prefixes (
                guild_id TEXT PRIMARY KEY,
                prefix TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Settings table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                guild_id TEXT PRIMARY KEY,
                volume INTEGER DEFAULT 80,
                autoplay BOOLEAN DEFAULT false,
                loop TEXT DEFAULT 'off',
                dj_mode BOOLEAN DEFAULT false,
                twentyfourseven BOOLEAN DEFAULT false,
                text_channel TEXT,
                voice_channel TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Playlists table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                tracks TEXT DEFAULT '[]',
                is_public BOOLEAN DEFAULT false,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, name)
            )
        `);

        // Favorites table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                track_id TEXT NOT NULL,
                track_name TEXT NOT NULL,
                track_uri TEXT NOT NULL,
                artist TEXT,
                duration INTEGER,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, track_id)
            )
        `);

        // Queue table for backup/restore
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                tracks TEXT DEFAULT '[]',
                current_track TEXT,
                position INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Queue History table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS queue_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                track_id TEXT NOT NULL,
                track_name TEXT NOT NULL,
                track_uri TEXT NOT NULL,
                artist TEXT,
                duration INTEGER,
                requested_by TEXT,
                played_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // History table for general tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Blacklist table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS blacklist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_id TEXT NOT NULL,
                target_type TEXT NOT NULL,
                reason TEXT,
                blacklisted_by TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(target_id, target_type)
            )
        `);

        // Whitelist table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS whitelist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_id TEXT NOT NULL,
                target_type TEXT NOT NULL,
                whitelisted_by TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(target_id, target_type)
            )
        `);

        // Create indexes for better performance
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_premium_expiry ON premium(expiry_date)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_noprefix_expiry ON noprefix(expiry_date)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_queue_guild ON queue(guild_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_queue_history_guild ON queue_history(guild_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_history_guild ON history(guild_id)`);

        logger.success('Database initialized successfully');
    }

    initMiddleware() {
        // Prepared statements for common operations
        
        // Premium operations
        this.statements = {
            // Premium
            getPremium: this.db.prepare('SELECT * FROM premium WHERE guild_id = ?'),
            addPremium: this.db.prepare(`
                INSERT OR REPLACE INTO premium (guild_id, guild_name, activated_by, expiry_date, remaining_days, status, updated_at)
                VALUES (?, ?, ?, datetime('now', '+' || ? || ' days'), ?, 'active', CURRENT_TIMESTAMP)
            `),
            removePremium: this.db.prepare('DELETE FROM premium WHERE guild_id = ?'),
            extendPremium: this.db.prepare(`
                UPDATE premium 
                SET expiry_date = datetime(expiry_date, '+' || ? || ' days'),
                    remaining_days = remaining_days + ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE guild_id = ?
            `),
            updatePremiumStatus: this.db.prepare(`
                UPDATE premium 
                SET status = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE guild_id = ?
            `),
            
            // NoPrefix
            getNoPrefix: this.db.prepare('SELECT * FROM noprefix WHERE user_id = ?'),
            addNoPrefix: this.db.prepare(`
                INSERT OR REPLACE INTO noprefix (user_id, added_by, expiry_date, remaining_days, status, updated_at)
                VALUES (?, ?, datetime('now', '+' || ? || ' days'), ?, 'active', CURRENT_TIMESTAMP)
            `),
            removeNoPrefix: this.db.prepare('DELETE FROM noprefix WHERE user_id = ?'),
            extendNoPrefix: this.db.prepare(`
                UPDATE noprefix 
                SET expiry_date = datetime(expiry_date, '+' || ? || ' days'),
                    remaining_days = remaining_days + ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `),
            
            // Guild settings
            getGuild: this.db.prepare('SELECT * FROM guilds WHERE guild_id = ?'),
            upsertGuild: this.db.prepare(`
                INSERT INTO guilds (guild_id, guild_name, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET guild_name = excluded.guild_name, updated_at = CURRENT_TIMESTAMP
            `),
            deleteGuild: this.db.prepare('DELETE FROM guilds WHERE guild_id = ?'),
            
            // Custom prefix
            getPrefix: this.db.prepare('SELECT prefix FROM prefixes WHERE guild_id = ?'),
            setPrefix: this.db.prepare(`
                INSERT INTO prefixes (guild_id, prefix, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET prefix = excluded.prefix, updated_at = CURRENT_TIMESTAMP
            `),
            deletePrefix: this.db.prepare('DELETE FROM prefixes WHERE guild_id = ?'),
            
            // Settings
            getSettings: this.db.prepare('SELECT * FROM settings WHERE guild_id = ?'),
            upsertSettings: this.db.prepare(`
                INSERT INTO settings (guild_id, updated_at) 
                VALUES (?, CURRENT_TIMESTAMP)
                ON CONFLICT(guild_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
            `),
            updateVolume: this.db.prepare(`
                UPDATE settings SET volume = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?
            `),
            updateAutoplay: this.db.prepare(`
                UPDATE settings SET autoplay = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?
            `),
            updateLoop: this.db.prepare(`
                UPDATE settings SET loop = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?
            `),
            updateDJMode: this.db.prepare(`
                UPDATE settings SET dj_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?
            `),
            update247: this.db.prepare(`
                UPDATE settings SET twentyfourseven = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?
            `),
            
            // Playlists
            getPlaylists: this.db.prepare('SELECT * FROM playlists WHERE user_id = ?'),
            getPlaylist: this.db.prepare('SELECT * FROM playlists WHERE user_id = ? AND name = ?'),
            createPlaylist: this.db.prepare(`
                INSERT INTO playlists (user_id, name, tracks, is_public) 
                VALUES (?, ?, '[]', ?)
            `),
            deletePlaylist: this.db.prepare('DELETE FROM playlists WHERE user_id = ? AND name = ?'),
            updatePlaylist: this.db.prepare(`
                UPDATE playlists SET tracks = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = ? AND name = ?
            `),
            
            // Favorites
            getFavorites: this.db.prepare('SELECT * FROM favorites WHERE user_id = ?'),
            addFavorite: this.db.prepare(`
                INSERT OR REPLACE INTO favorites (user_id, track_id, track_name, track_uri, artist, duration)
                VALUES (?, ?, ?, ?, ?, ?)
            `),
            removeFavorite: this.db.prepare('DELETE FROM favorites WHERE user_id = ? AND track_id = ?'),
            
            // Queue
            saveQueue: this.db.prepare(`
                INSERT OR REPLACE INTO queue (guild_id, tracks, current_track, position, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `),
            getQueue: this.db.prepare('SELECT * FROM queue WHERE guild_id = ?'),
            deleteQueue: this.db.prepare('DELETE FROM queue WHERE guild_id = ?'),
            
            // Queue History
            addToQueueHistory: this.db.prepare(`
                INSERT INTO queue_history (guild_id, track_id, track_name, track_uri, artist, duration, requested_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `),
            getQueueHistory: this.db.prepare('SELECT * FROM queue_history WHERE guild_id = ? ORDER BY played_at DESC LIMIT ?'),
            
            // Blacklist
            isBlacklisted: this.db.prepare('SELECT * FROM blacklist WHERE target_id = ?'),
            addToBlacklist: this.db.prepare(`
                INSERT OR REPLACE INTO blacklist (target_id, target_type, reason, blacklisted_by)
                VALUES (?, ?, ?, ?)
            `),
            removeFromBlacklist: this.db.prepare('DELETE FROM blacklist WHERE target_id = ?'),
            
            // Whitelist
            isWhitelisted: this.db.prepare('SELECT * FROM whitelist WHERE target_id = ?'),
            addToWhitelist: this.db.prepare(`
                INSERT OR REPLACE INTO whitelist (target_id, target_type, whitelisted_by)
                VALUES (?, ?, ?)
            `),
            removeFromWhitelist: this.db.prepare('DELETE FROM whitelist WHERE target_id = ?')
        };

        // Expired records cleanup
        this.cleanupExpiredRecords();
        setInterval(() => this.cleanupExpiredRecords(), 3600000); // Run every hour
    }

    cleanupExpiredRecords() {
        const now = new Date().toISOString();
        
        // Clean expired premium
        const expiredPremium = this.db.prepare('SELECT guild_id, guild_name FROM premium WHERE expiry_date < ? AND status = "active"').all(now);
        for (const record of expiredPremium) {
            this.statements.updatePremiumStatus.run('expired', record.guild_id);
            logger.premiumExpired({ id: record.guild_id, name: record.guild_name });
        }

        // Clean expired noprefix
        const expiredNoPrefix = this.db.prepare('SELECT user_id FROM noprefix WHERE expiry_date < ? AND status = "active"').all(now);
        for (const record of expiredNoPrefix) {
            this.statements.removeNoPrefix.run(record.user_id);
            logger.noprefixExpired(record.user_id);
        }

        if (expiredPremium.length > 0 || expiredNoPrefix.length > 0) {
            logger.info(`Cleaned up ${expiredPremium.length} expired premium and ${expiredNoPrefix.length} expired noprefix records`);
        }
    }

    // Premium methods
    isPremium(guildId) {
        const result = this.statements.getPremium.get(guildId);
        if (!result) return false;
        if (result.status !== 'active') return false;
        if (new Date(result.expiry_date) < new Date()) {
            this.statements.updatePremiumStatus.run('expired', guildId);
            return false;
        }
        return true;
    }

    getPremiumInfo(guildId) {
        return this.statements.getPremium.get(guildId);
    }

    addPremium(guildId, guildName, activatedBy, days) {
        this.statements.addPremium.run(guildId, guildName, activatedBy, days, days);
    }

    removePremium(guildId) {
        this.statements.removePremium.run(guildId);
    }

    extendPremium(guildId, days) {
        this.statements.extendPremium.run(days, days, guildId);
    }

    // NoPrefix methods
    hasNoPrefix(userId) {
        const result = this.statements.getNoPrefix.get(userId);
        if (!result) return false;
        if (result.status !== 'active') return false;
        if (new Date(result.expiry_date) < new Date()) {
            this.statements.removeNoPrefix.run(userId);
            return false;
        }
        return true;
    }

    getNoPrefixInfo(userId) {
        return this.statements.getNoPrefix.get(userId);
    }

    addNoPrefix(userId, addedBy, days) {
        this.statements.addNoPrefix.run(userId, addedBy, days, days);
    }

    removeNoPrefix(userId) {
        this.statements.removeNoPrefix.run(userId);
    }

    extendNoPrefix(userId, days) {
        this.statements.extendNoPrefix.run(days, days, userId);
    }

    // Guild methods
    getGuild(guildId) {
        return this.statements.getGuild.get(guildId);
    }

    upsertGuild(guildId, guildName) {
        this.statements.upsertGuild.run(guildId, guildName);
    }

    deleteGuild(guildId) {
        this.statements.deleteGuild.run(guildId);
    }

    // Prefix methods
    getPrefix(guildId) {
        const result = this.statements.getPrefix.get(guildId);
        return result ? result.prefix : config.defaultPrefix;
    }

    setPrefix(guildId, prefix) {
        this.statements.setPrefix.run(guildId, prefix);
    }

    // Settings methods
    getSettings(guildId) {
        let settings = this.statements.getSettings.get(guildId);
        if (!settings) {
            this.statements.upsertSettings.run(guildId);
            settings = this.statements.getSettings.get(guildId);
        }
        return settings;
    }

    updateVolume(guildId, volume) {
        this.statements.updateVolume.run(volume, guildId);
    }

    updateAutoplay(guildId, autoplay) {
        this.statements.updateAutoplay.run(autoplay ? 1 : 0, guildId);
    }

    updateLoop(guildId, loop) {
        this.statements.updateLoop.run(loop, guildId);
    }

    // Playlist methods
    getPlaylists(userId) {
        return this.statements.getPlaylists.all(userId);
    }

    getPlaylist(userId, name) {
        return this.statements.getPlaylist.get(userId, name);
    }

    createPlaylist(userId, name, isPublic = false) {
        try {
            this.statements.createPlaylist.run(userId, name, isPublic ? 1 : 0);
            return true;
        } catch (error) {
            return false;
        }
    }

    deletePlaylist(userId, name) {
        this.statements.deletePlaylist.run(userId, name);
    }

    updatePlaylist(userId, name, tracks) {
        this.statements.updatePlaylist.run(JSON.stringify(tracks), userId, name);
    }

    // Favorite methods
    getFavorites(userId) {
        return this.statements.getFavorites.all(userId);
    }

    addFavorite(userId, trackId, trackName, trackUri, artist, duration) {
        this.statements.addFavorite.run(userId, trackId, trackName, trackUri, artist, duration);
    }

    removeFavorite(userId, trackId) {
        this.statements.removeFavorite.run(userId, trackId);
    }

    // Queue methods
    saveQueue(guildId, tracks, currentTrack, position) {
        this.statements.saveQueue.run(guildId, JSON.stringify(tracks), JSON.stringify(currentTrack), position);
    }

    getQueue(guildId) {
        const result = this.statements.getQueue.get(guildId);
        if (result) {
            return {
                ...result,
                tracks: JSON.parse(result.tracks),
                current_track: result.current_track ? JSON.parse(result.current_track) : null
            };
        }
        return null;
    }

    deleteQueue(guildId) {
        this.statements.deleteQueue.run(guildId);
    }

    // Queue history methods
    addToQueueHistory(guildId, track) {
        this.statements.addToQueueHistory.run(
            guildId,
            track.id || '',
            track.title || '',
            track.uri || '',
            track.author || '',
            track.duration || 0,
            track.requester || ''
        );
    }

    getQueueHistory(guildId, limit = 50) {
        return this.statements.getQueueHistory.all(guildId, limit);
    }

    // Blacklist methods
    isBlacklisted(targetId) {
        return !!this.statements.isBlacklisted.get(targetId);
    }

    addToBlacklist(targetId, targetType, reason, blacklistedBy) {
        this.statements.addToBlacklist.run(targetId, targetType, reason, blacklistedBy);
    }

    removeFromBlacklist(targetId) {
        this.statements.removeFromBlacklist.run(targetId);
    }

    // Whitelist methods
    isWhitelisted(targetId) {
        return !!this.statements.isWhitelisted.get(targetId);
    }

    addToWhitelist(targetId, targetType, whitelistedBy) {
        this.statements.addToWhitelist.run(targetId, targetType, whitelistedBy);
    }

    removeFromWhitelist(targetId) {
        this.statements.removeFromWhitelist.run(targetId);
    }

    // Utility methods
    getAllPremium() {
        return this.db.prepare('SELECT * FROM premium WHERE status = "active"').all();
    }

    getAllNoPrefix() {
        return this.db.prepare('SELECT * FROM noprefix WHERE status = "active"').all();
    }

    getStats() {
        const guildCount = this.db.prepare('SELECT COUNT(*) as count FROM guilds').get().count;
        const premiumCount = this.db.prepare('SELECT COUNT(*) as count FROM premium WHERE status = "active"').get().count;
        const playlistCount = this.db.prepare('SELECT COUNT(*) as count FROM playlists').get().count;
        const favoriteCount = this.db.prepare('SELECT COUNT(*) as count FROM favorites').get().count;
        
        return { guildCount, premiumCount, playlistCount, favoriteCount };
    }

    close() {
        this.db.close();
    }
}

module.exports = new DatabaseManager();
