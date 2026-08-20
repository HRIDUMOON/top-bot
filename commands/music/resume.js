/**
 * Resume Command
 * Resume the paused track
 */

const { SlashCommandBuilder } = require('discord.js');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'resume',
    description: 'Resume the paused track',
    category: 'music',
    hidden: false,
    cooldown: 3,
    
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused track'),
    
    aliases: [],
    
    async run(client, interaction) {
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player) {
            return interaction.reply({ 
                content: `${emojis.error} No music is currently playing.`, 
                ephemeral: true 
            });
        }
        
        if (!player.paused) {
            return interaction.reply({ 
                content: `${emojis.warning} The player is not paused.`, 
                ephemeral: true 
            });
        }
        
        player.pause(false);
        
        return interaction.reply({ 
            content: `${emojis.success} Resumed the player.`,
            ephemeral: true 
        });
    }
};
