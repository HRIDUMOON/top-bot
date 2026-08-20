const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder().setName('help').setDescription('Get help with bot commands'),
    aliases: ['h', 'commands'],
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.color)
            .setTitle(`${emojis.utility.help} Enterprise Music Bot`)
            .setDescription('A premium music bot with advanced features!\n\n**Categories:**\n🎵 Music - Play, pause, skip songs\n📋 Queue - Manage your queue\n🎚️ Filters - Audio effects\nℹ️ Info - Bot information\n💎 Premium - Premium features')
            .setFooter({ text: `Use ${config.defaultPrefix}help <category> for more info` });

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help-category')
                    .setPlaceholder('Select a category')
                    .addOptions([
                        { label: 'Music', description: 'Music commands', value: 'music', emoji: emojis.music.play },
                        { label: 'Queue', description: 'Queue management', value: 'queue', emoji: emojis.queue.list },
                        { label: 'Filters', description: 'Audio filters', value: 'filters', emoji: emojis.filters.bassBoost },
                        { label: 'Info', description: 'Information', value: 'info', emoji: emojis.utility.info },
                        { label: 'Premium', description: 'Premium features', value: 'premium', emoji: emojis.premium.badge }
                    ])
            );

        interaction.reply({ embeds: [embed], components: [row] });
    }
};
