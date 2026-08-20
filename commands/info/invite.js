const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder().setName('invite').setDescription('Get bot invite link'),
    aliases: ['add'],
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.color)
            .setTitle(emojis.utility.invite + ' Invite Me!')
            .setDescription('Click [here](' + config.inviteLink + ') to invite me to your server!')
            .setTimestamp();
        interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
