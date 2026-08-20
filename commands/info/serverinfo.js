const { EmbedBuilder } = require('discord.js');
const os = require('os');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'serverinfo',
    description: 'Get information about the current server',
    aliases: ['si', 'guildinfo'],
    category: 'info',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: false,
    
    options: [],

    async execute(client, message, args, prefix) {
        const guild = message.guild;
        
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Server Information`)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                { name: 'Name', value: guild.name, inline: true },
                { name: 'ID', value: guild.id, inline: true },
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Members', value: guild.memberCount.toString(), inline: true },
                { name: 'Channels', value: guild.channels.cache.size.toString(), inline: true },
                { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
                { name: 'Emojis', value: guild.emojis.cache.size.toString(), inline: true },
                { name: 'Boosts', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0})`, inline: true },
                { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Joined At', value: `<t:${Math.floor(guild.joinedTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `Server ID: ${guild.id}` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async interactExecute(client, interaction) {
        const guild = interaction.guild;
        
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Server Information`)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                { name: 'Name', value: guild.name, inline: true },
                { name: 'ID', value: guild.id, inline: true },
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Members', value: guild.memberCount.toString(), inline: true },
                { name: 'Channels', value: guild.channels.cache.size.toString(), inline: true },
                { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
                { name: 'Emojis', value: guild.emojis.cache.size.toString(), inline: true },
                { name: 'Boosts', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0})`, inline: true },
                { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Joined At', value: `<t:${Math.floor(guild.joinedTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `Server ID: ${guild.id}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
