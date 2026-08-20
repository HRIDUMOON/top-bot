/**
 * Configuration Manager
 * Loads all configuration from environment variables
 */

require('dotenv').config();

module.exports = {
    // Discord Configuration
    token: process.env.BOT_TOKEN,
    clientId: process.env.CLIENT_ID,
    ownerIds: process.env.OWNER_IDS?.split(',') || [],
    defaultPrefix: process.env.DEFAULT_PREFIX || '!',
    
    // Server Links
    supportServer: process.env.SUPPORT_SERVER || '',
    inviteLink: process.env.INVITE_LINK || '',
    website: process.env.WEBSITE || '',
    
    // Spotify Credentials
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || ''
    },
    
    // Lavalink Configuration
    lavalink: {
        nodes: JSON.parse(process.env.LAVALINK_NODES || '[]'),
        secure: process.env.LAVALINK_SECURE === 'true',
        retryAttempts: parseInt(process.env.LAVALINK_RETRY_ATTEMPTS) || 5,
        retryDelay: parseInt(process.env.LAVALINK_RETRY_DELAY) || 10000
    },
    
    // Embed Configuration
    embed: {
        color: parseInt(process.env.EMBED_COLOR) || 0x5865F2,
        footer: process.env.EMBED_FOOTER || 'Enterprise Music Bot'
    },
    
    // Status Configuration
    status: {
        type: process.env.STATUS_TYPE || 'LISTENING',
        text: process.env.STATUS_TEXT || 'Music | !help'
    },
    
    // Webhook URLs
    webhooks: {
        guildJoin: process.env.GUILD_JOIN_WEBHOOK || '',
        guildLeave: process.env.GUILD_LEAVE_WEBHOOK || '',
        premiumAdded: process.env.PREMIUM_ADDED_WEBHOOK || '',
        premiumRemoved: process.env.PREMIUM_REMOVED_WEBHOOK || '',
        premiumExtended: process.env.PREMIUM_EXTENDED_WEBHOOK || '',
        premiumExpired: process.env.PREMIUM_EXPIRED_WEBHOOK || '',
        noPrefixAdded: process.env.NOPREFIX_ADDED_WEBHOOK || '',
        noPrefixRemoved: process.env.NOPREFIX_REMOVED_WEBHOOK || '',
        noPrefixExtended: process.env.NOPREFIX_EXTENDED_WEBHOOK || '',
        noPrefixExpired: process.env.NOPREFIX_EXPIRED_WEBHOOK || '',
        musicErrors: process.env.MUSIC_ERRORS_WEBHOOK || '',
        commandErrors: process.env.COMMAND_ERRORS_WEBHOOK || '',
        systemErrors: process.env.SYSTEM_ERRORS_WEBHOOK || '',
        ownerActions: process.env.OWNER_ACTIONS_WEBHOOK || ''
    },
    
    // Database Configuration
    database: {
        path: process.env.DATABASE_PATH || './database/bot.db'
    },
    
    // Premium Configuration
    premium: {
        roleId: process.env.PREMIUM_ROLE_ID || '',
        defaultVolume: parseInt(process.env.DEFAULT_VOLUME) || 80
    },
    
    // Bot Settings
    bot: {
        autoReconnect: process.env.AUTO_RECONNECT !== 'false',
        shardCount: process.env.SHARD_COUNT === 'auto' ? 'auto' : parseInt(process.env.SHARD_COUNT) || 1,
        clusterEnabled: process.env.CLUSTER_ENABLED === 'true',
        presence: {
            afk: false,
            status: 'online'
        }
    },
    
    // Feature Flags
    features: {
        enable247: true,
        enableAutoplay: true,
        enableFilters: true,
        enablePlaylists: true,
        enableFavorites: true,
        enableQueueHistory: true
    },
    
    // Cooldowns (in seconds)
    cooldowns: {
        default: 3,
        music: 2,
        owner: 5,
        premium: 1
    },
    
    // Limits
    limits: {
        maxQueueSize: 1000,
        maxPlaylistSize: 500,
        maxSearchResults: 10,
        maxLyricsLength: 2000,
        maxMessageLength: 2000
    }
};
