const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cpu')
        .setDescription('View CPU usage (Owner Only)'),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const os = require('os');
        const cpuUsage = process.cpuUsage();
        const cpus = os.cpus();
        
        const userUsage = (cpuUsage.user / 1024 / 1024).toFixed(2);
        const systemUsage = (cpuUsage.system / 1024 / 1024).toFixed(2);
        const totalCores = cpus.length;
        const cpuModel = cpus[0].model;
        const cpuSpeed = cpus[0].speed;
        
        const embed = new EmbedBuilder()
            .setColor(config.embed.color)
            .setTitle(`${emojis.owner.stats} CPU Information`)
            .addFields(
                { name: 'Model', value: cpuModel, inline: false },
                { name: 'Speed', value: `${cpuSpeed} MHz`, inline: true },
                { name: 'Cores', value: String(totalCores), inline: true },
                { name: 'User Usage', value: `${userUsage} MB`, inline: true },
                { name: 'System Usage', value: `${systemUsage} MB`, inline: true },
                { name: 'Platform', value: os.platform(), inline: true },
                { name: 'Uptime', value: (os.uptime() / 3600).toFixed(2) + ' hours', inline: true }
            )
            .setFooter({ text: `CPU Stats for ${interaction.client.user.tag}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        logger.ownerAction('cpu', interaction.user.id, 'Viewed CPU stats');
    }
};
