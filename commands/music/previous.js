const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'previous',
    description: 'Play the previous song in the queue (Premium)',
    aliases: ['prev'],
    category: 'music',
    premium: true,
    player: true,
    dj: false,
    voiceChannel: false,
    
    options: [],

    async execute(client, message, args, prefix) {
        const player = client.kazagumo.players.get(message.guildId);
        
        if (!player) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} No music is playing right now!`);
            return message.reply({ embeds: [embed] });
        }

        // Check if we have history
        if (!player.history || player.history.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.warning} No previous songs in history!`);
            return message.reply({ embeds: [embed] });
        }

        // Get the last song from history
        const previousTrack = player.history.pop();
        
        if (!previousTrack) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Could not find a previous song!`);
            return message.reply({ embeds: [embed] });
        }

        // Add current song to history before switching
        if (player.queue.current) {
            player.history.push(player.queue.current);
        }

        // Play the previous track
        player.play(previousTrack);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Now playing previous track: [${previousTrack.title}](${previousTrack.uri})`);
        
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

        // Check if we have history
        if (!player.history || player.history.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.warning} No previous songs in history!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Get the last song from history
        const previousTrack = player.history.pop();
        
        if (!previousTrack) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Could not find a previous song!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Add current song to history before switching
        if (player.queue.current) {
            player.history.push(player.queue.current);
        }

        // Play the previous track
        player.play(previousTrack);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Now playing previous track: [${previousTrack.title}](${previousTrack.uri})`);
        
        return interaction.reply({ embeds: [embed] });
    }
};
