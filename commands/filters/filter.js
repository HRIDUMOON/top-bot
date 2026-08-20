const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Apply audio filters')
        .addStringOption(opt => opt.setName('name').setDescription('Filter name').setRequired(true)
            .addChoices(
                { name: 'Bass Boost', value: 'bassboost' },
                { name: 'Nightcore', value: 'nightcore' },
                { name: 'Vaporwave', value: 'vaporwave' },
                { name: '8D', value: '8d' },
                { name: 'Clear', value: 'clear' }
            )),
    aliases: ['eq', 'audio'],
    async execute(interaction) {
        const filterName = interaction.options.getString('name');
        const player = interaction.client.kazagumo.players.get(interaction.guild.id);
        
        if (!player) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.embed.color).setDescription(emojis.error + ' Nothing is playing!')], ephemeral: true });
        }

        if (filterName === 'clear') {
            player.clearFilters();
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.embed.color).setDescription(emojis.filters.clear + ' All filters cleared!')] });
        }

        // Apply filter based on name
        let filters = {};
        switch(filterName) {
            case 'bassboost':
                filters = { equalizer: [{ band: 0, gain: 0.3 }, { band: 1, gain: 0.2 }] };
                break;
            case 'nightcore':
                filters = { timescale: { speed: 1.2, pitch: 1.2 } };
                break;
            case 'vaporwave':
                filters = { timescale: { speed: 0.85, pitch: 0.9 } };
                break;
            case '8d':
                filters = { rotation: { rotationHz: 0.2 } };
                break;
        }

        player.setFilters(filters);
        interaction.reply({ embeds: [new EmbedBuilder().setColor(config.embed.color).setDescription(emojis.success + ' Applied ' + filterName + ' filter!')] });
    }
};
