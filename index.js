"use strict"

import { config } from 'dotenv';
import { Client } from 'discord.js';
import { Intents, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { poll, restart, close } from './commands/strawpoll.js';
import { onClose, onPlay, onSkip, onPrev, onVolume, onLink, onShuffle, onRepeatQ, onRepeat, onUnload } from './commands/player.js';

process.setMaxListeners(100);
config();

const token = process.env.TOKEN;
export const updateDelay = parseInt(process.env.DELAY, 10);
export const shiftAmount = parseInt(process.env.SHIFT, 10);
export const name = process.env.NAME;

const bot = new Client(
    {
        intents: [
            Intents.FLAGS.GUILDS, 
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_VOICE_STATES,
        ]
    }
);

bot.setMaxListeners(100);
bot.commands = new Collection();

bot.on('ready', async () => {
    //loadPlaylistsData();
    try {
        const commandFiles = readdirSync('././commands').filter((file) => file.endsWith('.js'));

        for (const file of commandFiles) {
	        const command = await import(`././commands/${file}`);
	        // Set a new item in the Collection
	        // With the key as the command name and the value as the exported module
	        bot.commands.set(command.data.name, command);
        }
    } catch (e) {
        console.log(e);
    }

    console.log("online");
});

bot.on('interactionCreate', async (interaction) => {
    console.log(`interaction:  ${interaction.user.tag}`);
    if (interaction.isCommand()) {
        const command = bot.commands.get(interaction.commandName);

        if (!command) 
            return;
	    try {
	        await command.execute(interaction);
	    } catch (error) {
		    console.error(error);
		    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	    }
    } else if (interaction.isButton()) {
        if (interaction.customId == 'poll') {
            poll(interaction);
        } else if (interaction.customId == 'restart') {
            restart(interaction);
        } else if (interaction.customId == 'closePoll') {
            close(interaction);
        } else if (interaction.customId == 'closePlayer') {
            onClose(interaction);
        } else if (interaction.customId == 'play') {
            onPlay(interaction);
        } else if (interaction.customId == 'skip') {
            onSkip(interaction);
        } else if (interaction.customId == 'prev') {
            onPrev(interaction);
        } else if (interaction.customId == 'plus') {
            onVolume(interaction, 0.1);
        } else if (interaction.customId == 'minus') {
            onVolume(interaction, -0.1);
        } else if (interaction.customId == 'link') {
            onLink(interaction);
        } else if (interaction.customId == 'shuffle') {
            onShuffle(interaction);
        } else if (interaction.customId == 'repeatQ') {
            onRepeatQ(interaction);
        } else if (interaction.customId == 'repeat') {
            onRepeat(interaction);
        } else if (interaction.customId == 'unload') {
            onUnload(interaction);
        }
    }
});

bot.on('messageCreate', (msg) => {
    var args = msg.content.split(' ');

    if (args[0].startsWith('!')) {
         msg.reply("бот использует новый DISCORD API V12-13 используйте '/' комманды")
    }
});
    
bot.on('error', error => console.log(error));

bot.login(token);