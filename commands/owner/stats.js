const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View bot statistics (Owner Only)'),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const guilds = await interaction.client.guilds.fetch();
        const users = guilds.reduce((acc, g) => acc + g.memberCount, 0);
        const channels = guilds.reduce((acc, g) => acc + g.channels.cache.size, 0);
        
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        const embed = new EmbedBuilder()
            .setColor(config.embed.color)
            .setTitle(`${emojis.owner.stats} Bot Statistics`)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: 'Guilds', value: String(guilds.size), inline: true },
                { name: 'Users', value: String(users), inline: true },
                { name: 'Channels', value: String(channels), inline: true },
                { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
                { name: 'Memory Usage', value: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: 'Heap Total', value: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: 'RSS', value: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: 'Node Version', value: process.version, inline: true },
                { name: 'Discord.js Version', value: require('discord.js').version, inline: true }
            )
            .setFooter({ text: `Stats for ${interaction.client.user.tag}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        logger.ownerAction('stats', interaction.user.id, 'Viewed bot statistics');
    }
};
