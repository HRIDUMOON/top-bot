/**
 * Configuration Manager
 * Loads and validates all configuration from environment variables
 * Never hardcode values - everything comes from .env
 */

require('dotenv').config();
const path = require('path');

class Config {
    constructor() {
        this.validate();
    }

    // Bot Configuration
    get token() {
        return process.env.BOT_TOKEN;
    }

    get clientId() {
        return process.env.CLIENT_ID;
    }

    get ownerIds() {
        const ids = process.env.OWNER_IDS || '';
        return ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
    }

    // Prefix Configuration
    get defaultPrefix() {
        return process.env.DEFAULT_PREFIX || '!';
    }

    // Server Links
    get supportServer() {
        return process.env.SUPPORT_SERVER || '';
    }

    get inviteLink() {
        return process.env.INVITE_LINK || '';
    }

    get website() {
        return process.env.WEBSITE || '';
    }

    // Spotify Credentials
    get spotifyClientId() {
        return process.env.SPOTIFY_CLIENT_ID || '';
    }

    get spotifyClientSecret() {
        return process.env.SPOTIFY_CLIENT_SECRET || '';
    }

    // Lavalink Configuration
    get lavalinkNodes() {
        const nodesStr = process.env.LAVALINK_NODES || '';
        if (!nodesStr) {
            return [{
                host: 'localhost',
                port: 2333,
                password: 'youshallnotpass',
                secure: false,
                name: 'default'
            }];
        }

        return nodesStr.split(',').map((node, index) => {
            const [name, host, port, password, secure] = node.split(':');
            return {
                name: name || `node-${index}`,
                host: host || 'localhost',
                port: parseInt(port) || 2333,
                password: password || 'youshallnotpass',
                secure: secure === 'true'
            };
        });
    }

    // Embed Configuration
    get embedColor() {
        const color = process.env.EMBED_COLOR || '0x5865F2';
        return parseInt(color.replace('0x', ''), 16);
    }

    // Status Configuration
    get statusType() {
        return process.env.STATUS_TYPE || 'PLAYING';
    }

    get statusText() {
        return process.env.STATUS_TEXT || 'Music | !help';
    }

    get statusAfk() {
        return process.env.STATUS_AFK === 'true';
    }

    // Webhook URLs
    get webhooks() {
        return {
            guildJoin: process.env.WEBHOOK_GUILD_JOIN || '',
            guildLeave: process.env.WEBHOOK_GUILD_LEAVE || '',
            premiumAdded: process.env.WEBHOOK_PREMIUM_ADDED || '',
            premiumRemoved: process.env.WEBHOOK_PREMIUM_REMOVED || '',
            premiumExtended: process.env.WEBHOOK_PREMIUM_EXTENDED || '',
            premiumExpired: process.env.WEBHOOK_PREMIUM_EXPIRED || '',
            noPrefixAdded: process.env.WEBHOOK_NOPREFIX_ADDED || '',
            noPrefixRemoved: process.env.WEBHOOK_NOPREFIX_REMOVED || '',
            noPrefixExtended: process.env.WEBHOOK_NOPREFIX_EXTENDED || '',
            noPrefixExpired: process.env.WEBHOOK_NOPREFIX_EXPIRED || '',
            musicErrors: process.env.WEBHOOK_MUSIC_ERRORS || '',
            commandErrors: process.env.WEBHOOK_COMMAND_ERRORS || '',
            systemErrors: process.env.WEBHOOK_SYSTEM_ERRORS || '',
            ownerActions: process.env.WEBHOOK_OWNER_ACTIONS || ''
        };
    }

    // Database Configuration
    get databasePath() {
        return process.env.DATABASE_PATH || './database/bot.db';
    }

    // Premium Configuration
    get premiumRoleId() {
        return process.env.PREMIUM_ROLE_ID || '';
    }

    get defaultVolume() {
        return parseInt(process.env.DEFAULT_VOLUME) || 80;
    }

    get maxQueueSize() {
        return parseInt(process.env.MAX_QUEUE_SIZE) || 1000;
    }

    get maxPlaylistSongs() {
        return parseInt(process.env.MAX_PLAYLIST_SONGS) || 500;
    }

    // Audio Configuration
    get audioBitrate() {
        return parseInt(process.env.AUDIO_BITRATE) || 128;
    }

    get hifiMode() {
        return process.env.HIFI_MODE === 'true';
    }

    // Rate Limiting
    get cooldownSeconds() {
        return parseInt(process.env.COOLDOWN_SECONDS) || 3;
    }

    // Cache Configuration
    get cacheMaxSize() {
        return parseInt(process.env.CACHE_MAX_SIZE) || 1000;
    }

    get cacheTTL() {
        return parseInt(process.env.CACHE_TTL) || 3600;
    }

    // Sharding Configuration
    get shardCount() {
        const count = process.env.SHARD_COUNT || 'auto';
        return count === 'auto' ? 'auto' : parseInt(count);
    }

    // Cluster Configuration
    get clusterEnabled() {
        return process.env.CLUSTER_ENABLED === 'true';
    }

    // Validation
    validate() {
        const required = ['BOT_TOKEN', 'CLIENT_ID', 'OWNER_IDS'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
            console.error('Please copy .env.example to .env and configure it properly.');
            process.exit(1);
        }

        // Validate OWNER_IDS format
        if (!this.ownerIds.length) {
            console.error('❌ OWNER_IDS must contain at least one valid Discord user ID');
            process.exit(1);
        }

        // Validate Lavalink nodes
        const nodes = this.lavalinkNodes;
        for (const node of nodes) {
            if (!node.host || !node.port || !node.password) {
                console.error('❌ Invalid Lavalink node configuration');
                process.exit(1);
            }
        }

        console.log('✅ Configuration validated successfully');
    }

    // Get absolute database path
    get absoluteDatabasePath() {
        return path.resolve(process.cwd(), this.databasePath);
    }

    // Check if user is owner
    isOwner(userId) {
        return this.ownerIds.includes(userId.toString());
    }

    // Get all config as object (for debugging)
    toJSON() {
        return {
            clientId: this.clientId,
            ownerCount: this.ownerIds.length,
            defaultPrefix: this.defaultPrefix,
            embedColor: this.embedColor,
            statusType: this.statusType,
            statusText: this.statusText,
            lavalinkNodes: this.lavalinkNodes.length,
            databasePath: this.databasePath,
            defaultVolume: this.defaultVolume,
            maxQueueSize: this.maxQueueSize,
            cooldownSeconds: this.cooldownSeconds,
            shardCount: this.shardCount,
            clusterEnabled: this.clusterEnabled
        };
    }
}

// Export singleton instance
module.exports = new Config();
