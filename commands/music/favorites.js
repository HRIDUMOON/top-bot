const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    name: 'favorites',
    description: 'Manage your favorite songs',
    aliases: ['fav'],
    category: 'music',
    premium: false,
    player: true,
    dj: false,
    voiceChannel: false,
    
    options: [
        {
            name: 'action',
            description: 'Action to perform',
            type: 3, // STRING
            required: true,
            choices: [
                { name: 'Add', value: 'add' },
                { name: 'Remove', value: 'remove' },
                { name: 'List', value: 'list' }
            ]
        }
    ],

    async execute(client, message, args, prefix) {
        const player = client.kazagumo.players.get(message.guildId);
        
        if (!player || !player.queue.current) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} No music is playing right now!`);
            return message.reply({ embeds: [embed] });
        }

        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.warning} Please specify an action: \`add\`, \`remove\`, or \`list\``);
            return message.reply({ embeds: [embed] });
        }

        const db = client.db;
        const userId = message.author.id;

        if (action === 'add') {
            const track = player.queue.current;
            
            try {
                await db.favorites.add(userId, {
                    title: track.title,
                    uri: track.uri,
                    author: track.author,
                    duration: track.duration,
                    thumbnail: track.thumbnail,
                    addedAt: Date.now()
                });

                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.success} Added [${track.title}](${track.uri}) to your favorites!`);
                
                return message.reply({ embeds: [embed] });
            } catch (error) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} This song is already in your favorites!`);
                return message.reply({ embeds: [embed] });
            }
        }

        if (action === 'remove') {
            const track = player.queue.current;
            
            try {
                await db.favorites.remove(userId, track.uri);

                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.success} Removed [${track.title}](${track.uri}) from your favorites!`);
                
                return message.reply({ embeds: [embed] });
            } catch (error) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} This song is not in your favorites!`);
                return message.reply({ embeds: [embed] });
            }
        }

        if (action === 'list') {
            const favorites = await db.favorites.getAll(userId);
            
            if (!favorites || favorites.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.warning} You don't have any favorite songs yet!`);
                return message.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.music} Your Favorite Songs`)
                .setDescription(favorites.slice(0, 10).map((fav, i) => 
                    `**${i + 1}.** [${fav.title}](${fav.uri}) - \`${formatDuration(fav.duration)}\``
                ).join('\n'))
                .setFooter({ text: `Total: ${favorites.length} favorites` });

            return message.reply({ embeds: [embed] });
        }
    },

    async interactExecute(client, interaction) {
        const player = client.kazagumo.players.get(interaction.guildId);
        
        if (!player || !player.queue.current) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.error} No music is playing right now!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const action = interaction.options.getString('action');
        const db = client.db;
        const userId = interaction.user.id;

        if (action === 'add') {
            const track = player.queue.current;
            
            try {
                await db.favorites.add(userId, {
                    title: track.title,
                    uri: track.uri,
                    author: track.author,
                    duration: track.duration,
                    thumbnail: track.thumbnail,
                    addedAt: Date.now()
                });

                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.success} Added [${track.title}](${track.uri}) to your favorites!`);
                
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} This song is already in your favorites!`);
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (action === 'remove') {
            const track = player.queue.current;
            
            try {
                await db.favorites.remove(userId, track.uri);

                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.success} Removed [${track.title}](${track.uri}) from your favorites!`);
                
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.error} This song is not in your favorites!`);
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        if (action === 'list') {
            const favorites = await db.favorites.getAll(userId);
            
            if (!favorites || favorites.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`${emojis.warning} You don't have any favorite songs yet!`);
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.music} Your Favorite Songs`)
                .setDescription(favorites.slice(0, 10).map((fav, i) => 
                    `**${i + 1}.** [${fav.title}](${fav.uri}) - \`${formatDuration(fav.duration)}\``
                ).join('\n'))
                .setFooter({ text: `Total: ${favorites.length} favorites` });

            return interaction.reply({ embeds: [embed] });
        }
    }
};

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
