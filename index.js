/**
 * Main Bot Entry Point
 * Enterprise Discord Music Bot with Kazagumo, Shoukaku, and Lavalink v4
 */

const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { Kazagumo } = require('kazagumo');
const { Shoukaku } = require('shoukaku');
const config = require('./config/config');
const logger = require('./utils/logger');
const db = require('./database/managers/database');
const emojis = require('./emojis/index');

// Initialize handlers
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');
const PlayerManager = require('./managers/playerManager');

class MusicBot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            allowedMentions: { parse: ['users', 'roles'] },
            rest: {
                offset: 5,
                timeout: 60000
            }
        });

        this.commands = new Collection();
        this.aliases = new Collection();
        this.cooldowns = new Collection();
        this.playerManager = null;
        this.kazagumo = null;
        this.startTime = Date.now();
        
        // Anti-crash handlers
        this.setupAntiCrash();
    }

    setupAntiCrash() {
        process.on('unhandledRejection', (reason, promise) => {
            logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
        });

        process.on('uncaughtException', (error) => {
            logger.systemError('Uncaught Exception', error);
        });

        process.on('SIGINT', () => {
            logger.info('Received SIGINT, shutting down gracefully...');
            this.destroy();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            logger.info('Received SIGTERM, shutting down gracefully...');
            this.destroy();
            process.exit(0);
        });

        process.on('warning', (warning) => {
            logger.warn(`Warning: ${warning.message}`);
        });
    }

    async connectToLavalink() {
        const nodes = config.lavalink.nodes.length > 0 
            ? config.lavalink.nodes 
            : [{
                name: 'default',
                host: config.lavalink.host,
                port: config.lavalink.port,
                password: config.lavalink.password,
                secure: config.lavalink.secure
            }];

        try {
            const shoukaku = new Shoukaku(this.rest, nodes, {
                moveOnDisconnect: false,
                resume: true,
                reconnect: {
                    enabled: true,
                    retries: Infinity,
                    interval: 5000
                },
                restTimeout: 60000
            });

            this.kazagumo = new Kazagumo([shoukaku], {
                send: (guildId, payload) => {
                    const guild = this.guilds.cache.get(guildId);
                    if (guild) guild.shard.send(payload);
                },
                defaultSearchEngine: 'youtube',
                refreshInterval: 3600000
            });

            // Kazagumo events
            this.kazagumo.on('nodeConnect', (node) => {
                logger.success(`Lavalink node connected: ${node.name}`);
            });

            this.kazagumo.on('nodeClose', (node, code, reason) => {
                logger.warn(`Lavalink node closed: ${node.name}`, { code, reason });
            });

            this.kazagumo.on('nodeError', (node, error) => {
                logger.error(`Lavalink node error: ${node.name}`, { error: error.message });
            });

            this.kazagumo.on('nodeReconnect', (node) => {
                logger.info(`Lavalink node reconnecting: ${node.name}`);
            });

            this.kazagumo.on('playerCreate', (player) => {
                logger.info(`Player created for guild: ${player.guildId}`);
            });

            this.kazagumo.on('playerDestroy', (player) => {
                logger.info(`Player destroyed for guild: ${player.guildId}`);
            });

            this.kazagumo.on('playerMove', (player, oldChannel, newChannel) => {
                logger.info(`Player moved in guild: ${player.guildId}`, { oldChannel, newChannel });
            });

            this.kazagumo.on('playerQueueEnd', (player) => {
                this.playerManager.handleQueueEnd(player);
            });

            this.kazagumo.on('playerStuck', (player, track, payload) => {
                logger.warn(`Player stuck in guild: ${player.guildId}`);
                this.playerManager.handlePlayerStuck(player, track, payload);
            });

            this.kazagumo.on('playerException', (player, track, exception) => {
                logger.musicError(exception, player.guildId, track?.title);
                this.playerManager.handlePlayerException(player, track, exception);
            });

            // Node failover handling
            shoukaku.on('ready', (name, reconnected) => {
                if (reconnected) {
                    logger.success(`Lavalink node reconnected: ${name}`);
                } else {
                    logger.success(`Lavalink node ready: ${name}`);
                }
            });

            shoukaku.on('error', (name, error) => {
                logger.error(`Lavalink node error: ${name}`, { error: error.message });
            });

            shoukaku.on('close', (name, code, reason) => {
                logger.warn(`Lavalink node closed: ${name}`, { code, reason });
            });

            logger.success('Kazagumo initialized successfully');
            return true;
        } catch (error) {
            logger.systemError('Failed to initialize Kazagumo', error);
            return false;
        }
    }

    async login() {
        if (!config.token) {
            logger.error('BOT_TOKEN not found in environment variables. Please check your .env file.');
            process.exit(1);
        }

        try {
            await super.login(config.token);
        } catch (error) {
            logger.systemError('Failed to login', error);
            process.exit(1);
        }
    }

    async start() {
        logger.info('Starting Enterprise Music Bot...');
        
        // Initialize database
        logger.info('Initializing database...');
        
        // Load commands
        logger.info('Loading commands...');
        CommandHandler.loadAllCommands(this);
        
        // Setup events
        logger.info('Setting up event handlers...');
        EventHandler.setupEvents(this);
        
        // Connect to Lavalink
        logger.info('Connecting to Lavalink...');
        const connected = await this.connectToLavalink();
        if (!connected) {
            logger.warn('Failed to connect to Lavalink. Bot will continue without music functionality.');
        }
        
        // Initialize player manager
        this.playerManager = new PlayerManager(this);
        
        // Login
        await this.login();
    }
}

const bot = new MusicBot();
bot.start();

module.exports = bot;
