/**
 * Player Manager
 * Manages music players, queues, and playback for all guilds
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config');
const db = require('../database/managers/database');
const logger = require('../utils/logger');
const emojis = require('../emojis/index');

class PlayerManager {
    constructor(client) {
        this.client = client;
        this.players = new Map();
        this.messageCache = new Map();
    }

    createPlayer(guildId, options = {}) {
        if (!this.client.kazagumo) return null;

        let player = this.client.kazagumo.players.get(guildId);
        
        if (!player) {
            player = this.client.kazagumo.createPlayer({
                guildId: guildId,
                voiceChannel: options.voiceChannel,
                textChannel: options.textChannel,
                selfDeafen: true,
                volume: options.volume || config.premium.defaultVolume
            });
            
            this.players.set(guildId, player);
        }

        return player;
    }

    getPlayer(guildId) {
        return this.client.kazagumo?.players.get(guildId) || this.players.get(guildId);
    }

    destroyPlayer(guildId) {
        const player = this.getPlayer(guildId);
        if (player) {
            player.destroy();
            this.players.delete(guildId);
            this.messageCache.delete(guildId);
            db.deleteQueue(guildId);
        }
    }

    async play(client, interactionOrMessage, query, options = {}) {
        const guildId = interactionOrMessage.guildId || interactionOrMessage.guild.id;
        const voiceChannel = interactionOrMessage.member?.voice?.channel;
        const textChannel = interactionOrMessage.channel;

        if (!voiceChannel) {
            return this.sendError(interactionOrMessage, 'You must be in a voice channel to use this command.');
        }

        const player = this.createPlayer(guildId, {
            voiceChannel: voiceChannel.id,
            textChannel: textChannel.id,
            volume: db.getSettings(guildId)?.volume || config.premium.defaultVolume
        });

        if (!player) {
            return this.sendError(interactionOrMessage, 'Failed to create player.');
        }

        try {
            await player.connect(voiceChannel.id);
        } catch (error) {
            logger.error('Failed to connect to voice channel', { error: error.message });
            return this.sendError(interactionOrMessage, 'Failed to connect to voice channel.');
        }

        let result;
        try {
            result = await player.search(query, {
                requester: interactionOrMessage.user || interactionOrMessage.author,
                engine: options.engine || 'youtube'
            });
        } catch (error) {
            logger.error('Search error', { error: error.message });
            return this.sendError(interactionOrMessage, 'Failed to search for tracks.');
        }

        if (!result || !result.tracks.length) {
            return this.sendError(interactionOrMessage, 'No tracks found.');
        }

        if (result.type === 'PLAYLIST') {
            for (const track of result.tracks) {
                track.requester = interactionOrMessage.user || interactionOrMessage.author;
                player.queue.add(track);
                db.addToQueueHistory(guildId, track);
            }
            
            if (!player.playing && !player.paused) {
                player.play();
            }

            return this.sendSuccess(interactionOrMessage, `Added **${result.tracks.length}** tracks from playlist to queue.`);
        } else {
            const track = result.tracks[0];
            track.requester = interactionOrMessage.user || interactionOrMessage.author;
            
            if (options.playNext) {
                player.queue.unshift(track);
            } else {
                player.queue.add(track);
            }
            
            db.addToQueueHistory(guildId, track);

            if (!player.playing && !player.paused) {
                player.play();
            }

            if (!options.playNext) {
                return this.sendSuccess(interactionOrMessage, `Added **${track.title}** to queue.`);
            }
        }

        if (player.playing) {
            await this.sendNowPlaying(player);
        }
    }

    handleTrackStart(player) {
        const track = player.queue.current;
        if (!track) return;
        logger.info(`Now playing: ${track.title} in guild ${player.guildId}`);
        this.sendNowPlaying(player);
    }

    handleTrackEnd(player) {
        const settings = db.getSettings(player.guildId);
        
        if (settings?.loop === 'track' && player.queue.current) {
            player.queue.add(player.queue.current);
        }

        if (player.queue.size > 0) {
            player.play();
        } else if (settings?.autoplay) {
            this.triggerAutoplay(player);
        } else {
            this.handleQueueEnd(player);
        }
    }

    async triggerAutoplay(player) {
        const currentTrack = player.queue.current;
        if (!currentTrack) return;

        try {
            const result = await player.search(`${currentTrack.author} - best songs`, {
                requester: currentTrack.requester,
                engine: 'youtube'
            });

            if (result && result.tracks.length > 0) {
                const newTracks = result.tracks.filter(t => 
                    t.uri !== currentTrack.uri && 
                    !player.queue.some(q => q.uri === t.uri)
                );

                if (newTracks.length > 0) {
                    player.queue.add(newTracks[0]);
                    player.play();
                }
            }
        } catch (error) {
            logger.error('Autoplay error', { error: error.message });
        }
    }

    handleQueueEnd(player) {
        const settings = db.getSettings(player.guildId);
        
        if (settings?.twentyfourseven) {
            player.pause(true);
            player.queue.clear();
        } else {
            setTimeout(() => {
                const p = this.getPlayer(player.guildId);
                if (p && !p.playing && !p.paused && p.queue.size === 0) {
                    this.destroyPlayer(player.guildId);
                }
            }, config.player.autoLeaveSeconds * 1000);
        }

        this.clearNowPlaying(player.guildId);
    }

    handlePlayerStuck(player, track) {
        logger.warn(`Player stuck in guild ${player.guildId}`, { track: track?.title });
        player.stop();
    }

    handlePlayerException(player, track, exception) {
        logger.musicError(exception, player.guildId, track?.title);
        player.stop();
    }

    async sendNowPlaying(player) {
        const track = player.queue.current;
        if (!track) return;

        const guildId = player.guildId;
        const settings = db.getSettings(guildId);
        const isPremium = db.isPremium(guildId);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setAuthor({ name: 'Now Playing' })
            .setDescription(`### ${track.title}`)
            .addFields(
                { name: 'Requester', value: `<@${track.requester?.id}>`, inline: true },
                { name: 'Duration', value: this.formatDuration(track.duration), inline: true },
                { name: 'Platform', value: this.getPlatformName(track.source), inline: true },
                { name: 'Queue', value: `Position: ${player.queue.position + 1} | Size: ${player.queue.size}`, inline: true },
                { name: 'Volume', value: `${player.volume}%`, inline: true },
                { name: 'Loop', value: this.getLoopStatus(settings?.loop || 'off'), inline: true }
            )
            .setThumbnail(track.thumbnail || null)
            .setTimestamp();

        const progressBar = this.createProgressBar(track.duration, player.position);
        embed.addFields({ name: '\u200b', value: progressBar, inline: false });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('player_previous').setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(!isPremium),
            new ButtonBuilder().setCustomId('player_pause').setLabel('Pause').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('player_stop').setLabel('Stop').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('player_skip').setLabel('Skip').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('player_shuffle').setLabel('Shuffle').setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('player_loop').setLabel('Loop').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('player_queue').setLabel('Queue').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('player_favorite').setLabel('Favorite').setStyle(ButtonStyle.Secondary)
        );

        const textChannel = this.client.channels.cache.get(player.textChannel);
        if (!textChannel) return;

        try {
            const existingMsg = this.messageCache.get(guildId);
            
            if (existingMsg) {
                try {
                    await existingMsg.edit({ embeds: [embed], components: [row1, row2] }).catch(() => {});
                } catch {
                    this.messageCache.delete(guildId);
                    const newMsg = await textChannel.send({ embeds: [embed], components: [row1, row2] });
                    this.messageCache.set(guildId, newMsg);
                }
            } else {
                const newMsg = await textChannel.send({ embeds: [embed], components: [row1, row2] });
                this.messageCache.set(guildId, newMsg);
            }
        } catch (error) {
            logger.error('Failed to send now playing message', { error: error.message });
        }
    }

    clearNowPlaying(guildId) {
        const msg = this.messageCache.get(guildId);
        if (msg) {
            try { msg.delete().catch(() => {}); } catch {}
            this.messageCache.delete(guildId);
        }
    }

    async handlePlayerButton(interaction, action) {
        const player = this.getPlayer(interaction.guildId);
        
        if (!player) {
            return interaction.reply({ content: 'No player is active.', ephemeral: true });
        }

        switch (action) {
            case 'pause':
                if (player.paused) return interaction.reply({ content: 'Already paused.', ephemeral: true });
                player.pause(true);
                return interaction.reply({ content: 'Paused.', ephemeral: true });
            case 'resume':
                if (!player.paused) return interaction.reply({ content: 'Already playing.', ephemeral: true });
                player.pause(false);
                return interaction.reply({ content: 'Resumed.', ephemeral: true });
            case 'skip':
                if (player.queue.size === 0) return interaction.reply({ content: 'No more tracks.', ephemeral: true });
                player.stop();
                return interaction.reply({ content: 'Skipped.', ephemeral: true });
            case 'stop':
                this.destroyPlayer(interaction.guildId);
                return interaction.reply({ content: 'Stopped.', ephemeral: true });
            case 'shuffle':
                player.queue.shuffle();
                return interaction.reply({ content: 'Shuffled queue.', ephemeral: true });
            case 'loop':
                const settings = db.getSettings(interaction.guildId);
                const loops = ['off', 'track', 'queue'];
                const currentIndex = loops.indexOf(settings?.loop || 'off');
                const nextLoop = loops[(currentIndex + 1) % loops.length];
                db.updateLoop(interaction.guildId, nextLoop);
                return interaction.reply({ content: `Loop: **${nextLoop}**`, ephemeral: true });
            default:
                break;
        }
    }

    createProgressBar(duration, position) {
        const percent = position / duration;
        const progressLength = 15;
        const filledLength = Math.round(progressLength * percent);
        const emptyLength = progressLength - filledLength;
        return `▓`.repeat(filledLength) + `░`.repeat(emptyLength) + ` \`${this.formatDuration(position)} / ${this.formatDuration(duration)}\``;
    }

    formatDuration(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const parts = [];
        if (hours > 0) parts.push(`${hours}:`);
        parts.push(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        return parts.join('');
    }

    getPlatformName(source) {
        return source || 'Unknown';
    }

    getLoopStatus(loop) {
        return loop || 'off';
    }

    sendError(context, message) {
        const response = { embeds: [{ color: 0xED4245, description: `❌ ${message}` }] };
        if (context.reply) return context.reply({ ...response, ephemeral: true });
        if (context.channel) return context.channel.send(response);
    }

    sendSuccess(context, message) {
        const response = { embeds: [{ color: 0x57F287, description: `✅ ${message}` }] };
        if (context.reply) return context.reply({ ...response, ephemeral: true });
        if (context.channel) return context.channel.send(response);
    }
}

module.exports = PlayerManager;
