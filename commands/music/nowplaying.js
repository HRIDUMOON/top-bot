/**
 * NowPlaying Command
 * Display the currently playing track
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'nowplaying',
    description: 'Display the currently playing track',
    category: 'music',
    hidden: false,
    cooldown: 5,
    
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Display the currently playing track'),
    
    aliases: ['np', 'current'],
    
    async run(client, interaction) {
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player || !player.queue.current) {
            return interaction.reply({ 
                content: `${emojis.error} No music is currently playing.`, 
                ephemeral: true 
            });
        }
        
        const track = player.queue.current;
        
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.music.nowPlaying} Now Playing`)
            .setDescription(`### ${track.title}`)
            .addFields(
                { name: `${emojis.player.requester} Requester`, value: `<@${track.requester?.id}>`, inline: true },
                { name: `${emojis.player.duration} Duration`, value: client.playerManager.formatDuration(track.duration), inline: true },
                { name: `${emojis.player.platform} Platform`, value: client.playerManager.getPlatformName(track.source), inline: true },
                { name: `${emojis.queue.queue} Queue Position`, value: `#${player.queue.position + 1}`, inline: true },
                { name: `${emojis.player.volume} Volume`, value: `${player.volume}%`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true }
            )
            .setThumbnail(track.thumbnail || null)
            .setFooter({ text: `Requested by ${track.requester?.username || 'Unknown'}` })
            .setTimestamp();
        
        // Progress bar
        const progressBar = client.playerManager.createProgressBar(track.duration, player.position);
        embed.addFields({ name: '\u200b', value: progressBar, inline: false });
        
        return interaction.reply({ embeds: [embed] });
    }
};
