/**
 * SQLite Database Manager
 * Handles all database operations with SQL middleware
 */

const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config/config');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = path.resolve(config.database.path);
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Database connection error:', err);
                    reject(err);
                    return;
                }
                console.log('Connected to SQLite database');
                this.createTables().then(resolve).catch(reject);
            });
        });
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS guilds (
                guild_id TEXT PRIMARY KEY,
                guild_name TEXT,
                prefix TEXT DEFAULT '!',
                dj_role TEXT,
                dj_channel TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT,
                discriminator TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS premium (
                guild_id TEXT PRIMARY KEY,
                guild_name TEXT,
                activated_by TEXT,
                activated_date DATETIME,
                expiry_date DATETIME,
                remaining_days INTEGER,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS noprefix (
                user_id TEXT PRIMARY KEY,
                added_by TEXT,
                added_date DATETIME,
                expiry_date DATETIME,
                remaining_days INTEGER,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS prefixes (
                guild_id TEXT PRIMARY KEY,
                prefix TEXT DEFAULT '!',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS settings (
                guild_id TEXT PRIMARY KEY,
                volume INTEGER DEFAULT 80,
                loop_mode TEXT DEFAULT 'off',
                autoplay_enabled INTEGER DEFAULT 0,
                dj_mode_enabled INTEGER DEFAULT 0,
                twentyfourseven_enabled INTEGER DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                guild_id TEXT,
                name TEXT,
                tracks TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                track_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS queue_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                track_data TEXT,
                played_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                user_id TEXT,
                action TEXT,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS blacklist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                user_id TEXT,
                reason TEXT,
                blacklisted_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS queue_backup (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT,
                queue_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }
        
        // Create indexes for better performance
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_premium_expiry ON premium(expiry_date)',
            'CREATE INDEX IF NOT EXISTS idx_noprefix_expiry ON noprefix(expiry_date)',
            'CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_queue_history_guild ON queue_history(guild_id)'
        ];

        for (const index of indexes) {
            await this.run(index);
        }

        console.log('Database tables created successfully');
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('SQL Error:', err);
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('SQL Error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('SQL Error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Guild Methods
    async getGuild(guildId) {
        return await this.get('SELECT * FROM guilds WHERE guild_id = ?', [guildId]);
    }

    async createGuild(guildId, guildName) {
        await this.run(
            'INSERT OR IGNORE INTO guilds (guild_id, guild_name) VALUES (?, ?)',
            [guildId, guildName]
        );
        await this.run(
            'INSERT OR IGNORE INTO settings (guild_id) VALUES (?)',
            [guildId]
        );
    }

    async updateGuildPrefix(guildId, prefix) {
        await this.run(
            'INSERT OR REPLACE INTO prefixes (guild_id, prefix, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [guildId, prefix]
        );
    }

    async getGuildPrefix(guildId) {
        const result = await this.get('SELECT prefix FROM prefixes WHERE guild_id = ?', [guildId]);
        return result?.prefix || config.defaultPrefix;
    }

    // Premium Methods
    async getPremium(guildId) {
        return await this.get('SELECT * FROM premium WHERE guild_id = ?', [guildId]);
    }

    async addPremium(guildId, guildName, activatedBy, days) {
        const activatedDate = new Date();
        const expiryDate = new Date(activatedDate.getTime() + (days * 24 * 60 * 60 * 1000));
        await this.run(
            `INSERT OR REPLACE INTO premium 
             (guild_id, guild_name, activated_by, activated_date, expiry_date, remaining_days, status)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, 'active')`,
            [guildId, guildName, activatedBy, expiryDate.toISOString(), days]
        );
    }

    async removePremium(guildId) {
        await this.run('DELETE FROM premium WHERE guild_id = ?', [guildId]);
    }

    async extendPremium(guildId, days) {
        const premium = await this.getPremium(guildId);
        if (!premium) return false;
        
        const currentExpiry = new Date(premium.expiry_date);
        const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000));
        const remainingDays = Math.floor((newExpiry - new Date()) / (24 * 60 * 60 * 1000));
        
        await this.run(
            'UPDATE premium SET expiry_date = ?, remaining_days = ? WHERE guild_id = ?',
            [newExpiry.toISOString(), remainingDays, guildId]
        );
        return true;
    }

    async checkPremium(guildId) {
        const premium = await this.getPremium(guildId);
        if (!premium) return false;
        
        const now = new Date();
        const expiry = new Date(premium.expiry_date);
        
        if (now > expiry) {
            await this.removePremium(guildId);
            return false;
        }
        return true;
    }

    async expirePremium() {
        const expired = await this.all(
            "SELECT * FROM premium WHERE expiry_date < CURRENT_TIMESTAMP AND status = 'active'"
        );
        
        for (const p of expired) {
            await this.run(
                "UPDATE premium SET status = 'expired', remaining_days = 0 WHERE guild_id = ?",
                [p.guild_id]
            );
        }
        
        return expired;
    }

    // NoPrefix Methods
    async getNoPrefix(userId) {
        return await this.get('SELECT * FROM noprefix WHERE user_id = ?', [userId]);
    }

    async addNoPrefix(userId, addedBy, days) {
        const addedDate = new Date();
        const expiryDate = new Date(addedDate.getTime() + (days * 24 * 60 * 60 * 1000));
        await this.run(
            `INSERT OR REPLACE INTO noprefix 
             (user_id, added_by, added_date, expiry_date, remaining_days, status)
             VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, 'active')`,
            [userId, addedBy, expiryDate.toISOString(), days]
        );
    }

    async removeNoPrefix(userId) {
        await this.run('DELETE FROM noprefix WHERE user_id = ?', [userId]);
    }

    async extendNoPrefix(userId, days) {
        const noprefix = await this.getNoPrefix(userId);
        if (!noprefix) return false;
        
        const currentExpiry = new Date(noprefix.expiry_date);
        const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000));
        const remainingDays = Math.floor((newExpiry - new Date()) / (24 * 60 * 60 * 1000));
        
        await this.run(
            'UPDATE noprefix SET expiry_date = ?, remaining_days = ? WHERE user_id = ?',
            [newExpiry.toISOString(), remainingDays, userId]
        );
        return true;
    }

    async checkNoPrefix(userId) {
        const noprefix = await this.getNoPrefix(userId);
        if (!noprefix) return false;
        
        const now = new Date();
        const expiry = new Date(noprefix.expiry_date);
        
        if (now > expiry) {
            await this.removeNoPrefix(userId);
            return false;
        }
        return true;
    }

    async expireNoPrefix() {
        const expired = await this.all(
            "SELECT * FROM noprefix WHERE expiry_date < CURRENT_TIMESTAMP AND status = 'active'"
        );
        
        for (const n of expired) {
            await this.run(
                "UPDATE noprefix SET status = 'expired', remaining_days = 0 WHERE user_id = ?",
                [n.user_id]
            );
        }
        
        return expired;
    }

    // Settings Methods
    async getSettings(guildId) {
        return await this.get('SELECT * FROM settings WHERE guild_id = ?', [guildId]);
    }

    async updateSettings(guildId, settings) {
        const { volume, loop_mode, autoplay_enabled, dj_mode_enabled, twentyfourseven_enabled } = settings;
        await this.run(
            `INSERT OR REPLACE INTO settings 
             (guild_id, volume, loop_mode, autoplay_enabled, dj_mode_enabled, twentyfourseven_enabled, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [guildId, volume ?? 80, loop_mode ?? 'off', autoplay_enabled ?? 0, dj_mode_enabled ?? 0, twentyfourseven_enabled ?? 0]
        );
    }

    // Playlist Methods
    async createPlaylist(userId, guildId, name, tracks) {
        await this.run(
            'INSERT INTO playlists (user_id, guild_id, name, tracks) VALUES (?, ?, ?, ?)',
            [userId, guildId, name, JSON.stringify(tracks)]
        );
    }

    async getPlaylists(userId) {
        return await this.all('SELECT * FROM playlists WHERE user_id = ?', [userId]);
    }

    async getPlaylist(id) {
        return await this.get('SELECT * FROM playlists WHERE id = ?', [id]);
    }

    async deletePlaylist(id, userId) {
        await this.run('DELETE FROM playlists WHERE id = ? AND user_id = ?', [id, userId]);
    }

    // Favorites Methods
    async addFavorite(userId, trackData) {
        await this.run(
            'INSERT INTO favorites (user_id, track_data) VALUES (?, ?)',
            [userId, JSON.stringify(trackData)]
        );
    }

    async getFavorites(userId) {
        return await this.all('SELECT * FROM favorites WHERE user_id = ?', [userId]);
    }

    async removeFavorite(id, userId) {
        await this.run('DELETE FROM favorites WHERE id = ? AND user_id = ?', [id, userId]);
    }

    // Queue History Methods
    async addToQueueHistory(guildId, trackData) {
        await this.run(
            'INSERT INTO queue_history (guild_id, track_data) VALUES (?, ?)',
            [guildId, JSON.stringify(trackData)]
        );
    }

    async getQueueHistory(guildId, limit = 50) {
        return await this.all(
            'SELECT * FROM queue_history WHERE guild_id = ? ORDER BY played_at DESC LIMIT ?',
            [guildId, limit]
        );
    }

    async clearQueueHistory(guildId) {
        await this.run('DELETE FROM queue_history WHERE guild_id = ?', [guildId]);
    }

    // Blacklist Methods
    async addToBlacklist(guildId, userId, reason, blacklistedBy) {
        await this.run(
            'INSERT INTO blacklist (guild_id, user_id, reason, blacklisted_by) VALUES (?, ?, ?, ?)',
            [guildId, userId, reason, blacklistedBy]
        );
    }

    async removeFromBlacklist(guildId, userId) {
        await this.run('DELETE FROM blacklist WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
    }

    async isBlacklisted(guildId, userId) {
        const result = await this.get(
            'SELECT * FROM blacklist WHERE guild_id = ? AND user_id = ?',
            [guildId, userId]
        );
        return !!result;
    }

    // Queue Backup Methods
    async backupQueue(guildId, queueData) {
        await this.run(
            'INSERT INTO queue_backup (guild_id, queue_data) VALUES (?, ?)',
            [guildId, JSON.stringify(queueData)]
        );
    }

    async getQueueBackup(guildId) {
        return await this.get(
            'SELECT * FROM queue_backup WHERE guild_id = ? ORDER BY created_at DESC LIMIT 1',
            [guildId]
        );
    }

    async clearQueueBackup(guildId) {
        await this.run('DELETE FROM queue_backup WHERE guild_id = ?', [guildId]);
    }

    // Utility Methods
    async getAllPremium() {
        return await this.all("SELECT * FROM premium WHERE status = 'active'");
    }

    async getAllNoPrefix() {
        return await this.all("SELECT * FROM noprefix WHERE status = 'active'");
    }

    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = new DatabaseManager();
