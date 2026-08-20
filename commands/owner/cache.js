const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cache')
        .setDescription('View and manage cache (Owner Only)')
        .addStringOption(opt => opt.setName('action').setDescription('Action to perform')
            .addChoices(
                { name: 'View', value: 'view' },
                { name: 'Clear Users', value: 'clear_users' },
                { name: 'Clear Guilds', value: 'clear_guilds' },
                { name: 'Clear All', value: 'clear_all' }
            )),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const action = interaction.options.getString('action') || 'view';
        
        if (action === 'view') {
            const users = interaction.client.users.cache.size;
            const guilds = interaction.client.guilds.cache.size;
            const channels = interaction.client.channels.cache.size;
            const messages = interaction.client.channels.cache.reduce((acc, ch) => {
                if (ch.messages) return acc + ch.messages.cache.size;
                return acc;
            }, 0);
            
            const embed = new EmbedBuilder()
                .setColor(config.embed.color)
                .setTitle(`${emojis.owner.cache} Cache Statistics`)
                .addFields(
                    { name: 'Users', value: String(users), inline: true },
                    { name: 'Guilds', value: String(guilds), inline: true },
                    { name: 'Channels', value: String(channels), inline: true },
                    { name: 'Messages', value: String(messages), inline: true }
                )
                .setFooter({ text: `Cache Stats for ${interaction.client.user.tag}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            logger.ownerAction('cache view', interaction.user.id, 'Viewed cache stats');
            
        } else if (action === 'clear_users') {
            interaction.client.users.cache.clear();
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.success} Users cache cleared!`)
                ] 
            });
            logger.ownerAction('cache clear_users', interaction.user.id, 'Cleared users cache');
            
        } else if (action === 'clear_guilds') {
            interaction.client.guilds.cache.clear();
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.success} Guilds cache cleared!`)
                ] 
            });
            logger.ownerAction('cache clear_guilds', interaction.user.id, 'Cleared guilds cache');
            
        } else if (action === 'clear_all') {
            interaction.client.users.cache.clear();
            interaction.client.guilds.cache.clear();
            interaction.client.channels.cache.clear();
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.success} All cache cleared!`)
                ] 
            });
            logger.ownerAction('cache clear_all', interaction.user.id, 'Cleared all cache');
        }
    }
};
