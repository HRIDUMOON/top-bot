const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'lyrics',
    description: 'Get lyrics for the current song or a specified song',
    aliases: ['ly'],
    category: 'music',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: false,
    
    options: [
        {
            name: 'song',
            description: 'Song name to get lyrics for (uses current song if not provided)',
            type: 3, // STRING
            required: false
        }
    ],

    async execute(client, message, args, prefix) {
        const player = client.kazagumo.players.get(message.guildId);
        let query = args.join(' ');

        if (!query && player && player.queue.current) {
            query = `${player.queue.current.title} ${player.queue.current.author}`;
        }

        if (!query) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} No song playing and no song name provided!`);
            return message.reply({ embeds: [embed] });
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.loading} Searching for lyrics...`);
        
        const msg = await message.reply({ embeds: [loadingEmbed] });

        try {
            const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(query)}`);
            const data = response.data;

            if (!data.lyrics || data.lyrics.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} No lyrics found for **${query}**`);
                return msg.edit({ embeds: [errorEmbed] });
            }

            const lyrics = data.lyrics;
            const chunks = chunkString(lyrics, 2000);

            for (let i = 0; i < chunks.length; i++) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`${emojis.music} ${data.artist} - ${data.title}`)
                    .setDescription(chunks[i])
                    .setFooter({ text: `Page ${i + 1}/${chunks.length}` });

                if (i === 0) {
                    await msg.edit({ embeds: [embed] });
                } else {
                    await message.channel.send({ embeds: [embed] });
                }
            }
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Failed to fetch lyrics. Please try again later.`);
            return msg.edit({ embeds: [errorEmbed] });
        }
    },

    async interactExecute(client, interaction) {
        const player = client.kazagumo.players.get(interaction.guildId);
        let query = interaction.options.getString('song');

        if (!query && player && player.queue.current) {
            query = `${player.queue.current.title} ${player.queue.current.author}`;
        }

        if (!query) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} No song playing and no song name provided!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(query)}`);
            const data = response.data;

            if (!data.lyrics || data.lyrics.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} No lyrics found for **${query}**`);
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const lyrics = data.lyrics;
            const chunks = chunkString(lyrics, 2000);

            for (let i = 0; i < chunks.length; i++) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`${emojis.music} ${data.artist} - ${data.title}`)
                    .setDescription(chunks[i])
                    .setFooter({ text: `Page ${i + 1}/${chunks.length}` });

                if (i === 0) {
                    await interaction.editReply({ embeds: [embed] });
                } else {
                    await interaction.followUp({ embeds: [embed], ephemeral: true });
                }
            }
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Failed to fetch lyrics. Please try again later.`);
            return interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};

function chunkString(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
        chunks.push(str.substring(i, i + size));
    }
    return chunks;
}
