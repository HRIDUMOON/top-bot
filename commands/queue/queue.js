/**
 * Queue Command
 * Display the current queue with pagination
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config/config');
const emojis = require('../../emojis/index');

module.exports = {
    name: 'queue',
    description: 'Display the current queue',
    category: 'queue',
    hidden: false,
    cooldown: 5,
    
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Display the current queue'),
    
    aliases: ['q'],
    
    async run(client, interaction) {
        const player = client.playerManager.getPlayer(interaction.guildId);
        
        if (!player || player.queue.size === 0) {
            return interaction.reply({ 
                content: `${emojis.error} The queue is empty.`, 
                ephemeral: true 
            });
        }
        
        const currentPage = 0;
        const tracksPerPage = 10;
        
        await this.showQueuePage(interaction, player, currentPage, tracksPerPage);
    },
    
    async showQueuePage(interaction, player, page, tracksPerPage) {
        const queue = player.queue;
        const totalTracks = queue.size;
        const totalPages = Math.ceil(totalTracks / tracksPerPage);
        
        const start = page * tracksPerPage;
        const end = Math.min(start + tracksPerPage, totalTracks);
        
        const tracks = queue.slice(start, end);
        
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.queue.queue} Queue - ${interaction.guild.name}`)
            .setDescription(
                `**Now Playing:** [${queue.current.title}](${queue.current.uri})\n\n` +
                `${tracks.map((track, i) => 
                    `**${start + i + 1}.** ${track.title} - <@${track.requester?.id}> \`${client.playerManager.formatDuration(track.duration)}\``
                ).join('\n')}`
            )
            .addFields(
                { name: 'Total Tracks', value: `${totalTracks}`, inline: true },
                { name: 'Page', value: `${page + 1}/${totalPages}`, inline: true },
                { name: 'Duration', value: client.playerManager.formatDuration(queue.total), inline: true }
            )
            .setFooter({ text: `Loop: ${db.getSettings(interaction.guildId)?.loop || 'off'} | Autoplay: ${db.getSettings(interaction.guildId)?.autoplay ? 'On' : 'Off'}` })
            .setTimestamp();
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`queue_prev`)
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`queue_next`)
                .setLabel('Next')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page >= totalPages - 1)
        );
        
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }
};
