const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('webhook')
        .setDescription('Send test webhook (Owner Only)')
        .addStringOption(opt => opt.setName('type').setDescription('Webhook type')
            .addChoices(
                { name: 'Guild Join', value: 'guild_join' },
                { name: 'Guild Leave', value: 'guild_leave' },
                { name: 'Premium', value: 'premium' },
                { name: 'Error', value: 'error' },
                { name: 'Test', value: 'test' }
            ))
        .addStringOption(opt => opt.setName('message').setDescription('Custom message')),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const type = interaction.options.getString('type') || 'test';
        const message = interaction.options.getString('message') || 'Test webhook message';
        
        const webhookUrl = config.webhooks.logging;
        
        if (!webhookUrl) {
            return interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} Webhook URL not configured in .env!`)
                ],
                ephemeral: true 
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(config.embed.color)
            .setTitle(`${emojis.owner.webhook} Webhook Test: ${type}`)
            .setDescription(message)
            .addFields(
                { name: 'Type', value: type, inline: true },
                { name: 'User', value: interaction.user.tag, inline: true },
                { name: 'Guild', value: interaction.guild?.name || 'DM', inline: true }
            )
            .setTimestamp();
        
        try {
            const { WebhookClient } = require('discord.js');
            const webhook = new WebhookClient({ url: webhookUrl });
            
            await webhook.send({ 
                username: 'Music Bot Logs',
                avatarURL: interaction.client.user.displayAvatarURL(),
                embeds: [embed]
            });
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.success} Webhook sent successfully!`)
                ] 
            });
            
            logger.ownerAction('webhook', interaction.user.id, `Sent ${type} webhook`);
        } catch (error) {
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} Failed to send webhook: ${error.message}`)
                ],
                ephemeral: true 
            });
        }
    }
};
