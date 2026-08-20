const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reload commands (Owner Only)')
        .addStringOption(opt => opt.setName('command').setDescription('Command name to reload (leave empty for all)')),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const commandName = interaction.options.getString('command');
        
        try {
            if (commandName) {
                // Reload specific command
                const cmdPath = `./${commandName}.js`;
                delete require.cache[require.resolve(cmdPath)];
                const newCmd = require(cmdPath);
                
                interaction.client.commands.delete(commandName);
                interaction.client.commands.set(newCmd.data.name, newCmd);
                
                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setDescription(`${emojis.success} Reloaded \`${commandName}\` command!`)
                    ] 
                });
            } else {
                // Reload all commands
                const fs = require('fs');
                const path = require('path');
                const commandsDir = path.join(__dirname, '../commands');
                
                let count = 0;
                const categories = fs.readdirSync(commandsDir);
                
                for (const category of categories) {
                    const categoryPath = path.join(commandsDir, category);
                    if (fs.statSync(categoryPath).isDirectory()) continue;
                    
                    delete require.cache[require.resolve(`../commands/${category}`)];
                    const cmd = require(`../commands/${category}`);
                    if (cmd.data) {
                        interaction.client.commands.set(cmd.data.name, cmd);
                        count++;
                    }
                }
                
                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setDescription(`${emojis.success} Reloaded ${count} commands!`)
                    ] 
                });
            }
            
            logger.ownerAction('reload', interaction.user.id, commandName || 'all');
        } catch (error) {
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} Error reloading: ${error.message}`)
                ], 
                ephemeral: true 
            });
            logger.error('Reload Error', error, interaction.user.id);
        }
    }
};
