/**
 * Stop Command
 * Stop the player and leave voice channel
 */

const { SlashCommandBuilder } = require('discord.js');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'stop',
    description: 'Stop the player and leave voice channel',
    category: 'music',
    hidden: false,
    cooldown: 3,
    
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the player and leave voice channel'),
    
    aliases: ['leave', 'dc'],
    
    async run(client, interaction) {
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player) {
            return interaction.reply({ 
                content: `${emojis.error} No music is currently playing.`, 
                ephemeral: true 
            });
        }
        
        client.playerManager.destroyPlayer(interaction.guildId);
        
        return interaction.reply({ 
            content: `${emojis.success} Stopped the player and left voice channel.`,
            ephemeral: true 
        });
    }
};
