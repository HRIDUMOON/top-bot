const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube, Spotify, SoundCloud or direct URL')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('Song name, URL, or playlist link')
                .setRequired(true)),
    
    aliases: ['p', 'playnow'],
    
    async execute(interaction, client) {
        const query = interaction.options.getString('query');
        
        if (!interaction.member.voice?.channelId) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(config.embed.color)
                    .setDescription(`${emojis.error} You must be in a voice channel to use this command!`)
                ],
                ephemeral: true
            });
        }

        const permissions = interaction.member.voice.channel.permissionsFor(interaction.guild.members.me);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(config.embed.color)
                    .setDescription(`${emojis.error} I don't have permission to connect or speak in your voice channel!`)
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const player = interaction.client.kazagumo.createPlayer({
                guildId: interaction.guild.id,
                voiceId: interaction.member.voice.channelId,
                textId: interaction.channel.id,
                deaf: true
            });

            const search = await interaction.client.kazagumo.search(query, {
                requester: interaction.user,
                searchEngine: 'auto'
            });

            if (!search || !search.tracks.length) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.embed.color)
                        .setDescription(`${emojis.error} No results found for \`${query}\``)
                    ]
                });
            }

            if (search.type === 'playlist') {
                for (const track of search.tracks) {
                    player.queue.add(track);
                }
                if (!player.playing && !player.paused && !player.queue.size) {
                    player.play();
                }
                
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.embed.color)
                        .setDescription(`${emojis.success} Added playlist \`${search.playlistName}\` with ${search.tracks.length} tracks to the queue!`)
                    ]
                });
            } else {
                const track = search.tracks[0];
                player.queue.add(track);
                
                if (!player.playing && !player.paused && !player.queue.size) {
                    player.play();
                }

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.embed.color)
                        .setDescription(`${emojis.music.play} Added [${track.title}](${track.uri}) to the queue!`)
                        .setThumbnail(track.thumbnail)
                        .addFields(
                            { name: 'Duration', value: track.duration ? formatDuration(track.duration) : 'Live', inline: true },
                            { name: 'Requester', value: `<@${interaction.user.id}>`, inline: true }
                        )
                    ]
                });
            }
        } catch (error) {
            console.error(error);
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(config.embed.color)
                    .setDescription(`${emojis.error} An error occurred while playing: ${error.message}`)
                ]
            });
        }
    }
};

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    return parts.join(' ');
}
