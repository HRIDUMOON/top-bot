const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'avatar',
    description: 'Get a user avatar',
    aliases: ['av'],
    category: 'info',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: false,
    
    options: [
        {
            name: 'user',
            description: 'The user to get avatar of',
            type: 6, // USER
            required: false
        }
    ],

    async execute(client, message, args, prefix) {
        let user;
        
        if (args[0]) {
            user = await client.users.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null);
        }
        
        if (!user && message.mentions.users.first()) {
            user = message.mentions.users.first();
        }
        
        if (!user) {
            user = message.author;
        }

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} ${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ size: 512 }))
            .setFooter({ text: `Requested by ${message.author.username}` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async interactExecute(client, interaction) {
        let user = interaction.options.getUser('user') || interaction.user;

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} ${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ size: 512 }))
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
