const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'vote',
    description: 'Get the bot vote link',
    aliases: ['v'],
    category: 'info',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: false,
    
    options: [],

    async execute(client, message, args, prefix) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Vote for ${client.user.username}`)
            .setDescription('Support us by voting! It helps us grow and improve.')
            .addFields(
                { name: 'Top.gg', value: `[Vote Here](${config.voteLink || 'https://top.gg'})`, inline: true },
                { name: 'Discord Bot List', value: `[Vote Here](https://discordbotlist.com)`, inline: true }
            )
            .setFooter({ text: 'Thank you for your support!' })
            .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Vote on Top.gg')
                .setURL(config.voteLink || 'https://top.gg')
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel('Vote on DBL')
                .setURL('https://discordbotlist.com')
                .setStyle(ButtonStyle.Link)
        );

        return message.reply({ embeds: [embed], components: [buttons] });
    },

    async interactExecute(client, interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Vote for ${client.user.username}`)
            .setDescription('Support us by voting! It helps us grow and improve.')
            .addFields(
                { name: 'Top.gg', value: `[Vote Here](${config.voteLink || 'https://top.gg'})`, inline: true },
                { name: 'Discord Bot List', value: `[Vote Here](https://discordbotlist.com)`, inline: true }
            )
            .setFooter({ text: 'Thank you for your support!' })
            .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Vote on Top.gg')
                .setURL(config.voteLink || 'https://top.gg')
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel('Vote on DBL')
                .setURL('https://discordbotlist.com')
                .setStyle(ButtonStyle.Link)
        );

        return interaction.reply({ embeds: [embed], components: [buttons] });
    }
};
