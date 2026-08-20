const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder().setName('botinfo').setDescription('Get bot information'),
    aliases: ['info', 'stats'],
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embed.color)
            .setTitle(emojis.utility.botInfo + ' Bot Information')
            .addFields(
                { name: 'Name', value: interaction.client.user.tag, inline: true },
                { name: 'ID', value: interaction.client.user.id, inline: true },
                { name: 'Servers', value: String(interaction.client.guilds.cache.size), inline: true },
                { name: 'Uptime', value: formatUptime(interaction.client.uptime), inline: true },
                { name: 'Node.js', value: process.version, inline: true },
                { name: 'Discord.js', value: require('discord.js').version, inline: true }
            )
            .setTimestamp();
        interaction.reply({ embeds: [embed] });
    }
};

function formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
}
