const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'save',
    description: 'Save the current song to your DMs',
    aliases: ['sv'],
    category: 'music',
    premium: false,
    player: true,
    dj: false,
    voiceChannel: false,
    
    options: [],

    async execute(client, message, args, prefix) {
        const player = client.kazagumo.players.get(message.guildId);
        
        if (!player || !player.queue.current) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} No music is playing right now!`);
            return message.reply({ embeds: [embed] });
        }

        const track = player.queue.current;
        const savedEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.music} Saved Track`)
            .setDescription(`**[${track.title}](${track.uri})**`)
            .addFields(
                { name: 'Artist', value: track.author || 'Unknown', inline: true },
                { name: 'Duration', value: formatDuration(track.duration), inline: true },
                { name: 'Requested by', value: track.requester?.username || 'Unknown', inline: true }
            )
            .setThumbnail(track.thumbnail)
            .setFooter({ text: `Saved from ${message.guild.name}` })
            .setTimestamp();

        try {
            await message.author.send({ embeds: [savedEmbed] });
            
            const confirmEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.success} Successfully saved the current song to your DMs!`);
            
            return message.reply({ embeds: [confirmEmbed], ephemeral: true });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} I couldn't send you a DM. Please make sure your DMs are open!`);
            return message.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    async interactExecute(client, interaction) {
        const player = client.kazagumo.players.get(interaction.guildId);
        
        if (!player || !player.queue.current) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} No music is playing right now!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const track = player.queue.current;
        const savedEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.music} Saved Track`)
            .setDescription(`**[${track.title}](${track.uri})**`)
            .addFields(
                { name: 'Artist', value: track.author || 'Unknown', inline: true },
                { name: 'Duration', value: formatDuration(track.duration), inline: true },
                { name: 'Requested by', value: track.requester?.username || 'Unknown', inline: true }
            )
            .setThumbnail(track.thumbnail)
            .setFooter({ text: `Saved from ${interaction.guild.name}` })
            .setTimestamp();

        try {
            await interaction.user.send({ embeds: [savedEmbed] });
            
            const confirmEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.success} Successfully saved the current song to your DMs!`);
            
            return interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} I couldn't send you a DM. Please make sure your DMs are open!`);
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
