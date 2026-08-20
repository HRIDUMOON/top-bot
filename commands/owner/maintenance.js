const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

let maintenanceMode = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('Toggle maintenance mode (Owner Only)')
        .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable or disable maintenance mode')),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const enabled = interaction.options.getBoolean('enabled') ?? !maintenanceMode;
        maintenanceMode = enabled;
        
        const embed = new EmbedBuilder()
            .setColor(enabled ? 0xFFD700 : 0x00FF00)
            .setDescription(`${enabled ? emojis.warning : emojis.success} Maintenance mode ${enabled ? 'enabled' : 'disabled'}!`)
            .setFooter({ text: enabled ? 'Bot is now in maintenance mode' : 'Bot is back online' });
        
        await interaction.reply({ embeds: [embed] });
        
        logger.ownerAction('maintenance', interaction.user.id, `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
        
        // Update bot status
        if (enabled) {
            interaction.client.user.setPresence({
                activities: [{ name: 'Maintenance Mode', type: 3 }],
                status: 'dnd'
            });
        } else {
            const activityType = config.activity.type || 2;
            interaction.client.user.setPresence({
                activities: [{ name: config.activity.text || 'Music', type: activityType }],
                status: config.activity.status || 'online'
            });
        }
    },
    
    getMaintenanceMode() {
        return maintenanceMode;
    }
};
