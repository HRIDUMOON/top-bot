const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const db = require('../../database/DatabaseManager');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage blacklist (Owner Only)')
        .addSubcommand(sub => sub.setName('add').setDescription('Add user to blacklist')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove user from blacklist')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('check').setDescription('Check if user is blacklisted')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        if (sub === 'add' && user && reason) {
            await db.addToBlacklist(interaction.guildId || 'DM', user.id, reason, interaction.user.id);
            logger.ownerAction('blacklist add', interaction.user.id, `Blacklisted ${user.tag}: ${reason}`);
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.owner.blacklist} ${user.tag} has been blacklisted!\n**Reason:** ${reason}`)
                ] 
            });
        } else if (sub === 'remove' && user) {
            await db.removeFromBlacklist(interaction.guildId || 'DM', user.id);
            logger.ownerAction('blacklist remove', interaction.user.id, `Unblacklisted ${user.tag}`);
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.success} ${user.tag} has been removed from blacklist!`)
                ] 
            });
        } else if (sub === 'check' && user) {
            const isBlacklisted = await db.isBlacklisted(interaction.guildId || 'DM', user.id);
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(isBlacklisted ? 0xFF0000 : 0x00FF00)
                    .setDescription(`${isBlacklisted ? emojis.owner.blacklist : emojis.success} ${user.tag} is ${isBlacklisted ? 'blacklisted' : 'not blacklisted'}!`)
                ] 
            });
        }
    }
};
