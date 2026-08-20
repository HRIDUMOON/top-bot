const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Shutdown the bot (Owner Only)'),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        await interaction.reply({ 
            embeds: [new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.owner.shutdown} Shutting down...`)
            ] 
        });
        
        logger.ownerAction('shutdown', interaction.user.id, 'Bot shutdown initiated');
        
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }
};
