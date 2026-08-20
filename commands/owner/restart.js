const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restart the bot (Owner Only)'),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        await interaction.reply({ 
            embeds: [new EmbedBuilder()
                .setColor(0xFFD700)
                .setDescription(`${emojis.loading} Restarting bot...`)
            ] 
        });
        
        logger.ownerAction('restart', interaction.user.id, 'Bot restart initiated');
        
        // Graceful restart
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }
};
