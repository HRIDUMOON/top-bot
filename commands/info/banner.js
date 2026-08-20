const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'banner',
    description: 'Get a user banner',
    aliases: ['bn'],
    category: 'info',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: false,
    
    options: [
        {
            name: 'user',
            description: 'The user to get banner of',
            type: 6, // USER
            required: false
        }
    ],

    async execute(client, message, args, prefix) {
        let user;
        
        if (args[0]) {
            user = await client.users.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null);
        }
        
        if (!user && message.mentions.users.first()) {
            user = message.mentions.users.first();
        }
        
        if (!user) {
            user = message.author;
        }

        try {
            const fetchedUser = await client.users.fetch(user.id);
            const banner = await fetchedUser.bannerURL({ size: 512 });

            if (!banner) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.warning} **${user.username}** doesn't have a banner set!`);
                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.info} ${user.username}'s Banner`)
                .setImage(banner)
                .setFooter({ text: `Requested by ${message.author.username}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Failed to fetch banner. The user might not have one set.`);
            return message.reply({ embeds: [embed] });
        }
    },

    async interactExecute(client, interaction) {
        let user = interaction.options.getUser('user') || interaction.user;

        try {
            const fetchedUser = await client.users.fetch(user.id);
            const banner = await fetchedUser.bannerURL({ size: 512 });

            if (!banner) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.warning} **${user.username}** doesn't have a banner set!`);
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.info} ${user.username}'s Banner`)
                .setImage(banner)
                .setFooter({ text: `Requested by ${interaction.user.username}` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} Failed to fetch banner. The user might not have one set.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
