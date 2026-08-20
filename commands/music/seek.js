const { EmbedBuilder } = require('discord.js');
const { KazagumoTrack } = require('kazagumo');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'seek',
    description: 'Seek to a specific position in the current song',
    aliases: ['sk'],
    category: 'music',
    premium: true,
    player: true,
    dj: false,
    voiceChannel: true,
    
    options: [
        {
            name: 'position',
            description: 'Position to seek to (e.g., 1:30 or 90)',
            type: 3, // STRING
            required: true
        }
    ],

    async execute(client, message, args, prefix) {
        const player = client.kazagumo.players.get(message.guildId);
        
        if (!player) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} No music is playing right now!`);
            return message.reply({ embeds: [embed] });
        }

        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.warning} Please provide a position to seek to (e.g., \`1:30\` or \`90\`)`);
            return message.reply({ embeds: [embed] });
        }

        const position = parseTime(args[0]);
        if (position === null || position < 0) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Invalid position format. Use formats like \`1:30\`, \`2:45\`, or just seconds like \`90\``);
            return message.reply({ embeds: [embed] });
        }

        if (position > player.queue.current.duration) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Cannot seek beyond the song's duration!`);
            return message.reply({ embeds: [embed] });
        }

        player.seek(position);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Successfully seeked to **${formatTime(position)}** in [${player.queue.current.title}](${player.queue.current.uri})`);
        
        return message.reply({ embeds: [embed] });
    },

    async interactExecute(client, interaction) {
        const player = client.kazagumo.players.get(interaction.guildId);
        
        if (!player) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} No music is playing right now!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const positionArg = interaction.options.getString('position');
        const position = parseTime(positionArg);

        if (position === null || position < 0) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Invalid position format. Use formats like \`1:30\`, \`2:45\`, or just seconds like \`90\``);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (position > player.queue.current.duration) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Cannot seek beyond the song's duration!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        player.seek(position);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Successfully seeked to **${formatTime(position)}** in [${player.queue.current.title}](${player.queue.current.uri})`);
        
        return interaction.reply({ embeds: [embed] });
    }
};

function parseTime(timeStr) {
    const timeRegex = /^(\d+):(\d+)$/;
    const match = timeStr.match(timeRegex);
    
    if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        return (minutes * 60 + seconds) * 1000;
    }
    
    const seconds = parseInt(timeStr);
    if (!isNaN(seconds)) {
        return seconds * 1000;
    }
    
    return null;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
