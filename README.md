# Enterprise Music Bot

A production-ready, enterprise-grade Discord Music Bot built with Discord.js v14, Kazagumo, Shoukaku, and Lavalink v4.

## Features

- **High-Quality Music**: Support for YouTube, Spotify, SoundCloud, and direct URLs
- **Advanced Filters**: Bass Boost, Nightcore, Vaporwave, 8D, and more (Premium)
- **Queue Management**: Shuffle, remove, move tracks with pagination
- **24/7 Mode**: Keep bot in voice channel continuously (Premium)
- **Autoplay**: Smart song recommendations when queue ends (Premium)
- **Playlist System**: Create, save, load, and share playlists
- **Favorites**: Save your favorite tracks
- **Premium System**: Guild-based premium with expiration
- **NoPrefix System**: Allow users to use commands without prefix
- **Components V2 UI**: Professional Discord UI with buttons, menus, and modals
- **Multi-Lavalink Support**: Automatic node failover and reconnection
- **SQLite Database**: Persistent storage for all data
- **Webhook Logging**: Comprehensive logging system
- **Anti-Crash Protection**: Graceful error handling

## Requirements

- Node.js >= 18.0.0
- Lavalink server (v4 recommended)
- Discord Bot Token
- SQLite support

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment: `cp .env.example .env` then edit `.env`
4. Start the bot: `npm start`

## Configuration

All configuration is done through `.env`:
- `BOT_TOKEN`: Your Discord bot token
- `CLIENT_ID`: Your bot's client ID  
- `OWNER_IDS`: Comma-separated owner user IDs
- `DEFAULT_PREFIX`: Default command prefix
- `LAVALINK_HOST/PORT/PASSWORD`: Lavalink credentials
- And many more...

See `.env.example` for full options.

## Commands

**Music**: `/play`, `/pause`, `/resume`, `/stop`, `/skip`, `/loop`, `/nowplaying`, `/volume`, `/247`, `/autoplay`

**Queue**: `/queue`, `/shuffle`, `/clear`, `/remove`, `/move`

**Filters**: `/filter` (bassboost, nightcore, vaporwave, 8d, clear, etc.)

**Info**: `/help`, `/ping`, `/invite`, `/support`, `/botinfo`

**Owner**: `/premium add/remove/extend/info/list`

## Project Structure

```
├── commands/     # Commands by category (music, queue, filters, etc.)
├── config/       # Configuration manager
├── database/     # SQLite database manager
├── emojis/       # Centralized emoji system
├── handlers/     # Command & event handlers
├── managers/     # Player manager
├── utils/        # Logger and utilities
├── src/          # Main entry point
└── .env.example  # Environment template
```

## License

ISC
