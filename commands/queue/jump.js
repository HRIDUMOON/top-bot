const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'jump',
    description: 'Jump to a specific song in the queue',
    aliases: ['jp'],
    category: 'queue',
    premium: false,
    player: true,
    dj: false,
    voiceChannel: false,
    
    options: [
        {
            name: 'position',
            description: 'Position of the song in the queue to jump to',
            type: 4, // INTEGER
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
                .setDescription(`${emojis.warning} Please provide a position number!`);
            return message.reply({ embeds: [embed] });
        }

        const position = parseInt(args[0]);
        
        if (isNaN(position) || position < 1) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Please provide a valid position number!`);
            return message.reply({ embeds: [embed] });
        }

        if (position > player.queue.size) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Queue only has **${player.queue.size}** songs!`);
            return message.reply({ embeds: [embed] });
        }

        // Remove tracks before the target position and add them to the end
        const tracksToMove = [];
        for (let i = 0; i < position - 1; i++) {
            const track = player.queue.shift();
            if (track) tracksToMove.push(track);
        }

        // Add the moved tracks back to the end of the queue
        for (const track of tracksToMove) {
            player.queue.add(track);
        }

        // Skip to the next song (which is now our target)
        player.skip();

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Jumped to position **${position}** in the queue!`);
        
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

        const position = interaction.options.getInteger('position');
        
        if (position < 1) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Please provide a valid position number!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (position > player.queue.size) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Queue only has **${player.queue.size}** songs!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Remove tracks before the target position and add them to the end
        const tracksToMove = [];
        for (let i = 0; i < position - 1; i++) {
            const track = player.queue.shift();
            if (track) tracksToMove.push(track);
        }

        // Add the moved tracks back to the end of the queue
        for (const track of tracksToMove) {
            player.queue.add(track);
        }

        // Skip to the next song (which is now our target)
        player.skip();

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Jumped to position **${position}** in the queue!`);
        
        return interaction.reply({ embeds: [embed] });
    }
};
