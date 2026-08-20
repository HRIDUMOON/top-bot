const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder().setName('support').setDescription('Get support server link'),
    aliases: ['server'],
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.color)
            .setTitle(emojis.utility.support + ' Support Server')
            .setDescription('Join our [support server](' + config.supportServer + ') for help!')
            .setTimestamp();
        interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
