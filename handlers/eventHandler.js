/**
 * Event Handler
 * Sets up all bot event listeners
 */

const { Events } = require('discord.js');
const config = require('../config/config');
const logger = require('../utils/logger');
const db = require('../database/managers/database');

class EventHandler {
    static setupEvents(client) {
        // Ready event
        client.once(Events.ClientReady, async () => {
            logger.success(`Bot logged in as ${client.user.tag}`);
            logger.info(`Serving ${client.guilds.cache.size} guilds`);
            
            // Set presence
            this.setPresence(client);
            
            // Update guild data
            for (const guild of client.guilds.cache.values()) {
                db.upsertGuild(guild.id, guild.name);
            }
        });

        // Guild join
        client.on(Events.GuildCreate, (guild) => {
            db.upsertGuild(guild.id, guild.name);
            logger.guildJoin(guild, guild.memberCount);
        });

        // Guild leave
        client.on(Events.GuildDelete, (guild) => {
            db.deleteGuild(guild.id);
            logger.guildLeave(guild, guild.memberCount);
            
            // Clean up player if exists
            const player = client.kazagumo?.players.get(guild.id);
            if (player) {
                player.destroy();
            }
        });

        // Interaction handler
        client.on(Events.InteractionCreate, async (interaction) => {
            try {
                if (interaction.isChatInputCommand()) {
                    await this.handleSlashCommand(client, interaction);
                } else if (interaction.isButton()) {
                    await this.handleButtonInteraction(client, interaction);
                } else if (interaction.isStringSelectMenu() || interaction.isAnySelectMenu()) {
                    await this.handleSelectMenuInteraction(client, interaction);
                } else if (interaction.isModalSubmit()) {
                    await this.handleModalSubmit(client, interaction);
                }
            } catch (error) {
                logger.error('Interaction error', { 
                    type: interaction.type,
                    user: interaction.user?.id,
                    guild: interaction.guild?.id,
                    error: error.message 
                });
                
                if (!interaction.replied && !interaction.deferred) {
                    try {
                        await interaction.reply({ 
                            content: 'An error occurred while processing your request.', 
                            ephemeral: true 
                        }).catch(() => {});
                    } catch {}
                }
            }
        });

        // Message handler for prefix and mention commands
        client.on(Events.MessageCreate, async (message) => {
            if (message.author.bot || !message.guild) return;
            
            try {
                await this.handleMessageCommand(client, message);
            } catch (error) {
                logger.error('Message command error', { 
                    user: message.author.id,
                    guild: message.guild.id,
                    error: error.message 
                });
            }
        });

        // Voice state update
        client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
            try {
                await this.handleVoiceStateUpdate(client, oldState, newState);
            } catch (error) {
                logger.error('Voice state update error', { error: error.message });
            }
        });

        // Error handling
        client.on(Events.Error, (error) => {
            logger.error('Client error', { error: error.message });
        });

        client.on(Events.Warn, (info) => {
            logger.warn('Client warning', { info });
        });

        client.on(Events.ShardError, (error, shardId) => {
            logger.error(`Shard ${shardId} error`, { error: error.message });
        });

        client.on(Events.ShardDisconnect, (event, shardId) => {
            logger.warn(`Shard ${shardId} disconnected`, event);
        });

        client.on(Events.ShardReconnecting, (shardId) => {
            logger.info(`Shard ${shardId} reconnecting`);
        });

        client.on(Events.ShardResume, (shardId, replayedEvents) => {
            logger.success(`Shard ${shardId} resumed`, { replayedEvents });
        });
    }

    static setPresence(client) {
        const activityType = config.activityTypes[config.status.type] || 0;
        
        client.user.setPresence({
            activities: [{ 
                name: config.status.text, 
                type: activityType 
            }],
            status: config.status.afk ? 'idle' : 'online'
        });
    }

    static async handleSlashCommand(client, interaction) {
        const command = client.commands.get(interaction.commandName);
        
        if (!command) return;

        // Check if command is owner-only
        if (command.ownerOnly && !config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: 'This command is only available to bot owners.', 
                ephemeral: true 
            });
        }

        // Check cooldown
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Map());
        }
        
        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || config.cooldown.seconds) * 1000;
        
        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return interaction.reply({ 
                    content: `Please wait ${timeLeft} more seconds before using this command.`, 
                    ephemeral: true 
                });
            }
        }
        
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        // Check premium if required
        if (command.premiumRequired && !db.isPremium(interaction.guildId)) {
            return this.sendPremiumRequired(interaction);
        }

        try {
            await command.run(client, interaction);
        } catch (error) {
            logger.commandError(interaction.commandName, interaction.user.id, interaction.guildId, error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'An error occurred while executing this command.', 
                    ephemeral: true 
                }).catch(() => {});
            }
        }
    }

    static async handleMessageCommand(client, message) {
        const prefix = db.getPrefix(message.guildId);
        const noPrefix = db.hasNoPrefix(message.author.id);
        const isOwner = config.ownerIds.includes(message.author.id);
        
        let cmd;
        let args = [];
        
        // Check for mention command
        const mentionPrefix = `<@${client.user.id}>`;
        const mentionPrefixNick = `<@!${client.user.id}>`;
        
        if (message.content.startsWith(mentionPrefix) || message.content.startsWith(mentionPrefixNick)) {
            return message.channel.send({ 
                content: `My prefix for this server is \`${prefix}\`\n\nUse \`${prefix}help\` for the command list.` 
            });
        }
        
        // Check for prefix command or noprefix
        if (message.content.startsWith(prefix) || noPrefix || isOwner) {
            const content = message.content.startsWith(prefix) 
                ? message.content.slice(prefix.length) 
                : message.content;
            
            const parsed = content.trim().split(/ +/);
            cmd = parsed.shift().toLowerCase();
            args = parsed;
        } else {
            return;
        }
        
        const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
        
        if (!command || !command.run) return;

        // Check if command is owner-only
        if (command.ownerOnly && !isOwner) {
            return;
        }

        // Check cooldown
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Map());
        }
        
        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || config.cooldown.seconds) * 1000;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return message.reply({ 
                    content: `Please wait ${timeLeft} more seconds before using this command.` 
                });
            }
        }
        
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        // Check premium if required
        if (command.premiumRequired && !db.isPremium(message.guildId)) {
            return this.sendPremiumRequiredMessage(message);
        }

        try {
            await command.run(client, message, args);
        } catch (error) {
            logger.commandError(command.name, message.author.id, message.guildId, error);
        }
    }

    static async handleButtonInteraction(client, interaction) {
        // Handle button interactions from components
        const [category, action] = interaction.customId.split('_');
        
        // Delegate to appropriate handler based on category
        switch (category) {
            case 'player':
                await client.playerManager.handlePlayerButton(interaction, action);
                break;
            case 'queue':
                await client.playerManager.handleQueueButton(interaction, action);
                break;
            case 'filter':
                await client.playerManager.handleFilterButton(interaction, action);
                break;
            default:
                break;
        }
    }

    static async handleSelectMenuInteraction(client, interaction) {
        const [category, action] = interaction.customId.split('_');
        
        switch (category) {
            case 'help':
                await this.handleHelpSelectMenu(interaction);
                break;
            case 'queue':
                await client.playerManager.handleQueueSelectMenu(interaction);
                break;
            default:
                break;
        }
    }

    static async handleModalSubmit(client, interaction) {
        const [category, action] = interaction.customId.split('_');
        
        switch (category) {
            case 'search':
                await client.playerManager.handleSearchModal(interaction);
                break;
            default:
                break;
        }
    }

    static async handleVoiceStateUpdate(client, oldState, newState) {
        const player = client.kazagumo?.players.get(newState.guild.id);
        
        if (!player) return;

        // Check if bot was moved or disconnected
        if (newState.member?.id === client.user.id) {
            if (!newState.channelId) {
                // Bot was disconnected
                player.destroy();
                logger.info(`Bot disconnected from voice in guild ${newState.guild.id}`);
            }
        }

        // Check if everyone left the voice channel
        const settings = db.getSettings(newState.guild.id);
        if (settings?.twentyfourseven) return; // Don't auto-leave in 24/7 mode

        const voiceChannel = newState.guild.channels.cache.get(player.voiceChannel);
        if (voiceChannel && voiceChannel.members.filter(m => !m.user.bot).size === 0) {
            // Everyone left, wait before disconnecting
            setTimeout(() => {
                const vc = newState.guild.channels.cache.get(player.voiceChannel);
                if (vc && vc.members.filter(m => !m.user.bot).size === 0) {
                    player.destroy();
                    logger.info(`Left voice channel due to inactivity in guild ${newState.guild.id}`);
                }
            }, config.player.autoLeaveSeconds * 1000);
        }
    }

    static async handleHelpSelectMenu(interaction) {
        const category = interaction.values[0];
        const CommandHandler = require('./commandHandler');
        
        const commands = Array.from(interaction.client.commands.values())
            .filter(cmd => cmd.category === category && !cmd.hidden)
            .map(cmd => ({
                name: cmd.name,
                description: cmd.description || 'No description available'
            }));

        const embed = {
            color: config.embedColor,
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Commands`,
            description: commands.length > 0
                ? commands.map(c => `**/${c.name}** - ${c.description}`).join('\n')
                : 'No commands in this category.',
            footer: { text: `Use /help <command> for more info` }
        };

        await interaction.update({ embeds: [embed] }).catch(() => {});
    }

    static sendPremiumRequired(interaction) {
        const emojis = require('../emojis/index');
        
        const embed = {
            color: 0xFEE75C,
            title: `${emojis.premium.locked} Premium Feature`,
            description: 'This feature requires **Premium** status for your server.',
            fields: [
                {
                    name: 'Benefits',
                    value: '• Unlimited Queue\n• Advanced Filters\n• 24/7 Mode\n• Queue Backup/Restore\n• And much more!',
                    inline: false
                }
            ]
        };

        const buttons = [
            {
                style: 5,
                label: 'Buy Premium',
                url: config.inviteLink || 'https://discord.com'
            },
            {
                style: 5,
                label: 'Support Server',
                url: config.supportServer || 'https://discord.com'
            }
        ];

        return interaction.reply({ embeds: [embed], components: [{ type: 1, components: buttons }], ephemeral: true });
    }

    static sendPremiumRequiredMessage(message) {
        const emojis = require('../emojis/index');
        
        const embed = {
            color: 0xFEE75C,
            title: `${emojis.premium.locked} Premium Feature`,
            description: 'This feature requires **Premium** status for your server.',
            fields: [
                {
                    name: 'Benefits',
                    value: '• Unlimited Queue\n• Advanced Filters\n• 24/7 Mode\n• Queue Backup/Restore\n• And much more!',
                    inline: false
                }
            ]
        };

        const buttons = [
            {
                style: 5,
                label: 'Buy Premium',
                url: config.inviteLink || 'https://discord.com'
            },
            {
                style: 5,
                label: 'Support Server',
                url: config.supportServer || 'https://discord.com'
            }
        ];

        return message.reply({ embeds: [embed], components: [{ type: 1, components: buttons }] });
    }
}

module.exports = EventHandler;
