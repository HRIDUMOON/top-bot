const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis/emojis');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Manage playlists')
        .addSubcommand(sub => sub.setName('create').setDescription('Create a new playlist')
            .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete a playlist')
            .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('load').setDescription('Load a playlist into queue')
            .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('save').setDescription('Save current queue to playlist')
            .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all your playlists'))
        .addSubcommand(sub => sub.setName('info').setDescription('View playlist info')
            .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('import').setDescription('Import playlist from URL')
            .addStringOption(opt => opt.setName('url').setDescription('Spotify/YouTube playlist URL').setRequired(true)))
        .addSubcommand(sub => sub.setName('export').setDescription('Export playlist to file')
            .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('add').setDescription('Add track to playlist')
            .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true))
            .addStringOption(opt => opt.setName('track').setDescription('Track URL or search').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove track from playlist')
            .addStringOption(opt => opt.setName('name').setDescription('Playlist name').setRequired(true))
            .addIntegerOption(opt => opt.setName('position').setDescription('Track position').setRequired(true))),
    
    async execute(interaction) {
        await interaction.deferReply();
        const sub = interaction.options.getSubcommand();
        const db = require('../../database/DatabaseManager');
        
        const name = interaction.options.getString('name');
        const url = interaction.options.getString('url');
        const track = interaction.options.getString('track');
        const position = interaction.options.getInteger('position');
        
        try {
            switch (sub) {
                case 'create': await createPlaylist(interaction, db, name); break;
                case 'delete': await deletePlaylist(interaction, db, name); break;
                case 'load': await loadPlaylist(interaction, db, name); break;
                case 'save': await savePlaylist(interaction, db, name); break;
                case 'list': await listPlaylists(interaction, db); break;
                case 'info': await playlistInfo(interaction, db, name); break;
                case 'import': await importPlaylist(interaction, db, url); break;
                case 'export': await exportPlaylist(interaction, db, name); break;
                case 'add': await addToPlaylist(interaction, db, name, track); break;
                case 'remove': await removeFromPlaylist(interaction, db, name, position); break;
            }
        } catch (error) {
            console.error('Playlist error:', error);
            interaction.editReply({ content: `${emojis.error} Error: ${error.message}` });
        }
    }
};

async function createPlaylist(interaction, db, name) {
    const existing = await db.all('SELECT * FROM playlists WHERE user_id = ? AND name = ?', [interaction.user.id, name]);
    if (existing.length > 0) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Playlist "${name}" already exists!`)] });
    
    await db.createPlaylist(interaction.user.id, interaction.guildId, name, []);
    interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription(`${emojis.success} Playlist "${name}" created!`)] });
}

async function deletePlaylist(interaction, db, name) {
    const playlists = await db.getPlaylists(interaction.user.id);
    const playlist = playlists.find(p => p.name === name);
    if (!playlist) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Playlist not found!`)] });
    
    await db.deletePlaylist(playlist.id, interaction.user.id);
    interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription(`${emojis.success} Playlist "${name}" deleted!`)] });
}

async function loadPlaylist(interaction, db, name) {
    const playlists = await db.getPlaylists(interaction.user.id);
    const playlist = playlists.find(p => p.name === name);
    if (!playlist) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Playlist not found!`)] });
    
    const tracks = JSON.parse(playlist.tracks || '[]');
    if (!tracks.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Playlist is empty!`)] });
    
    let player = interaction.client.kazagumo.players.get(interaction.guildId);
    if (!player) {
        player = await interaction.client.kazagumo.createPlayer({
            guildId: interaction.guildId,
            voiceId: interaction.member.voice.channelId,
            textId: interaction.channelId
        });
    }
    if (!player.connected) await player.connect();
    
    let loaded = 0;
    for (const t of tracks.slice(0, 50)) {
        try {
            const resolved = await interaction.client.kazagumo.resolve(t.uri || t.url);
            if (resolved?.tracks?.length) { player.queue.add(resolved.tracks[0]); loaded++; }
        } catch (e) { console.error(e); }
    }
    if (!player.playing && !player.paused) player.play();
    interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription(`${emojis.success} Loaded ${loaded} tracks!`)] });
}

