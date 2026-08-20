/**
 * Command Handler
 * Loads and manages all commands (slash, prefix, mention)
 */

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('../config/config');
const logger = require('../utils/logger');

class CommandHandler {
    static loadAllCommands(client) {
        const commands = [];
        const commandDirs = [
            'music',
            'queue',
            'playlist',
            'filters',
            'utility',
            'info',
            'premium',
            'owner'
        ];

        for (const dir of commandDirs) {
            const dirPath = path.join(config.paths.commands, dir);
            if (!fs.existsSync(dirPath)) continue;

            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                try {
                    const command = require(filePath);
                    
                    if (command.name && (command.data || command.run)) {
                        client.commands.set(command.name, command);
                        
                        // Handle aliases
                        if (command.aliases && Array.isArray(command.aliases)) {
                            for (const alias of command.aliases) {
                                client.aliases.set(alias, command.name);
                            }
                        }

                        // Add slash command data if available
                        if (command.data) {
                            commands.push(command.data.toJSON());
                        }

                        logger.info(`Loaded command: ${command.name}`);
                    }
                } catch (error) {
                    logger.error(`Failed to load command ${file}`, { error: error.message });
                }
            }
        }

        // Register slash commands
        this.registerSlashCommands(commands);
        
        logger.success(`Loaded ${client.commands.size} commands`);
    }

    static async registerSlashCommands(commands) {
        const rest = new REST({ version: '10' }).setToken(config.token);

        try {
            logger.info('Started refreshing application (/) commands.');

            if (config.clientId) {
                // Global commands
                await rest.put(
                    Routes.applicationCommands(config.clientId),
                    { body: commands }
                );

                logger.success('Successfully reloaded application (/) commands globally.');
            } else {
                logger.warn('CLIENT_ID not set, skipping slash command registration');
            }
        } catch (error) {
            logger.error('Failed to register slash commands', { error: error.message });
        }
    }

    static getCommand(client, name) {
        return client.commands.get(name) || client.commands.get(client.aliases.get(name));
    }

    static isOwner(userId) {
        return config.ownerIds.includes(userId);
    }

    static async checkPremium(db, guildId) {
        return db.isPremium(guildId);
    }

    static async checkNoPrefix(db, userId) {
        return db.hasNoPrefix(userId);
    }
}

module.exports = CommandHandler;
