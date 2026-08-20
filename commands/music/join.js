const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'join',
    description: 'Make the bot join your voice channel',
    aliases: ['j'],
    category: 'music',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: true,
    
    options: [],

    async execute(client, message, args, prefix) {
        const vc = message.member.voice.channel;
        
        if (!vc) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} You need to join a voice channel first!`);
            return message.reply({ embeds: [embed] });
        }

        let player = client.kazagumo.players.get(message.guildId);

        if (player && player.voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.warning} I'm already connected to <#${player.voiceChannel}>!`);
            return message.reply({ embeds: [embed] });
        }

        player = await client.kazagumo.createPlayer({
            guildId: message.guildId,
            voiceId: vc.id,
            textId: message.channelId,
            deaf: true
        });

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Joined <#${vc.id}> and ready to play music!`);
        
        return message.reply({ embeds: [embed] });
    },

    async interactExecute(client, interaction) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const vc = member.voice.channel;
        
        if (!vc) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} You need to join a voice channel first!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let player = client.kazagumo.players.get(interaction.guildId);

        if (player && player.voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.warning} I'm already connected to <#${player.voiceChannel}>!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        player = await client.kazagumo.createPlayer({
            guildId: interaction.guildId,
            voiceId: vc.id,
            textId: interaction.channelId,
            deaf: true
        });

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Joined <#${vc.id}> and ready to play music!`);
        
        return interaction.reply({ embeds: [embed] });
    }
};
