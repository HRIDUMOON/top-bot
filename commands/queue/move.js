/**
 * Move Command (Premium)
 * Move a track to a different position in the queue
 * Premium-only feature
 */

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/managers/database');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'move',
    description: 'Move a track to a different position (Premium only)',
    category: 'queue',
    hidden: false,
    cooldown: 3,
    premiumRequired: true,
    
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move a track to a different position (Premium only)')
        .addIntegerOption(option =>
            option.setName('from')
                .setDescription('Current position of the track')
                .setMinValue(1)
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('to')
                .setDescription('New position for the track')
                .setMinValue(1)
                .setRequired(true)
        ),
    
    aliases: ['mv'],
    
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
        
        const from = interaction.options.getInteger('from');
        const to = interaction.options.getInteger('to');
        
        if (from < 1 || from > player.queue.size) {
            return interaction.reply({ 
                content: `${emojis.error} Invalid source position. Queue has ${player.queue.size} tracks.`, 
                ephemeral: true 
            });
        }
        
        if (to < 1 || to > player.queue.size) {
            return interaction.reply({ 
                content: `${emojis.error} Invalid destination position. Queue has ${player.queue.size} tracks.`, 
                ephemeral: true 
            });
        }
        
        // Kazagumo queue move implementation may vary
        // This is a simplified version - actual implementation depends on kazagumo version
        try {
            const track = player.queue[from - 1];
            player.queue.remove(from - 1);
            player.queue.add(track, to - 1);
            
            return interaction.reply({ 
                content: `${emojis.queue.move} Moved **${track.title}** from position **${from}** to position **${to}**.`,
                ephemeral: true 
            });
        } catch (error) {
            return interaction.reply({ 
                content: `${emojis.error} Failed to move track.`,
                ephemeral: true 
            });
        }
    }
};

// Import event handler for premium message
const EventHandler = require('../../handlers/eventHandler');
