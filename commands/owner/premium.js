const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const db = require('../../database/DatabaseManager');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Manage premium (Owner Only)')
        .addSubcommand(sub => sub.setName('add').setDescription('Add premium to a guild')
            .addStringOption(opt => opt.setName('guild').setDescription('Guild ID').setRequired(true))
            .addIntegerOption(opt => opt.setName('days').setDescription('Days').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove premium from a guild')
            .addStringOption(opt => opt.setName('guild').setDescription('Guild ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('extend').setDescription('Extend premium')
            .addStringOption(opt => opt.setName('guild').setDescription('Guild ID').setRequired(true))
            .addIntegerOption(opt => opt.setName('days').setDescription('Days').setRequired(true)))
        .addSubcommand(sub => sub.setName('info').setDescription('Check premium info')
            .addStringOption(opt => opt.setName('guild').setDescription('Guild ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all premium guilds')),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: 'Not authorized!', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.options.getString('guild');
        const days = interaction.options.getInteger('days');

        if (sub === 'add') {
            const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);
            await db.addPremium(guildId, guild ? guild.name : 'Unknown', interaction.user.id, days);
            logger.premiumAdded(guildId, guild ? guild.name : 'Unknown', interaction.user.id, days);
            interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFFD700).setDescription(emojis.success + ' Premium added for ' + days + ' days!')] });
        } else if (sub === 'remove') {
            await db.removePremium(guildId);
            logger.premiumRemoved(guildId, 'Unknown');
            interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(emojis.error + ' Premium removed!')] });
        } else if (sub === 'extend') {
            const result = await db.extendPremium(guildId, days);
            if (result) {
                interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFFD700).setDescription(emojis.success + ' Premium extended by ' + days + ' days!')] });
            } else {
                interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(emojis.error + ' Guild not found!')] });
            }
        } else if (sub === 'info') {
            const premium = await db.getPremium(guildId);
            if (premium) {
                const embed = new EmbedBuilder().setColor(config.embed.color)
                    .setTitle(emojis.premium.badge + ' Premium Info')
                    .addFields(
                        { name: 'Guild', value: premium.guild_name, inline: true },
                        { name: 'Status', value: premium.status, inline: true },
                        { name: 'Remaining Days', value: String(premium.remaining_days), inline: true },
                        { name: 'Expires', value: new Date(premium.expiry_date).toLocaleDateString(), inline: true }
                    );
                interaction.reply({ embeds: [embed] });
            } else {
                interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(emojis.error + ' No premium found!')] });
            }
        } else if (sub === 'list') {
            const list = await db.getAllPremium();
            if (list.length === 0) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.embed.color).setDescription('No active premium guilds!')] });
            }
            const desc = list.map((p, i) => (i+1) + '. ' + p.guild_name + ' - ' + p.remaining_days + ' days left').join('\n');
            interaction.reply({ embeds: [new EmbedBuilder().setColor(config.embed.color).setTitle('Premium Guilds').setDescription(desc)] });
        }
    }
};
