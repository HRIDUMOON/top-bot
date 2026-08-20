const { EmbedBuilder } = require('discord.js');
const os = require('os');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'uptime',
    description: 'Show the bot uptime',
    aliases: ['up'],
    category: 'info',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: false,
    
    options: [],

    async execute(client, message, args, prefix) {
        const uptime = formatUptime(client.uptime);
        
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Bot Uptime`)
            .setDescription(`**${uptime}**`)
            .addFields(
                { name: 'Days', value: Math.floor(client.uptime / (1000 * 60 * 60 * 24)).toString(), inline: true },
                { name: 'Hours', value: Math.floor((client.uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString(), inline: true },
                { name: 'Minutes', value: Math.floor((client.uptime % (1000 * 60 * 60)) / (1000 * 60)).toString(), inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.username}` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async interactExecute(client, interaction) {
        const uptime = formatUptime(client.uptime);
        
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Bot Uptime`)
            .setDescription(`**${uptime}**`)
            .addFields(
                { name: 'Days', value: Math.floor(client.uptime / (1000 * 60 * 60 * 24)).toString(), inline: true },
                { name: 'Hours', value: Math.floor((client.uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString(), inline: true },
                { name: 'Minutes', value: Math.floor((client.uptime % (1000 * 60 * 60)) / (1000 * 60)).toString(), inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

function formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
}
