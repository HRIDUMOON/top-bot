const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'playnext',
    description: 'Play a song next in the queue (Premium)',
    aliases: ['pn'],
    category: 'music',
    premium: true,
    player: false,
    dj: false,
    voiceChannel: true,
    
    options: [
        {
            name: 'query',
            description: 'Song name or URL to play next',
            type: 3, // STRING
            required: true
        }
    ],

    async execute(client, message, args, prefix) {
        const query = args.join(' ');
        
        if (!query) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Please provide a song name or URL!`);
            return message.reply({ embeds: [embed] });
        }

        let player = client.kazagumo.players.get(message.guildId);

        if (!player) {
            const vc = message.member.voice.channel;
            if (!vc) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} You need to join a voice channel first!`);
                return message.reply({ embeds: [embed] });
            }

            player = await client.kazagumo.createPlayer({
                guildId: message.guildId,
                voiceId: vc.id,
                textId: message.channelId,
                deaf: true
            });
        }

        try {
            const result = await client.kazagumo.search(query, {
                requester: message.author
            });

            if (!result || !result.tracks || result.tracks.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} No results found for **${query}**`);
                return message.reply({ embeds: [embed] });
            }

            const track = result.tracks[0];
            
            // Add to front of queue (after current song)
            if (player.queue.current) {
                player.queue.unshift(track);
            } else {
                player.play(track);
            }

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.success} Added [${track.title}](${track.uri}) to play **next**`);
            
            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('PlayNext error:', error);
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} An error occurred while processing your request.`);
            return message.reply({ embeds: [embed] });
        }
    },

    async interactExecute(client, interaction) {
        const query = interaction.options.getString('query');

        let player = client.kazagumo.players.get(interaction.guildId);

        if (!player) {
            const member = await interaction.guild.members.fetch(interaction.user.id);
            const vc = member.voice.channel;
            
            if (!vc) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} You need to join a voice channel first!`);
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            player = await client.kazagumo.createPlayer({
                guildId: interaction.guildId,
                voiceId: vc.id,
                textId: interaction.channelId,
                deaf: true
            });
        }

        try {
            const result = await client.kazagumo.search(query, {
                requester: interaction.user
            });

            if (!result || !result.tracks || result.tracks.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} No results found for **${query}**`);
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const track = result.tracks[0];
            
            if (player.queue.current) {
                player.queue.unshift(track);
            } else {
                player.play(track);
            }

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.success} Added [${track.title}](${track.uri}) to play **next**`);
            
            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('PlayNext error:', error);
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} An error occurred while processing your request.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
