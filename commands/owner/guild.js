const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');
const logger = require('../../utils/Logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('Manage guilds (Owner Only)')
        .addSubcommand(sub => sub.setName('list').setDescription('List all guilds'))
        .addSubcommand(sub => sub.setName('leave').setDescription('Leave a guild')
            .addStringOption(opt => opt.setName('guild').setDescription('Guild ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('info').setDescription('Get guild info')
            .addStringOption(opt => opt.setName('guild').setDescription('Guild ID').setRequired(true))),
    
    async execute(interaction) {
        if (!config.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: `${emojis.error} Not authorized!`, ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.options.getString('guild');

        if (sub === 'list') {
            const guilds = await interaction.client.guilds.fetch();
            const desc = guilds.map((g, i) => `${i + 1}. ${g.name} (${g.id}) - ${g.memberCount} members`).join('\n');
            
            const embed = new EmbedBuilder()
                .setColor(config.embed.color)
                .setTitle(`${emojis.info.servers} Guilds List`)
                .setDescription(desc.substring(0, 4096))
                .setFooter({ text: `Total: ${guilds.size} guilds` });
            
            await interaction.reply({ embeds: [embed] });
            logger.ownerAction('guild list', interaction.user.id, `Listed ${guilds.size} guilds`);
            
        } else if (sub === 'leave' && guildId) {
            const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);
            if (!guild) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`${emojis.error} Guild not found!`)
                    ] 
                });
            }
            
            const name = guild.name;
            await guild.leave();
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.success} Left guild: ${name}`)
                ] 
            });
            logger.ownerAction('guild leave', interaction.user.id, `Left guild: ${name} (${guildId})`);
            
        } else if (sub === 'info' && guildId) {
            const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);
            if (!guild) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`${emojis.error} Guild not found!`)
                    ] 
                });
            }
            
            const owner = await guild.fetchOwner().catch(() => null);
            const embed = new EmbedBuilder()
                .setColor(config.embed.color)
                .setTitle(`${emojis.info.server} Guild Info`)
                .setThumbnail(guild.iconURL() || null)
                .addFields(
                    { name: 'Name', value: guild.name, inline: true },
                    { name: 'ID', value: guild.id, inline: true },
                    { name: 'Owner', value: owner ? owner.user.tag : 'Unknown', inline: true },
                    { name: 'Members', value: String(guild.memberCount), inline: true },
                    { name: 'Channels', value: String(guild.channels.cache.size), inline: true },
                    { name: 'Roles', value: String(guild.roles.cache.size), inline: true },
                    { name: 'Created', value: guild.createdAt.toLocaleDateString(), inline: true },
                    { name: 'Joined', value: guild.joinedAt.toLocaleDateString(), inline: true }
                );
            
            if (guild.description) {
                embed.addFields({ name: 'Description', value: guild.description });
            }
            
            await interaction.reply({ embeds: [embed] });
            logger.ownerAction('guild info', interaction.user.id, `Info for: ${guild.name}`);
        }
    }
};
