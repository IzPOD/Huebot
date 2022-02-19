import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';

import { BotPlayer } from '../BotPlayer.js';
import { AudioPlayerStatus } from '@discordjs/voice';


import ytpl from "ytpl";
import ytdl from "ytdl-core";
import { Queue } from '../Queue.js';

const players = new Map();

export const updateDelay = 2000;
export const data = new SlashCommandBuilder()
    .setName('player')
    .setDescription('mp3 плеер')
    .addStringOption(option => option.setName('link')
        .setDescription('Youtube link')
        .setRequired(false));
export async function execute(interaction) {
    if (!checkInChannel(interaction)) {
        return;
    }

    let voiceChannel = interaction.member.voice.channel;
    let player = players.get(interaction.guild.id);

    if (player != null && player != undefined) {
        if (player.voiceChannelId == null
            || player.voiceChannelId == undefined
            || player.voiceChannelId == voiceChannel.id
            || player.audioPlayer == null
            || player.audioPlayer == undefined
            || player.audioPlayer.state.status === AudioPlayerStatus.Idle
            || player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            
            player.active = false;
        } else {
            await interaction.reply({ content: `<@${interaction.user.id}> плеер занят в другом канале`, ephemeral: true, fetchReply: true });
            return;
        }
    } else {
        console.log("created new");
        player = new BotPlayer();
    }

    let row = new MessageActionRow();
    let prevButton = new MessageButton();
    let playButton = new MessageButton();
    let skipButton = new MessageButton();
    let shuffleButton = new MessageButton();
    let repeatQButton = new MessageButton();

    prevButton.setCustomId('prev')
        .setStyle('SECONDARY')
        .setEmoji('⏮️');

    playButton.setCustomId('play')
        .setStyle('SECONDARY')
        .setEmoji('⏯️');

    skipButton.setCustomId('skip')
        .setStyle('SECONDARY')
        .setEmoji('⏭️');

    shuffleButton.setCustomId('shuffle')
        .setStyle('SECONDARY')
        .setEmoji('🔀');

    repeatQButton.setCustomId('repeatQ')
        .setStyle('SECONDARY')
        .setEmoji('🔁');

    row.addComponents(prevButton, playButton, skipButton, shuffleButton, repeatQButton);

    let row2 = new MessageActionRow();
    let plusButton = new MessageButton();
    let minusButton = new MessageButton();
    let closeButton = new MessageButton();
    let repeatButton = new MessageButton();
    let linkButton = new MessageButton();
    let unloadButton = new MessageButton();

    repeatButton.setCustomId('repeat')
        .setStyle('SECONDARY')
        .setEmoji('🔄');

    linkButton.setCustomId('link')
        .setStyle('SECONDARY')
        .setEmoji('↗️');

    plusButton.setCustomId('plus')
        .setStyle('SECONDARY')
        .setEmoji('🔊');

    minusButton.setCustomId('minus')
        .setStyle('SECONDARY')
        .setEmoji('🔉');

    unloadButton.setCustomId('unload')
        .setStyle('SECONDARY')
        .setEmoji('⏏️');

    closeButton.setCustomId('closePlayer')
        .setStyle('DANGER')
        .setEmoji('✖️');

    row2.addComponents(repeatButton, linkButton, unloadButton, minusButton, plusButton);

    await interaction.deferReply();

    let playerEmbed = new MessageEmbed()
        .setColor('#ff0000')
        .setTitle('|\n#>\n|');

    player.embed = playerEmbed;
    players.set(interaction.guild.id, player);

    if (!connect(interaction, voiceChannel)) {
        unlock(interaction);
        return;
    }

    await interaction.editReply({embeds: [playerEmbed], components: [row, row2], ephemeral: false, fetchReply: true })
        .then((message) => {
            player.id = message.id;
            player.message = message;
            player.updatePlayer(player);

            console.log("new player created");

            let link = interaction.options.getString("link");
            if (link != null || link != undefined) {
                onAddTrack(interaction, link, false);
            }
    });
}

// Call to close player
export async function onClose(interaction) {
    let player = players.get(interaction.guild.id);
    if (player != null && player != undefined && player.id == interaction.message.id) {
        player.active = false;
        console.log("player destroyed");
        //STOP MUSIC
    }

    deletePlayer(interaction);
}

// Call to clear queue
export async function onUnload(interaction) {
    if (!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction) || !lock(interaction))
        return;

    let player = players.get(interaction.guild.id);

    await player.queue.unload();
    player.audioPlayer.stop();

    interaction.update({});
    unlock(interaction);
    console.log("unloaded");
}

