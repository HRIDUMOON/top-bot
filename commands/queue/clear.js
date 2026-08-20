/**
 * Clear Command
 * Clear the current queue
 */

const { SlashCommandBuilder } = require('discord.js');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'clear',
    description: 'Clear the current queue',
    category: 'queue',
    hidden: false,
    cooldown: 3,
    
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the current queue'),
    
    aliases: ['empty'],
    
    async run(client, interaction) {
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player || player.queue.size === 0) {
            return interaction.reply({ 
                content: `${emojis.error} The queue is already empty.`, 
                ephemeral: true 
            });
        }
        
        player.queue.clear();
        
        return interaction.reply({ 
            content: `${emojis.queue.clear} Cleared **${player.queue.size + 1}** tracks from the queue.`,
            ephemeral: true 
        });
    }
};
