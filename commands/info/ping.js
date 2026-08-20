const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
    aliases: ['latency'],
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const ping = sent.createdTimestamp - interaction.createdTimestamp;
        const apiPing = interaction.client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor(config.embed.color)
            .setTitle(`${emojis.utility.ping} Pong!`)
            .addFields(
                { name: 'Bot Latency', value: `${ping}ms`, inline: true },
                { name: 'API Latency', value: `${apiPing}ms`, inline: true }
            )
            .setTimestamp();

        interaction.editReply({ content: null, embeds: [embed] });
    }
};
