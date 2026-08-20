const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'userinfo',
    description: 'Get information about a user',
    aliases: ['ui', 'whois'],
    category: 'info',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: false,
    
    options: [
        {
            name: 'user',
            description: 'The user to get information about',
            type: 6, // USER
            required: false
        }
    ],

    async execute(client, message, args, prefix) {
        let user;
        
        if (args[0]) {
            user = await message.client.users.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null);
        }
        
        if (!user && message.mentions.users.first()) {
            user = message.mentions.users.first();
        }
        
        if (!user) {
            user = message.author;
        }

        const member = await message.guild.members.fetch(user.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} User Information`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'Username', value: user.username, inline: true },
                { name: 'Discriminator', value: user.discriminator, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'System', value: user.system ? 'Yes' : 'No', inline: true }
            );

        if (member) {
            embed.addFields(
                { name: 'Nickname', value: member.nickname || 'None', inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Roles', value: member.roles.cache.size.toString(), inline: true },
                { name: 'Highest Role', value: member.roles.highest.name, inline: true },
                { name: 'Premiuming Since', value: member.premiumSince ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>` : 'Not boosting', inline: true }
            );
        }

        embed.setFooter({ text: `User ID: ${user.id}` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async interactExecute(client, interaction) {
        let user = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} User Information`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: 'Username', value: user.username, inline: true },
                { name: 'Discriminator', value: user.discriminator, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'System', value: user.system ? 'Yes' : 'No', inline: true }
            );

        if (member) {
            embed.addFields(
                { name: 'Nickname', value: member.nickname || 'None', inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Roles', value: member.roles.cache.size.toString(), inline: true },
                { name: 'Highest Role', value: member.roles.highest.name, inline: true },
                { name: 'Premiuming Since', value: member.premiumSince ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>` : 'Not boosting', inline: true }
            );
        }

        embed.setFooter({ text: `User ID: ${user.id}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
