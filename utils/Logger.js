/**
 * Logger System with Webhook Support
 */

const config = require('../config/config');
const { EmbedBuilder, WebhookClient } = require('discord.js');
const emojis = require('../emojis/emojis');

class Logger {
    constructor() {
        this.webhooks = {};
        this.initWebhooks();
    }

    initWebhooks() {
        if (config.webhooks.guildJoin) this.webhooks.guildJoin = new WebhookClient({ url: config.webhooks.guildJoin });
        if (config.webhooks.guildLeave) this.webhooks.guildLeave = new WebhookClient({ url: config.webhooks.guildLeave });
        if (config.webhooks.premiumAdded) this.webhooks.premiumAdded = new WebhookClient({ url: config.webhooks.premiumAdded });
        if (config.webhooks.premiumRemoved) this.webhooks.premiumRemoved = new WebhookClient({ url: config.webhooks.premiumRemoved });
        if (config.webhooks.commandErrors) this.webhooks.commandErrors = new WebhookClient({ url: config.webhooks.commandErrors });
        if (config.webhooks.systemErrors) this.webhooks.systemErrors = new WebhookClient({ url: config.webhooks.systemErrors });
        if (config.webhooks.ownerActions) this.webhooks.ownerActions = new WebhookClient({ url: config.webhooks.ownerActions });
    }

    log(type, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logTypes = {
            info: '\x1b[34m[INFO]\x1b[0m',
            success: '\x1b[32m[SUCCESS]\x1b[0m',
            error: '\x1b[31m[ERROR]\x1b[0m',
            warning: '\x1b[33m[WARNING]\x1b[0m',
            debug: '\x1b[36m[DEBUG]\x1b[0m',
            music: '\x1b[35m[MUSIC]\x1b[0m',
            command: '\x1b[37m[COMMAND]\x1b[0m'
        };

        const prefix = logTypes[type] || logTypes.info;
        console.log(`${prefix} [${timestamp}] ${message}`, Object.keys(data).length ? data : '');
    }

    async sendWebhook(type, embed) {
        if (!this.webhooks[type]) return;
        try {
            await this.webhooks[type].send({ embeds: [embed] });
        } catch (error) {
            this.log('error', `Failed to send webhook ${type}: ${error.message}`);
        }
    }

    guildJoin(guild, memberCount) {
        this.log('success', `Joined guild: ${guild.name} (${guild.id})`);
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`${emojis.success} Joined Guild`)
            .addFields(
                { name: 'Guild Name', value: guild.name, inline: true },
                { name: 'Guild ID', value: guild.id, inline: true },
                { name: 'Member Count', value: memberCount.toString(), inline: true }
            )
            .setTimestamp();
        this.sendWebhook('guildJoin', embed);
    }

    guildLeave(guild, memberCount) {
        this.log('info', `Left guild: ${guild.name} (${guild.id})`);
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`${emojis.error} Left Guild`)
            .addFields(
                { name: 'Guild Name', value: guild.name, inline: true },
                { name: 'Guild ID', value: guild.id, inline: true },
                { name: 'Member Count', value: memberCount.toString(), inline: true }
            )
            .setTimestamp();
        this.sendWebhook('guildLeave', embed);
    }

    premiumAdded(guildId, guildName, activatedBy, days) {
        this.log('success', `Premium added to ${guildName} for ${days} days`);
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`${emojis.premium.badge} Premium Added`)
            .addFields(
                { name: 'Guild', value: `${guildName} (${guildId})`, inline: false },
                { name: 'Activated By', value: `<@${activatedBy}>`, inline: true },
                { name: 'Duration', value: `${days} days`, inline: true }
            )
            .setTimestamp();
        this.sendWebhook('premiumAdded', embed);
    }

    premiumRemoved(guildId, guildName) {
        this.log('info', `Premium removed from ${guildName}`);
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`${emojis.premium.locked} Premium Removed`)
            .addFields(
                { name: 'Guild', value: `${guildName} (${guildId})`, inline: false }
            )
            .setTimestamp();
        this.sendWebhook('premiumRemoved', embed);
    }

    commandError(command, error, guildId, userId) {
        this.log('error', `Command error in ${command}: ${error.message}`);
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`${emojis.error} Command Error`)
            .addFields(
                { name: 'Command', value: command, inline: true },
                { name: 'Guild', value: guildId, inline: true },
                { name: 'User', value: `<@${userId}>`, inline: true },
                { name: 'Error', value: `\`\`\`${error.message}\`\`\``, inline: false }
            )
            .setTimestamp();
        this.sendWebhook('commandErrors', embed);
    }

    systemError(error, context = '') {
        this.log('error', `System error: ${error.message} ${context}`);
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`${emojis.error} System Error`)
            .setDescription(`\`\`\`${error.stack || error.message}\`\`\``)
            .setTimestamp();
        this.sendWebhook('systemErrors', embed);
    }

    ownerAction(action, executor, details = '') {
        this.log('warning', `Owner action: ${action} by ${executor}`);
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle(`${emojis.owner.crown} Owner Action`)
            .addFields(
                { name: 'Action', value: action, inline: true },
                { name: 'Executor', value: `<@${executor}>`, inline: true },
                { name: 'Details', value: details || 'None', inline: false }
            )
            .setTimestamp();
        this.sendWebhook('ownerActions', embed);
    }

    musicError(error, guildId) {
        this.log('music', `Music error: ${error.message}`);
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`${emojis.player.error} Music Error`)
            .setDescription(`\`\`\`${error.message}\`\`\``)
            .addFields({ name: 'Guild', value: guildId, inline: true })
            .setTimestamp();
        this.sendWebhook('musicErrors', embed);
    }
}

module.exports = new Logger();
