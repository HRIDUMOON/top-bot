/**
 * Remove Command (Premium)
 * Remove a track from the queue
 * Premium-only feature
 */

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/managers/database');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'remove',
    description: 'Remove a track from the queue (Premium only)',
    category: 'queue',
    hidden: false,
    cooldown: 3,
    premiumRequired: true,
    
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a track from the queue (Premium only)')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position of the track to remove')
                .setMinValue(1)
                .setRequired(true)
        ),
    
    aliases: ['rm'],
    
    async run(client, interaction) {
        // Double-check premium status
        const isPremium = db.isPremium(interaction.guildId);
        
        if (!isPremium) {
            return EventHandler.sendPremiumRequired(interaction);
        }
        
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player || player.queue.size === 0) {
            return interaction.reply({ 
                content: `${emojis.error} The queue is empty.`, 
                ephemeral: true 
            });
        }
        
        const position = interaction.options.getInteger('position');
        
        if (position < 1 || position > player.queue.size) {
            return interaction.reply({ 
                content: `${emojis.error} Invalid position. Queue has ${player.queue.size} tracks.`, 
                ephemeral: true 
            });
        }
        
        const removed = player.queue.remove(position - 1);
        
        return interaction.reply({ 
            content: `${emojis.queue.remove} Removed **${removed.title}** from the queue.`,
            ephemeral: true 
        });
    }
};

// Import event handler for premium message
const EventHandler = require('../../handlers/eventHandler');
