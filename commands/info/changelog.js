const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'changelog',
    description: 'View the latest changelog',
    aliases: ['cl', 'updates'],
    category: 'info',
    premium: false,
    player: false,
    dj: false,
    voiceChannel: false,
    
    options: [],

    async execute(client, message, args, prefix) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Changelog - Latest Updates`)
            .setDescription('**Version 2.0.0** - Major Update')
            .addFields(
                { 
                    name: `${emojis.success} New Features`, 
                    value: [
                        '• Added seek, rewind, forward commands',
                        '• Added lyrics command',
                        '• Added search with platform selection',
                        '• Added playnext (Premium)',
                        '• Added previous track (Premium)',
                        '• Added skipto (Premium)',
                        '• Added jump to position',
                        '• Added save/grab commands',
                        '• Added favorites system',
                        '• Added join/leave commands'
                    ].join('\n'),
                    inline: false 
                },
                { 
                    name: `${emojis.music} Music Improvements`, 
                    value: [
                        '• Better queue management',
                        '• Improved filter system',
                        '• Enhanced player stability',
                        '• Auto-reconnect support'
                    ].join('\n'),
                    inline: false 
                },
                { 
                    name: `${emojis.warning} Bug Fixes`, 
                    value: [
                        '• Fixed queue display issues',
                        '• Fixed volume control',
                        '• Improved error handling',
                        '• Better emoji support'
                    ].join('\n'),
                    inline: false 
                }
            )
            .setFooter({ text: `Requested by ${message.author.username}` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    },

    async interactExecute(client, interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Changelog - Latest Updates`)
            .setDescription('**Version 2.0.0** - Major Update')
            .addFields(
                { 
                    name: `${emojis.success} New Features`, 
                    value: [
                        '• Added seek, rewind, forward commands',
                        '• Added lyrics command',
                        '• Added search with platform selection',
                        '• Added playnext (Premium)',
                        '• Added previous track (Premium)',
                        '• Added skipto (Premium)',
                        '• Added jump to position',
                        '• Added save/grab commands',
                        '• Added favorites system',
                        '• Added join/leave commands'
                    ].join('\n'),
                    inline: false 
                },
                { 
                    name: `${emojis.music} Music Improvements`, 
                    value: [
                        '• Better queue management',
                        '• Improved filter system',
                        '• Enhanced player stability',
                        '• Auto-reconnect support'
                    ].join('\n'),
                    inline: false 
                },
                { 
                    name: `${emojis.warning} Bug Fixes`, 
                    value: [
                        '• Fixed queue display issues',
                        '• Fixed volume control',
                        '• Improved error handling',
                        '• Better emoji support'
                    ].join('\n'),
                    inline: false 
                }
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