async function savePlaylist(interaction, db, name) {
    const player = interaction.client.kazagumo.players.get(interaction.guildId);
    if (!player || !player.queue.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} No queue to save!`)] });
    
    const tracks = player.queue.map(t => ({ title: t.title, author: t.author, uri: t.uri, duration: t.duration }));
    await db.createPlaylist(interaction.user.id, interaction.guildId, name, tracks);
    interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription(`${emojis.success} Queue saved to "${name}"!`)] });
}

async function listPlaylists(interaction, db) {
    const playlists = await db.getPlaylists(interaction.user.id);
    if (!playlists.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(config.embed.color).setDescription(`${emojis.info} No playlists!`)] });
    
    const desc = playlists.map((p, i) => `${i + 1}. **${p.name}** - ${JSON.parse(p.tracks || '[]').length} tracks`).join('\n');
    interaction.editReply({ embeds: [new EmbedBuilder().setColor(config.embed.color).setTitle(`${emojis.music.save} Your Playlists`).setDescription(desc)] });
}

async function playlistInfo(interaction, db, name) {
    const playlists = await db.getPlaylists(interaction.user.id);
    const playlist = playlists.find(p => p.name === name);
    if (!playlist) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Not found!`)] });
    
    const tracks = JSON.parse(playlist.tracks || '[]');
    const embed = new EmbedBuilder().setColor(config.embed.color).setTitle(`${emojis.music.save} ${playlist.name}`)
        .addFields({ name: 'Tracks', value: String(tracks.length), inline: true }, { name: 'Created', value: new Date(playlist.created_at).toLocaleDateString(), inline: true });
    if (tracks.length) embed.setDescription(`**First 10:**\n${tracks.slice(0, 10).map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`);
    interaction.editReply({ embeds: [embed] });
}

async function importPlaylist(interaction, db, url) {
    try {
        const resolved = await interaction.client.kazagumo.resolve(url);
        if (!resolved?.tracks?.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Could not resolve URL!`)] });
        
        const tracks = resolved.tracks.map(t => ({ title: t.title, author: t.author, uri: t.uri, duration: t.duration }));
        const name = `Imported ${new Date().toLocaleDateString()}`;
        await db.createPlaylist(interaction.user.id, interaction.guildId, name, tracks);
        interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription(`${emojis.success} Imported ${tracks.length} tracks!`)] });
    } catch (e) { interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} ${e.message}`)] }); }
}

async function exportPlaylist(interaction, db, name) {
    const playlists = await db.getPlaylists(interaction.user.id);
    const playlist = playlists.find(p => p.name === name);
    if (!playlist) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Not found!`)] });
    
    const buffer = Buffer.from(JSON.stringify(JSON.parse(playlist.tracks || '[]'), null, 2));
    interaction.editReply({ content: `${emojis.success} Exported!`, files: [{ attachment: buffer, name: `${name}.json` }] });
}

async function addToPlaylist(interaction, db, name, query) {
    const playlists = await db.getPlaylists(interaction.user.id);
    const playlist = playlists.find(p => p.name === name);
    if (!playlist) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Not found!`)] });
    
    const resolved = await interaction.client.kazagumo.resolve(query);
    if (!resolved?.tracks?.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Track not found!`)] });
    
    const track = resolved.tracks[0];
    const tracks = JSON.parse(playlist.tracks || '[]');
    tracks.push({ title: track.title, author: track.author, uri: track.uri, duration: track.duration });
    await db.run('UPDATE playlists SET tracks = ? WHERE id = ?', [JSON.stringify(tracks), playlist.id]);
    interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription(`${emojis.success} Added "${track.title}"!`)] });
}

async function removeFromPlaylist(interaction, db, name, position) {
    const playlists = await db.getPlaylists(interaction.user.id);
    const playlist = playlists.find(p => p.name === name);
    if (!playlist) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Not found!`)] });
    
    const tracks = JSON.parse(playlist.tracks || '[]');
    if (!tracks.length || position < 1 || position > tracks.length) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`${emojis.error} Invalid position!`)] });
    
    const removed = tracks.splice(position - 1, 1);
    await db.run('UPDATE playlists SET tracks = ? WHERE id = ?', [JSON.stringify(tracks), playlist.id]);
    interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00FF00).setDescription(`${emojis.success} Removed "${removed[0].title}"!`)] });
}
