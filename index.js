"use strict"

const dotenv = require('dotenv');
dotenv.config();

const Discord = require('discord.js');

const { Intents, Collection } = require('discord.js');

const bot = new Discord.Client(
    {
    intents: [
          Intents.FLAGS.GUILDS, 
          Intents.FLAGS.GUILD_MEMBERS,
          Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
          Intents.FLAGS.GUILD_INTEGRATIONS,
          Intents.FLAGS.GUILD_WEBHOOKS,
          Intents.FLAGS.GUILD_INVITES,
          Intents.FLAGS.GUILD_VOICE_STATES,
          Intents.FLAGS.GUILD_PRESENCES,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
          Intents.FLAGS.GUILD_MESSAGE_TYPING,
          Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
          Intents.FLAGS.DIRECT_MESSAGE_TYPING,
          Intents.FLAGS.DIRECT_MESSAGES,
          Intents.FLAGS.GUILD_SCHEDULED_EVENTS
      ]
    }
);

bot.setMaxListeners(100);
bot.commands = new Collection();

//require('./deploy-commands');

const fs = require('fs');
const commandFiles = fs.readdirSync('././commands').filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`././commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	bot.commands.set(command.data.name, command);
}

process.setMaxListeners(100);
//const readline = require('readline');

const strawpoll = require('./commands/strawpoll.js');
const player = require('./commands/player.js');

const token = process.env.TOKEN;

//const rl = readline.createInterface({
//    input: fs.createReadStream('auf')
//});

//var aufFileLines = new Array();
//rl.on('line', (line) => {
//    aufFileLines.push(line);
//});

//rl.on('close', () => {unlocked = true});

bot.on('ready', () => {
    //loadPlaylistsData();
    try {
        //client = new Client({
        //    connectionString: process.env.DATABASE_URL,
        //    ssl: {
        //      rejectUnauthorized: false
        //    }
        // });
        //client.connect();
    } catch (e) {
        console.log(e);
    }

    console.log("online");

    //tools.onReady(bot, musicChannels);
});

bot.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        console.log(`interaction:  ${interaction.user.tag}`);
        const command = bot.commands.get(interaction.commandName);

        if (!command) return;

	    try {
	        await command.execute(interaction);
	    } catch (error) {
		    console.error(error);
		    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	    }
    } else if (interaction.isButton()) {
        if (interaction.customId == 'poll') {
            strawpoll.poll(interaction);
        } else if (interaction.customId == 'restart') {
            strawpoll.restart(interaction);
        } else if (interaction.customId == 'closePoll') {
            strawpoll.close(interaction);
        } else if (interaction.customId == 'closePlayer') {
            player.close(interaction);
        } else if (interaction.customId == 'play') {
            player.onPlay(interaction);
        } else if (interaction.customId == 'skip') {
            player.onSkip(interaction);
        } else if (interaction.customId == 'prev') {
            player.onPrev(interaction);
        } else if (interaction.customId == 'plus') {
            player.onVolume(interaction, 0.1);
        } else if (interaction.customId == 'minus') {
            player.onVolume(interaction, -0.1);
        } else if (interaction.customId == 'link') {
            player.onLink(interaction);
        } else if (interaction.customId == 'shuffle') {
            player.onShuffle(interaction);
        } else if (interaction.customId == 'repeatQ') {
            player.onRepeatQ(interaction);
        } else if (interaction.customId == 'repeat') {
            player.onRepeat(interaction);
        } else if (interaction.customId == 'unload') {
            player.onUnload(interaction);
        }
    }
});

bot.on('messageCreate', (msg) => {
    var args = msg.content.split(' ');

    if (args[0].startsWith('!')) {
         msg.reply("бот использует новый DISCORD API V12-13 используйте '/' комманды")
    }
});
    
bot.on('error', console.warn);

bot.login(token);

module.exports = {
    newBroadcast: function() {

    }
}