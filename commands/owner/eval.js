const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Evaluate JavaScript code (Owner Only)')
        .addStringOption(opt => opt.setName('code').setDescription('Code to evaluate').setRequired(true)),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const code = interaction.options.getString('code');
        
        try {
            let evaled = eval(code);
            
            if (evaled instanceof Promise) {
                evaled = await evaled;
            }
            
            if (typeof evaled !== 'string') {
                evaled = require('util').inspect(evaled, { depth: 0 });
            }
            
            if (evaled.length > 1900) {
                evaled = evaled.substring(0, 1900) + '...';
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`${emojis.owner.eval} Eval Result`)
                .setDescription(`\`\`\`js\n${evaled}\n\`\`\``)
                .setFooter({ text: `Executed by ${interaction.user.tag}` });
            
            await interaction.reply({ embeds: [embed] });
            logger.ownerAction('eval', interaction.user.id, code.substring(0, 50));
        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`${emojis.error} Eval Error`)
                .setDescription(`\`\`\`js\n${error.message}\n\`\`\``);
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            logger.error('Eval Error', error, interaction.user.id);
        }
    }
};
