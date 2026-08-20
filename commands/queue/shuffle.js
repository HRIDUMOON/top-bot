/**
 * Shuffle Command
 * Shuffle the current queue
 */

const { SlashCommandBuilder } = require('discord.js');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'shuffle',
    description: 'Shuffle the current queue',
    category: 'queue',
    hidden: false,
    cooldown: 5,
    
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the current queue'),
    
    aliases: ['mix'],
    
    async run(client, interaction) {
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player || player.queue.size === 0) {
            return interaction.reply({ 
                content: `${emojis.error} The queue is empty.`, 
                ephemeral: true 
            });
        }
        
        player.queue.shuffle();
        
        return interaction.reply({ 
            content: `${emojis.music.shuffle} Shuffled **${player.queue.size}** tracks in the queue.`,
            ephemeral: true 
        });
    }
};
