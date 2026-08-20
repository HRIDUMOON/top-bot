const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'search',
    description: 'Search for songs and select one to play',
    aliases: ['sr'],
    category: 'music',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: true,
    
    options: [
        {
            name: 'query',
            description: 'Song name or URL to search',
            type: 3, // STRING
            required: true
        },
        {
            name: 'platform',
            description: 'Platform to search on',
            type: 3, // STRING
            required: false,
            choices: [
                { name: 'YouTube', value: 'ytsearch' },
                { name: 'SoundCloud', value: 'scsearch' },
                { name: 'Spotify', value: 'spsearch' }
            ]
        }
    ],

    async execute(client, message, args, prefix) {
        const query = args.join(' ');
        if (!query) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Please provide a song name or URL to search!`);
            return message.reply({ embeds: [embed] });
        }

        let platform = 'ytsearch';
        const platformArg = args[args.length - 1];
        if (['ytsearch', 'scsearch', 'spsearch'].includes(platformArg)) {
            platform = args.pop();
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.loading} Searching for **${query}**...`);
        
        const msg = await message.reply({ embeds: [loadingEmbed] });

        try {
            const result = await client.kazagumo.search(`${platform}:${query}`, {
                requester: message.author
            });

            if (!result || !result.tracks || result.tracks.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} No results found for **${query}**`);
                return msg.edit({ embeds: [errorEmbed] });
            }

            const top10 = result.tracks.slice(0, 10);
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`search_select_${message.id}`)
                .setPlaceholder('Select a song to play')
                .addOptions(top10.map((track, index) => ({
                    label: track.title.length > 25 ? track.title.substring(0, 22) + '...' : track.title,
                    value: index.toString(),
                    description: `${track.author?.substring(0, 50) || 'Unknown'} • ${formatDuration(track.duration)}`
                })));

            const actionRow = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.music} Search Results for "${query}"`)
                .setDescription(top10.map((track, index) => 
                    `**${index + 1}.** [${track.title}](${track.uri}) - \`${formatDuration(track.duration)}\``
                ).join('\n'))
                .setFooter({ text: 'Select a song from the dropdown below' });

            await msg.edit({ embeds: [embed], components: [actionRow] });

            // Store search results for component handler
            client.searchResults = client.searchResults || new Map();
            client.searchResults.set(message.id, { tracks: top10, userId: message.author.id });

        } catch (error) {
            console.error('Search error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} An error occurred while searching. Please try again!`);
            return msg.edit({ embeds: [errorEmbed] });
        }
    },

    async interactExecute(client, interaction) {
        const query = interaction.options.getString('query');
        let platform = interaction.options.getString('platform') || 'ytsearch';

        const loadingEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.loading} Searching for **${query}**...`);
        
        await interaction.reply({ embeds: [loadingEmbed] });

        try {
            const result = await client.kazagumo.search(`${platform}:${query}`, {
                requester: interaction.user
            });

            if (!result || !result.tracks || result.tracks.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} No results found for **${query}**`);
                return interaction.editReply({ embeds: [errorEmbed] });
            }

            const top10 = result.tracks.slice(0, 10);
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`search_select_${interaction.id}`)
                .setPlaceholder('Select a song to play')
                .addOptions(top10.map((track, index) => ({
                    label: track.title.length > 25 ? track.title.substring(0, 22) + '...' : track.title,
                    value: index.toString(),
                    description: `${track.author?.substring(0, 50) || 'Unknown'} • ${formatDuration(track.duration)}`
                })));

            const actionRow = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.music} Search Results for "${query}"`)
                .setDescription(top10.map((track, index) => 
                    `**${index + 1}.** [${track.title}](${track.uri}) - \`${formatDuration(track.duration)}\``
                ).join('\n'))
                .setFooter({ text: 'Select a song from the dropdown below' });

            await interaction.editReply({ embeds: [embed], components: [actionRow] });

            // Store search results for component handler
            client.searchResults = client.searchResults || new Map();
            client.searchResults.set(interaction.id, { tracks: top10, userId: interaction.user.id });

        } catch (error) {
            console.error('Search error:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} An error occurred while searching. Please try again!`);
            return interaction.editReply({ embeds: [errorEmbed] });
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
