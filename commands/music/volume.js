/**
 * Volume Command
 * Set or view the player volume
 */

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/managers/database');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'volume',
    description: 'Set or view the player volume',
    category: 'music',
    hidden: false,
    cooldown: 3,
    
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set or view the player volume')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(false)
        ),
    
    aliases: ['vol', 'v'],
    
    async run(client, interaction) {
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player) {
            return interaction.reply({ 
                content: `${emojis.error} No music is currently playing.`, 
                ephemeral: true 
            });
        }
        
        const volume = interaction.options.getInteger('level');
        
        if (volume === null || volume === undefined) {
            // Show current volume
            return interaction.reply({ 
                content: `${emojis.music.volume} Current volume: **${player.volume}%**`,
                ephemeral: true 
            });
        }
        
        // Check permissions
        const member = interaction.member;
        const isOwner = config.ownerIds.includes(interaction.user.id);
        const isPremium = db.isPremium(interaction.guildId);
        
        // Premium users can set any volume, others limited to 50%
        if (!isPremium && !isOwner && volume > 50) {
            return interaction.reply({ 
                content: `${emojis.warning} Non-premium servers are limited to 50% volume. Upgrade to premium for unlimited volume!`,
                ephemeral: true 
            });
        }
        
        player.setVolume(volume);
        db.updateVolume(interaction.guildId, volume);
        
        return interaction.reply({ 
            content: `${emojis.success} Volume set to **${volume}%**`,
            ephemeral: true 
        });
    }
};

// Need to import config for owner check
const config = require('../../config/config');