// Call to set track repeat
export async function onRepeat(interaction) {
    if (!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction) || !lock(interaction))
        return;

    let player = players.get(interaction.guild.id);

    player.queue.repeatTrack = !player.queue.repeatTrack;

    interaction.update({});
    unlock(interaction);
    console.log("repeat toggled");
}

// Call to set queue repeat
export async function onRepeatQ(interaction) {
    if (!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction) || !lock(interaction))
        return;

    let player = players.get(interaction.guild.id);

    player.queue.repeat = !player.queue.repeat;

    interaction.update({});
    unlock(interaction);
    console.log("repeatQ toggled");
}

// Call to rewind or play previous track;
export async function onPrev(interaction) {
    if (!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction) || !lock(interaction))
        return;

    let voiceChannel = interaction.member.voice.channel;
    let player = players.get(interaction.guild.id);

    if (!await connect(interaction, voiceChannel)) {
        unlock(interaction);
        return;
    }

    interaction.deferReply();
    await player.rewind();

    interaction.deleteReply();
    unlock(interaction);
    console.log("rewinded");
}

// Call to toggle play state
export async function onPlay(interaction) {
    if (!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction) || !lock(interaction))
        return;
    
    let player = players.get(interaction.guild.id);
    let voiceChannel = interaction.member.voice.channel;

    if (!await connect(interaction, voiceChannel)) {
        unlock(interaction);
        return;
    }

    if (player.audioPlayer.state.status === AudioPlayerStatus.Idle) {
        player.play();
    } else if (player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
        player.audioPlayer.pause();
    } else if (player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
        player.audioPlayer.unpause();
    }

    interaction.update({});
    unlock(interaction);
    console.log("play toggled");
}

// Call to shuffle
export async function onShuffle(interaction) {
    if (!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction) || !lock(interaction) )
        return;

    let player = players.get(interaction.guild.id);
    let voiceChannel = interaction.member.voice.channel;

    if (!await connect(interaction, voiceChannel)) {
        unlock(interaction);
        return;
    }

    await player.queue.shuffle();
    player.play();

    interaction.update({});
    unlock(interaction);
    console.log("shuffled");
}

// Call to set volume
export async function onVolume(interaction, volumeChange) {
    if (!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction) || !lock(interaction) )
        return;

    let player = players.get(interaction.guild.id);

    player.volume = Math.min(1, Math.max(0, player.volume + volumeChange));
    if (player.res != null && player.res != undefined) {
        player.res.volume.setVolume(player.volume);
    }

    interaction.update({});
    unlock(interaction);
    console.log("volume changed");
}

// Call to skip track
export async function onSkip(interaction) {
    if (!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction) || !lock(interaction))
        return;

    let player = players.get(interaction.guild.id);
    let voiceChannel = interaction.member.voice.channel;

    if (!await connect(interaction, voiceChannel)) {
        unlock(interaction);
        return;
    }
    
    if (player.audioPlayer.state.status === AudioPlayerStatus.Idle) {
        player.play();
    } else if (player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
        player.audioPlayer.stop();
    } else if (player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
        player.audioPlayer.stop();
    }

    interaction.update({});
    unlock(interaction);
    console.log("skiped");
}

// Call to get link
export async function onLink(interaction) {
    if (!roughCheck(interaction) || !lock(interaction))
        return;

    await interaction.deferReply({ephemeral: true});

    let player = players.get(interaction.guild.id);
    let trackLink = await player.queue.getCurrentLink();

    if (trackLink == null || trackLink == undefined) {
        console.log("no link");
        await interaction.editReply({ content: `<@${interaction.user.id}> плеер ещё не запущен!`, ephemeral: true, fetchReply: true });
        unlock(interaction);
        return;
    }

    await interaction.editReply({ content: `<@${interaction.user.id}> ${trackLink}`, ephemeral: true, fetchReply: true });
    unlock(interaction);
    console.log(`requested link ${trackLink}`);
}

export async function getQueue(interaction) {
    let player = players.get(interaction.guild.id);
    if (player != null && player != undefined) {
        return await player.queue.getQueue();
    }

    return null;
}

// Checks is initiator in the same channel with active player
function chceckPerm(interaction) {
    let player = players.get(interaction.guild.id);

    if(interaction.member.voice.channel != player.voiceChannelId
        && (player.audioPlayer != null && player.audioPlayer.state.status === AudioPlayerStatus.Playing)) {
        interaction.reply({ content: `<@${interaction.user.id}> не мешай!`, ephemeral: true, fetchReply: true});
        return false;
    }

    return true;
}

