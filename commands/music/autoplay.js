/**
 * Autoplay Command (Premium)
 * Toggle autoplay - automatically plays similar songs when queue ends
 * Premium-only feature
 */

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/managers/database');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'autoplay',
    description: 'Toggle autoplay (Premium only)',
    category: 'music',
    hidden: false,
    cooldown: 5,
    premiumRequired: true,
    
    data: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('Toggle autoplay - automatically plays similar songs (Premium only)'),
    
    aliases: ['ap'],
    
    async run(client, interaction) {
        // Double-check premium status
        const isPremium = db.isPremium(interaction.guildId);
        
        if (!isPremium) {
            return EventHandler.sendPremiumRequired(interaction);
        }
        
        const settings = db.getSettings(interaction.guildId);
        const currentStatus = settings?.autoplay || false;
        
        // Toggle autoplay
        db.updateAutoplay(interaction.guildId, !currentStatus);
        
        if (!currentStatus) {
            return interaction.reply({ 
                content: `${emojis.music.autoplay} **Autoplay Enabled**\n\nSimilar songs will be played automatically when the queue ends.`,
                ephemeral: true 
            });
        } else {
            return interaction.reply({ 
                content: `${emojis.warning} **Autoplay Disabled**`,
                ephemeral: true 
            });
        }
    }
};

// Import event handler for premium message
const EventHandler = require('../../handlers/eventHandler');
