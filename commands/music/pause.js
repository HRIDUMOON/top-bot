const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current track'),
    aliases: ['hold'],
    async execute(interaction) {
        const player = interaction.client.kazagumo.players.get(interaction.guild.id);
        if (!player || !player.playing) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.embed.color).setDescription(`${emojis.error} Nothing is playing right now!`)], ephemeral: true });
        }
        player.pause(true);
        interaction.reply({ embeds: [new EmbedBuilder().setColor(config.embed.color).setDescription(`${emojis.music.pause} Paused the current track!`)] });
    }
};