// Checks if player exists
function roughCheck(interaction) {
    let player = players.get(interaction.guild.id);
    if (player == null || player == undefined || player.id != interaction.message.id) {
        console.log("outdated player");
        interaction.message.delete();
        interaction.reply({ content: `<@${interaction.user.id}> удален старый плеер!`, ephemeral: true, fetchReply: true});
        return false;
    }

    return true;
}

// Checks is player exists or can it be attached to interacted message
function attachPlayer(interaction) {
    let player = players.get(interaction.guild.id);
    let queue = new Queue();
    if (player != null) {
        queue = player.queue;
    }

    if (player == null || player == undefined || player.id == null) {
        player = new BotPlayer();
        player.createPlayer();
        let message = interaction.message;
        players.set(interaction.guild.id, player);

        player.queue = queue;
        player.id = message.id;
        player.embed = message.embeds[0];
        player.message = message;
        player.updatePlayer();

        console.log("player attached");
        return true;
    } else if (player.id != interaction.message.id) {
        interaction.message.delete().catch(error => console.log(error)); // TODO: this is async clicking multiple time throws error;
        interaction.reply({ content: `<@${interaction.user.id}> удален старый плеер!`, ephemeral: true, fetchReply: true});
        console.log("outdated player");
        return false;
    }

    return true;
}

// deleteplayer
async function deletePlayer(interaction) {
    try {
        let player = players.get(interaction.guild.id);
        if (player != null && player.id == interaction.message.id) {
            players.delete(interaction.guild.id);
            await player.mutex.runExclusive(async () => {
                console.log("deleted existing");
                player.active = false;
            });
        } else {
            console.log("deleted unexisting");
        }
    } catch (e) {
        console.log(e);
        interaction.channel.send(`${e}`);
    }
}

// checks is user in the voiceChannel
function checkInChannel(interaction) {
    let voiceChannel = interaction.member.voice.channel;

    if (voiceChannel == null || voiceChannel == undefined) {
        console.log("not in channel");
        interaction.reply({ content: `<@${interaction.user.id}> кажется ты не в канале!`, ephemeral: true, fetchReply: true});
        return false;
    }

    return true;
}

// connect wrapper
async function connect(interaction, voiceChannel) {
    let player = players.get(interaction.guild.id);

    let result = await player.connect(voiceChannel);
    if (!result) {
        interaction.reply({ content: `<@${interaction.user.id}> не могу подключиться!`, ephemeral: true, fetchReply: true });
    }

    return result;
}

// addTrack wrapper
export async function onAddTrack(interaction, link, reply = true) {
    let player = players.get(interaction.guild.id);
    if (player == null || player == undefined) {
        player = new BotPlayer();
        players.set(interaction.guild.id, player);
    }

    if (!lock(interaction))
        return;

    if(reply)
        await interaction.deferReply({ ephemeral: true });
    

    if(ytdl.validateURL(link)) {
        console.log("adding link");
        player.addTrack(link);
        if(reply)
            interaction.editReply(`<@${interaction.user.id}> track added`, { ephemeral: true, fetchReply: true });
    } else {
        try {
            console.log("adding playlist");
            let result = await ytpl(link, { limit: 500 });

            result.items.forEach(item => {
                player.addTrack(item.shortUrl);
            });

            if(reply)
                interaction.editReply(`<@${interaction.user.id}> tracks added: ` + result.estimatedItemCount, { ephemeral: true, fetchReply: true });
        } catch (e) {
            console.log(`Bad url: ` + link);
            if(reply)
                interaction.editReply(`<@${interaction.user.id}> Bad url`, { fephemeral: true, fetchReply: true }); 
        }
    }
        
    unlock(interaction);
}

function lock(interaction) {
    let player = players.get(interaction.guild.id);
    if (player != null && player != undefined && !player.lock) {
        console.log("player locked");
        player.lock = true;
        return true;
    } else {
        console.log("locked player does not exist");
    }

    interaction.reply({ content: `<@${interaction.user.id}> подожди секунду!`, ephemeral: true, fetchReply: true}); // "please wait" reply maybe?
    console.log("player already locked");
    return false;
}

function unlock(interaction) {
    let player = players.get(interaction.guild.id);
    if (player != null && player != undefined) {
        if (!player.lock) {
            console.log("there is something wrong I can feel it");
        }
        player.lock = false;
    } else {
        console.log("unlocked player does not exist");
    }
}