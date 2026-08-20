const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const db = require('../../database/DatabaseManager');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('noprefix')
        .setDescription('Manage NoPrefix users (Owner Only)')
        .addSubcommand(sub => sub.setName('add').setDescription('Add NoPrefix to a user')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
            .addIntegerOption(opt => opt.setName('days').setDescription('Days').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove NoPrefix from a user')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('extend').setDescription('Extend NoPrefix')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
            .addIntegerOption(opt => opt.setName('days').setDescription('Days').setRequired(true)))
        .addSubcommand(sub => sub.setName('info').setDescription('Check NoPrefix info')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all NoPrefix users')),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const days = interaction.options.getInteger('days');

        if (sub === 'add' && user && days) {
            await db.addNoPrefix(user.id, interaction.user.id, days);
            logger.noPrefixAdded(user.id, user.tag, interaction.user.id, days);
            interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.success} NoPrefix added to ${user.tag} for ${days} days!`)
                ] 
            });
        } else if (sub === 'remove' && user) {
            await db.removeNoPrefix(user.id);
            logger.noPrefixRemoved(user.id, user.tag);
            interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.success} NoPrefix removed from ${user.tag}!`)
                ] 
            });
        } else if (sub === 'extend' && user && days) {
            const result = await db.extendNoPrefix(user.id, days);
            if (result) {
                interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setDescription(`${emojis.success} NoPrefix extended for ${user.tag} by ${days} days!`)
                    ] 
                });
            } else {
                interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`${emojis.error} User not found in NoPrefix database!`)
                    ] 
                });
            }
        } else if (sub === 'info' && user) {
            const noprefix = await db.getNoPrefix(user.id);
            if (noprefix) {
                const embed = new EmbedBuilder()
                    .setColor(config.embed.color)
                    .setTitle(`${emojis.premium.badge} NoPrefix Info`)
                    .addFields(
                        { name: 'User', value: user.tag, inline: true },
                        { name: 'Status', value: noprefix.status, inline: true },
                        { name: 'Remaining Days', value: String(noprefix.remaining_days), inline: true },
                        { name: 'Expires', value: new Date(noprefix.expiry_date).toLocaleDateString(), inline: true }
                    );
                interaction.reply({ embeds: [embed] });
            } else {
                interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`${emojis.error} No NoPrefix found for ${user.tag}!`)
                    ] 
                });
            }
        } else if (sub === 'list') {
            const list = await db.getAllNoPrefix();
            if (list.length === 0) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(config.embed.color)
                        .setDescription('No active NoPrefix users!')
                    ] 
                });
            }
            const desc = list.map((n, i) => `${i + 1}. ${n.user_id} - ${n.remaining_days} days left`).join('\n');
            interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(config.embed.color)
                    .setTitle('NoPrefix Users')
                    .setDescription(desc)
                ] 
            });
        }
    }
};
