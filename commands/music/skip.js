/**
 * Skip Command
 * Skip the current track
 */

const { SlashCommandBuilder } = require('discord.js');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'skip',
    description: 'Skip the current track',
    category: 'music',
    hidden: false,
    cooldown: 3,
    
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current track'),
    
    aliases: ['s', 'next'],
    
    async run(client, interaction) {
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player) {
            return interaction.reply({ 
                content: `${emojis.error} No music is currently playing.`, 
                ephemeral: true 
            });
        }
        
        if (player.queue.size === 0) {
            return interaction.reply({ 
                content: `${emojis.warning} No more tracks in queue.`, 
                ephemeral: true 
            });
        }
        
        player.stop();
        
        return interaction.reply({ 
            content: `${emojis.success} Skipped to the next track.`,
            ephemeral: true 
        });
    }
};
