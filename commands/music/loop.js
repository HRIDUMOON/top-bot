/**
 * Loop Command
 * Toggle loop mode (off, track, queue)
 */

const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database/managers/database');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'loop',
    description: 'Toggle loop mode (off, track, queue)',
    category: 'music',
    hidden: false,
    cooldown: 3,
    
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggle loop mode (off, track, queue)')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Loop mode: off, track, or queue')
                .setRequired(false)
                .addChoices(
                    { name: 'Off', value: 'off' },
                    { name: 'Track', value: 'track' },
                    { name: 'Queue', value: 'queue' }
                )
        ),
    
    aliases: ['repeat'],
    
    async run(client, interaction) {
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player) {
            return interaction.reply({ 
                content: `${emojis.error} No music is currently playing.`, 
                ephemeral: true 
            });
        }
        
        const settings = db.getSettings(interaction.guildId);
        const currentLoop = settings?.loop || 'off';
        
        let newLoop = interaction.options.getString('mode');
        
        if (!newLoop) {
            // Cycle through modes
            const loops = ['off', 'track', 'queue'];
            const currentIndex = loops.indexOf(currentLoop);
            newLoop = loops[(currentIndex + 1) % loops.length];
        }
        
        db.updateLoop(interaction.guildId, newLoop);
        
        const loopEmojis = {
            off: emojis.queue.loop.replace(/[<>:]/g, '') || '🔁',
            track: emojis.queue.repeatOne?.replace(/[<>:]/g, '') || '🔂',
            queue: emojis.queue.repeat?.replace(/[<>:]/g, '') || '🔁'
        };
        
        const loopNames = {
            off: 'Disabled',
            track: 'Current Track',
            queue: 'Entire Queue'
        };
        
        return interaction.reply({ 
            content: `${loopEmojis[newLoop]} Loop set to: **${loopNames[newLoop]}**`,
            ephemeral: true 
        });
    }
};
