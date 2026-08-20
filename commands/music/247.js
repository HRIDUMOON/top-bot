/**
 * 247 Command (Premium)
 * Toggle 24/7 mode - keeps bot in voice channel
 * Premium-only feature
 */

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/managers/database');
const config = require('../../config/config');
const emojis = require('../../emojis/index');

module.exports = {
    name: '247',
    description: 'Toggle 24/7 mode (Premium only)',
    category: 'music',
    hidden: false,
    cooldown: 5,
    premiumRequired: true,
    
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('Toggle 24/7 mode - keeps bot in voice channel (Premium only)'),
    
    aliases: ['twentyfourseven', 'afk'],
    
    async run(client, interaction) {
        // Double-check premium status
        const isPremium = db.isPremium(interaction.guildId);
        
        if (!isPremium) {
            return EventHandler.sendPremiumRequired(interaction);
        }
        
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player) {
            return interaction.reply({ 
                content: `${emojis.error} No music is currently playing. Join a voice channel and play music first.`, 
                ephemeral: true 
            });
        }
        
        const settings = db.getSettings(interaction.guildId);
        const currentStatus = settings?.twentyfourseven || false;
        
        // Toggle 24/7 mode
        db.update247(interaction.guildId, !currentStatus);
        
        if (!currentStatus) {
            // Enabling 24/7 mode
            return interaction.reply({ 
                content: `${emojis.music['247']} **24/7 Mode Enabled**\n\nThe bot will now stay in the voice channel even when the queue is empty.`,
                ephemeral: true 
            });
        } else {
            // Disabling 24/7 mode
            return interaction.reply({ 
                content: `${emojis.music.leave} **24/7 Mode Disabled**\n\nThe bot will now leave the voice channel when the queue is empty.`,
                ephemeral: true 
            });
        }
    }
};

// Import event handler for premium message
const EventHandler = require('../../handlers/eventHandler');
