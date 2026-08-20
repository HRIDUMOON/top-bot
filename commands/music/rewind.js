const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'rewind',
    description: 'Rewind the current song by specified seconds',
    aliases: ['rw'],
    category: 'music',
    premium: true,
    player: true,
    dj: false,
    voiceChannel: true,
    
    options: [
        {
            name: 'seconds',
            description: 'Seconds to rewind (default: 10)',
            type: 4, // INTEGER
            required: false
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

        let seconds = 10;
        if (args[0]) {
            seconds = parseInt(args[0]);
            if (isNaN(seconds) || seconds < 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} Please provide a valid number of seconds!`);
                return message.reply({ embeds: [embed] });
            }
        }

        const newPosition = Math.max(0, player.position - (seconds * 1000));
        player.seek(newPosition);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Rewound **${seconds}** seconds in [${player.queue.current.title}](${player.queue.current.uri})`);
        
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

        let seconds = interaction.options.getInteger('seconds') || 10;
        
        if (seconds < 0) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Seconds cannot be negative!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const newPosition = Math.max(0, player.position - (seconds * 1000));
        player.seek(newPosition);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Rewound **${seconds}** seconds in [${player.queue.current.title}](${player.queue.current.uri})`);
        
        return interaction.reply({ embeds: [embed] });
    }
};
