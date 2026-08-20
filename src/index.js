/**
 * Enterprise Music Bot - Main Entry Point
 * Production-ready Discord Music Bot with Kazagumo, Shoukaku, and Lavalink v4
 */

const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const config = require('../config/config');
const logger = require('../utils/Logger');
const db = require('../database/DatabaseManager');
const emojis = require('../emojis/emojis');

// Initialize Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ],
    presence: {
        activities: [{
            name: config.status.text,
            type: ActivityType[config.status.type.toUpperCase()] || ActivityType.Listening
        }],
        status: config.bot.presence.status
    }
});

// Collections
client.commands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();

// Event Handlers
client.once('ready', async () => {
    console.log(`${emojis.success} Logged in as ${client.user.tag}`);
    console.log(`${emojis.info} Serving ${client.guilds.cache.size} guilds`);
    
    // Initialize database
    await db.init();
    
    // Register commands
    await registerCommands();
    
    // Start premium expiry checker
    setInterval(checkExpirations, 3600000); // Check every hour
});

async function registerCommands() {
    const { REST, Routes } = require('@discordjs/rest');
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    const commandFiles = [];
    const fs = require('fs');
    const path = require('path');
    
    const commandDirs = ['music', 'queue', 'filters', 'info', 'owner', 'premium'];
    
    for (const dir of commandDirs) {
        const dirPath = path.join(__dirname, '../commands', dir);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
            for (const file of files) {
                const cmd = require(path.join(dirPath, file));
                if (cmd.data && cmd.execute) {
                    client.commands.set(cmd.data.name, cmd);
                    if (cmd.aliases) {
                        for (const alias of cmd.aliases) {
                            client.aliases.set(alias, cmd.data.name);
                        }
                    }
                    commandFiles.push(cmd.data.toJSON());
                }
            }
        }
    }
    
    try {
        await rest.put(Routes.applicationCommands(config.clientId), { body: commandFiles });
        logger.log('success', 'Registered application commands globally');
    } catch (error) {
        logger.log('error', `Failed to register commands: ${error.message}`);
    }
}

async function checkExpirations() {
    const expiredPremium = await db.expirePremium();
    const expiredNoPrefix = await db.expireNoPrefix();
    
    for (const p of expiredPremium) {
        logger.premiumRemoved(p.guild_id, p.guild_name);
    }
    
    for (const n of expiredNoPrefix) {
        logger.log('info', `NoPrefix expired for user ${n.user_id}`);
    }
}

// Error Handling
process.on('unhandledRejection', (reason, promise) => {
    logger.systemError(reason, 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
    logger.systemError(error, 'Uncaught Exception');
});

// Login
client.login(config.token).catch((error) => {
    logger.log('error', `Failed to login: ${error.message}`);
    process.exit(1);
});

module.exports = client;
