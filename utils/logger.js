/**
 * Logger System
 * Professional logging with webhook support
 */

const { EmbedBuilder, WebhookClient } = require('discord.js');
const config = require('../config/config');
const emojis = require('../emojis/index');
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = config.paths.logs;
        this.ensureLogDirectory();
        
        // Initialize webhook clients if URLs are provided
        this.webhooks = {};
        this.initializeWebhooks();
    }

    initializeWebhooks() {
        const webhookConfig = config.webhooks;
        for (const [name, url] of Object.entries(webhookConfig)) {
            if (url && url.startsWith('https://discord.com/api/webhooks/')) {
                try {
                    this.webhooks[name] = new WebhookClient({ url });
                } catch (error) {
                    console.warn(`Failed to initialize webhook ${name}: ${error.message}`);
                }
            }
        }
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    getFormattedTime() {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    getFormattedDate() {
        return new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    getColor(level) {
        const colors = {
            info: 0x5865F2,
            success: 0x57F287,
            warning: 0xFEE75C,
            error: 0xED4245,
            music: 0x5865F2,
            command: 0x99AAB5,
            system: 0x2ECC71,
            premium: 0xFEE75C,
            owner: 0xFFA500
        };
        return colors[level] || 0x5865F2;
    }

    getEmoji(level) {
        const emojiMap = {
            info: emojis.info,
            success: emojis.success,
            warning: emojis.warning,
            error: emojis.error,
            music: emojis.music.nowPlaying,
            command: emojis.utility.settings,
            system: emojis.owner.tools,
            premium: emojis.premium.badge,
            owner: emojis.owner.crown
        };
        return emojiMap[level] || emojis.info;
    }

    formatMessage(level, message, data = {}) {
        const date = this.getFormattedDate();
        const time = this.getFormattedTime();
        const emoji = this.getEmoji(level);
        return `[${date} ${time}] [${emoji}] [${level.toUpperCase()}] ${message}${Object.keys(data).length ? ' | ' + JSON.stringify(data) : ''}`;
    }

    writeToFile(level, message) {
        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `bot-${date}.log`);
        const logMessage = `[${this.getTimestamp()}] [${level.toUpperCase()}] ${message}\n`;
        
        fs.appendFileSync(logFile, logMessage, 'utf8');
    }

    async sendWebhook(type, embed) {
        const webhookName = this.getWebhookNameForType(type);
        if (this.webhooks[webhookName]) {
            try {
                await this.webhooks[webhookName].send({
                    username: 'Music Bot Logs',
                    avatarURL: 'https://i.imgur.com/AfFp7pu.png',
                    embeds: [embed]
                }).catch(() => {});
            } catch (error) {
                console.warn(`Failed to send webhook ${webhookName}: ${error.message}`);
            }
        }
    }

    getWebhookNameForType(type) {
        const mapping = {
            guildJoin: 'guildJoin',
            guildLeave: 'guildLeave',
            premiumAdded: 'premiumAdded',
            premiumRemoved: 'premiumRemoved',
            premiumExtended: 'premiumExtended',
            premiumExpired: 'premiumExpired',
            noPrefixAdded: 'noPrefixAdded',
            noPrefixRemoved: 'noPrefixRemoved',
            noPrefixExtended: 'noPrefixExtended',
            noPrefixExpired: 'noPrefixExpired',
            musicError: 'musicErrors',
            commandError: 'commandErrors',
            systemError: 'systemErrors',
            ownerAction: 'ownerActions'
        };
        return mapping[type] || 'systemErrors';
    }

    createEmbed(level, title, description, fields = []) {
        return new EmbedBuilder()
            .setColor(this.getColor(level))
            .setTitle(`${this.getEmoji(level)} ${title}`)
            .setDescription(description)
            .addFields(fields)
            .setTimestamp()
            .setFooter({ text: 'Enterprise Music Bot Logger' });
    }

    info(message, data = {}, webhookType = null) {
        console.log(this.formatMessage('info', message, data));
        this.writeToFile('info', message);
        
        if (webhookType && this.webhooks[webhookType]) {
            const embed = this.createEmbed('info', 'Information', message, 
                Object.entries(data).map(([key, value]) => ({ name: key, value: String(value), inline: true })));
            this.sendWebhook(webhookType, embed);
        }
    }

    success(message, data = {}, webhookType = null) {
        console.log(this.formatMessage('success', message, data));
        this.writeToFile('success', message);
        
        if (webhookType && this.webhooks[webhookType]) {
            const embed = this.createEmbed('success', 'Success', message,
                Object.entries(data).map(([key, value]) => ({ name: key, value: String(value), inline: true })));
            this.sendWebhook(webhookType, embed);
        }
    }

    warn(message, data = {}) {
        console.warn(this.formatMessage('warning', message, data));
        this.writeToFile('warning', message);
    }

    error(message, data = {}, webhookType = 'error') {
        console.error(this.formatMessage('error', message, data));
        this.writeToFile('error', message);
        
        if (this.webhooks[webhookType]) {
            const embed = this.createEmbed('error', 'Error Occurred', message,
                Object.entries(data).map(([key, value]) => ({ name: key, value: String(value), inline: true })));
            this.sendWebhook(webhookType, embed);
        }
    }

    // Specific log methods for different events
    guildJoin(guild, memberCount) {
        this.success(`Joined guild: ${guild.name}`, {
            'Guild ID': guild.id,
            'Members': memberCount,
            'Owner': guild.ownerId
        }, 'guild');
    }

    guildLeave(guild, memberCount) {
        this.info(`Left guild: ${guild.name}`, {
            'Guild ID': guild.id,
            'Members': memberCount,
            'Owner': guild.ownerId
        }, 'guild');
    }

    premiumAdded(guild, days, activatedBy) {
        this.success(`Premium activated for ${guild.name}`, {
            'Guild ID': guild.id,
            'Duration': `${days} days`,
            'Activated By': activatedBy
        }, 'premium');
    }

    premiumRemoved(guild, removedBy) {
        this.warn(`Premium removed from ${guild.name}`, {
            'Guild ID': guild.id,
            'Removed By': removedBy
        }, 'premium');
    }

    premiumExtended(guild, days, extendedBy) {
        this.success(`Premium extended for ${guild.name}`, {
            'Guild ID': guild.id,
            'Extension': `${days} days`,
            'Extended By': extendedBy
        }, 'premium');
    }

    premiumExpired(guild) {
        this.warn(`Premium expired for ${guild.name}`, {
            'Guild ID': guild.id
        }, 'premium');
    }

    noprefixAdded(user, days, addedBy) {
        this.success(`NoPrefix added for user`, {
            'User ID': user,
            'Duration': `${days} days`,
            'Added By': addedBy
        }, 'premium');
    }

    noprefixRemoved(user, removedBy) {
        this.warn(`NoPrefix removed from user`, {
            'User ID': user,
            'Removed By': removedBy
        }, 'premium');
    }

    noprefixExtended(user, days, extendedBy) {
        this.success(`NoPrefix extended for user`, {
            'User ID': user,
            'Extension': `${days} days`,
            'Extended By': extendedBy
        }, 'premium');
    }

    noprefixExpired(user) {
        this.warn(`NoPrefix expired for user`, {
            'User ID': user
        }, 'premium');
    }

    musicError(error, guildId, track) {
        this.error(`Music playback error: ${error.message}`, {
            'Guild ID': guildId,
            'Track': track || 'Unknown',
            'Error': error.message
        }, 'musicError');
    }

    commandError(command, userId, guildId, error) {
        this.error(`Command execution error`, {
            'Command': command,
            'User ID': userId,
            'Guild ID': guildId,
            'Error': error.message
        }, 'commandError');
    }

    systemError(context, error) {
        this.error(`System error in ${context}`, {
            'Context': context,
            'Error': error.message,
            'Stack': error.stack?.substring(0, 1000) || 'No stack trace'
        }, 'systemError');
    }

    ownerAction(action, ownerId, details = {}) {
        this.info(`Owner action: ${action}`, {
            'Owner ID': ownerId,
            ...details
        }, 'ownerAction');
    }
}

module.exports = new Logger();
