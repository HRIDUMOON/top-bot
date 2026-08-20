const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'leave',
    description: 'Make the bot leave your voice channel and stop playing',
    aliases: ['l', 'dc', 'disconnect'],
    category: 'music',
    premium: false,
    player: true,
    dj: false,
    voiceChannel: false,
    
    options: [],

    async execute(client, message, args, prefix) {
        const player = client.kazagumo.players.get(message.guildId);
        
        if (!player) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} I'm not connected to any voice channel!`);
            return message.reply({ embeds: [embed] });
        }

        // Clear queue and destroy player
        player.queue.clear();
        player.destroy();

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Left the voice channel and cleared the queue!`);
        
        return message.reply({ embeds: [embed] });
    },

    async interactExecute(client, interaction) {
        const player = client.kazagumo.players.get(interaction.guildId);
        
        if (!player) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} I'm not connected to any voice channel!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Clear queue and destroy player
        player.queue.clear();
        player.destroy();

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Left the voice channel and cleared the queue!`);
        
        return interaction.reply({ embeds: [embed] });
    }
};
