const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Manage whitelist (Owner Only)')
        .addSubcommand(sub => sub.setName('add').setDescription('Add user to whitelist')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove user from whitelist')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('check').setDescription('Check if user is whitelisted')
            .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');

        // Simple in-memory whitelist (can be extended with database)
        if (!interaction.client.whitelist) {
            interaction.client.whitelist = new Set();
        }

        if (sub === 'add' && user) {
            interaction.client.whitelist.add(user.id);
            logger.ownerAction('whitelist add', interaction.user.id, `Whitelisted ${user.tag}`);
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.owner.whitelist} ${user.tag} has been added to whitelist!`)
                ] 
            });
        } else if (sub === 'remove' && user) {
            interaction.client.whitelist.delete(user.id);
            logger.ownerAction('whitelist remove', interaction.user.id, `Unwhitelisted ${user.tag}`);
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.success} ${user.tag} has been removed from whitelist!`)
                ] 
            });
        } else if (sub === 'check' && user) {
            const isWhitelisted = interaction.client.whitelist.has(user.id) || config.ownerIds.includes(user.id);
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(isWhitelisted ? 0x00FF00 : 0xFF0000)
                    .setDescription(`${isWhitelisted ? emojis.owner.whitelist : emojis.error} ${user.tag} is ${isWhitelisted ? 'whitelisted' : 'not whitelisted'}!`)
                ] 
            });
        }
    }
};
