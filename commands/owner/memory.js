const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('memory')
        .setDescription('View memory usage (Owner Only)'),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const os = require('os');
        const memoryUsage = process.memoryUsage();
        
        const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
        const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2);
        const external = (memoryUsage.external / 1024 / 1024).toFixed(2);
        
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedMemory = (totalMemory - freeMemory).toFixed(2);
        const usagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);
        
        const embed = new EmbedBuilder()
            .setColor(config.embed.color)
            .setTitle(`${emojis.owner.stats} Memory Information`)
            .addFields(
                { name: 'Heap Used', value: `${heapUsed} MB`, inline: true },
                { name: 'Heap Total', value: `${heapTotal} MB`, inline: true },
                { name: 'RSS', value: `${rss} MB`, inline: true },
                { name: 'External', value: `${external} MB`, inline: true },
                { name: 'System Total', value: `${totalMemory} GB`, inline: true },
                { name: 'System Free', value: `${freeMemory} GB`, inline: true },
                { name: 'System Used', value: `${usedMemory} GB (${usagePercent}%)`, inline: true }
            )
            .setFooter({ text: `Memory Stats for ${interaction.client.user.tag}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        logger.ownerAction('memory', interaction.user.id, 'Viewed memory stats');
    }
};
