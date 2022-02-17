const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

const { BotPlayer } = require('../BotPlayer.js');
const {
    AudioPlayerStatus
} = require('@discordjs/voice');

const updateDelay = 1000;

const spacer = new Array(Math.round(54)).join("-");

const players = new Map();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('player')
		.setDescription('mp3 плеер'),
	async execute(interaction) {
        if (!checkInChannel(interaction)) {
            await interaction.reply({content: 'Зайди в канал!'});
            await sleep(3000);
            await interaction.deleteReply();
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
                || player.audioPlayer.state.status === AudioPlayerStatus.Pause) {
        
                await player.mutex.runExclusive(async () => {
                    player.active = false;
                    await player.message.delete();
                });
            } else {
                await interaction.reply({content: `<@${interaction.user.id}> плеер занят в другом канале`, ephemeral: true, fetchReply: true});
                await sleep(3000);
                await interaction.deleteReply();
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

        let playerEmbed = new MessageEmbed()
	        .setColor('#ff0000')
	        .setTitle(spacer + '\n#>\n' + spacer);

        player.embed = playerEmbed;
        if(!await player.connect(voiceChannel)) {
            await interaction.reply({content: ""});

            //ERROR
        }

		await interaction.reply({embeds: [playerEmbed], components: [row, row2], fetchReply: true})
            .then((message) => {
                player.id = message.id;
                player.message = message;
                player.interaction = interaction;
                player.active = true;
                players.set(interaction.guild.id, player);
                updatePlayer(player);
                
                console.log("attached by command");
            });
	},

    close: function(interaction) {
        let player = players.get(interaction.guild.id);
        if (player != null && player != undefined && player.id == interaction.message.id) {
            player.active = false;
            console.log("player stopped");
            //STOP MUSIC
        }

        deletePlayer(interaction);
    },

    addTrack: async function(interaction, link) {
        let player = players.get(interaction.guild.id);

        await player.mutex.runExclusive(async () => {
            player.addTrack(link);
        });
    },

    onUnload: async function(interaction) {
        if(!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction)) 
            return;

        let player = players.get(interaction.guild.id);
        player.repeat = false;
        player.repeatQ = true;
        player.shuffled = false;

        await player.mutex.runExclusive(async () => {
            player.list = new Array();
            player.queue = new Array();
        });
        
        if (player.audioPlayer.state.status === AudioPlayerStatus.Playing 
            || player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            player.audioPlayer.stop();
        }

        console.log("unloaded");

        interaction.update({});
    },

    onRepeat: async function(interaction) {
        if(!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction)) 
            return;
        
        let player = players.get(interaction.guild.id);
        player.repeat = !player.repeat;

        if (player.repeat) {
            await player.mutex.runExclusive(async () => {
                if (player.audioPlayer.state.status === AudioPlayerStatus.Playing 
                    || player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            
                    if (player.trackLink != null && player.trackLink != undefined) {
                        player.queue.unshift(player.trackLink);
                    }
                }
            });
        }

        interaction.update({});
    },

    onRepeatQ: async function(interaction) {
        if(!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction)) 
            return;
        
        let player = players.get(interaction.guild.id);
        player.repeatQ = !player.repeatQ;

        interaction.update({});
    },

    onPrev: async function(interaction) {
        if(!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction)) 
            return;

        interaction.reply({ content: `<@${interaction.user.id}> when I code it`, ephemeral: true, fetchReply: true});
    },

    onPlay: async function(interaction) {
        if(!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction)) 
            return;
        
        let player = players.get(interaction.guild.id);
        let voiceChannel = interaction.member.voice.channel;

        if(!await player.connect(voiceChannel)) {
            interaction.reply({ content: `<@${interaction.user.id}> не могу подключиться!`, ephemeral: true, fetchReply: true});
            return;
        }

        if(player.audioPlayer.state.status === AudioPlayerStatus.Idle) {
            player.play();
        } else if (player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
            player.audioPlayer.pause();
        } else if (player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            player.audioPlayer.unpause();
        }

        interaction.update({});
    },

    onShuffle: async function(interaction) {
        if(!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction)) 
            return;
        
        let player = players.get(interaction.guild.id);
        let voiceChannel = interaction.member.voice.channel;

        if(!await player.connect(voiceChannel)) {
            interaction.reply({ content: `<@${interaction.user.id}> не могу подключиться!`, ephemeral: true, fetchReply: true});
            return;
        }

        if (player.shuffled) {
            player.shuffled = false;
            interaction.update({});
        } else {
            await interaction.deferReply({ephemeral: true});
            await player.mutex.runExclusive(async () => {
                if (player.audioPlayer.state.status === AudioPlayerStatus.Playing 
                    || player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
                
                    if (player.trackLink != null && player.trackLink != undefined) {
                        player.queue.unshift(player.trackLink);
                    }
                }

                player.shuffle(player.queue);
            });

            player.shuffled = true;
            
            interaction.editReply({ content: `<@${interaction.user.id}> shuffle!`, ephemeral: true, fetchReply: true});

            if (player.audioPlayer.state.status === AudioPlayerStatus.Playing 
                || player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
                player.audioPlayer.stop();
                console.log("restarted after shuffle");
            } else if (player.audioPlayer.state.status === AudioPlayerStatus.Idle) {
                console.log("started after shuffle");
                player.play();
            }
        }
    },

    onVolume: async function(interaction, volumeChange) {
        if(!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction)) 
            return;

        let player = players.get(interaction.guild.id);

        player.volume = Math.min(1, Math.max(0, player.volume + volumeChange));
        if (player.res != null && player.res != undefined) {
            player.res.volume.setVolume(player.volume);
        }

        interaction.update({});
    },

    onSkip: async function(interaction) {
        if(!attachPlayer(interaction) || !checkInChannel(interaction) || !chceckPerm(interaction)) 
            return;

        let player = players.get(interaction.guild.id);
        let voiceChannel = interaction.member.voice.channel;
        
        if(!await player.connect(voiceChannel)) {
            interaction.reply({ content: `<@${interaction.user.id}> не могу подключиться!`, ephemeral: true, fetchReply: true});
            return;
        }

        if(player.audioPlayer.state.status === AudioPlayerStatus.Idle) {
            player.play();
        } else if (player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
            player.audioPlayer.stop();
        } else if (player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            player.audioPlayer.stop();
        }
        
        interaction.update({});
    },

    onLink: async function(interaction) {
        ///donot attach just seek for link if(!attachPlayer(interaction)) 
        if(!roughCheck(interaction))
            return;

        let player = players.get(interaction.guild.id);
        if (player.trackLink == null || player.trackLink == undefined) {
            console.log("no link");
            await interaction.reply({ content: `<@${interaction.user.id}> плеер ещё не запущен!`, ephemeral: true, fetchReply: true});
            return;
        } 

        console.log(`link ${player.trackLink}`);
        await interaction.reply({ content: `<@${interaction.user.id}> ${player.trackLink}`, ephemeral: true, fetchReply: true});
    }
}

function chceckPerm(interaction) {
    let player = players.get(interaction.guild.id);

    if(player.voiceChannelId != null && player.voiceChannelId != interaction.member.voice.channel) {
        interaction.reply({ content: `<@${interaction.user.id}> не мешай!`, ephemeral: true, fetchReply: true});
        return false;
    }

    return true;
}

function roughCheck(interaction) {
    let player = players.get(interaction.guild.id);
    if (player == null || player == undefined || player.id != interaction.message.id) {
        console.log("outdated player");
        interaction.deferUpdate();
        interaction.deleteReply();
        return false;
    }

    return true;
}

function attachPlayer(interaction) {
    let player = players.get(interaction.guild.id);

    if (player == null || player == undefined) {
        console.log("attaching player");

        player = new BotPlayer();
        player.createPlayer();
        let message = interaction.message;
        players.set(interaction.guild.id, player);

        player.id = message.id;
        player.embed = message.embeds[0];
        player.message = message;
        player.interaction = interaction;
        player.active = true;
        updatePlayer(player);

        return true;
    } else if (player.id != interaction.message.id) {
        console.log("outdated player");
        interaction.deferUpdate();
        interaction.deleteReply();
        return false;
    }

    return true;
}

async function updatePlayer(player) {
    console.log("entered update loop: " + player.active);
    while(player.active)
    {
        await sleep(updateDelay);
        await player.mutex.runExclusive(async () => {
            if (!player.active) {
                console.log("exited update loop");
                return;
            }
            
            if(player.audioPlayer.state.status === AudioPlayerStatus.Idle) {
                let str = player.getText() + "\n" + player.getStats();
                player.embed.setTitle(spacer + "\n#>   " + str + "\n");
                player.embed.setColor('#ff0000');
            } else if (player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
                let str = player.getText() + "\n" + player.getStats();
                player.embed.setTitle(spacer + "\n#>   " + str + "\n");
                player.embed.setColor('#00ff00');
            } else if (player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
                player.embed.setTitle(spacer + "\n#>   PAUSED\n" + player.getStats());
                player.embed.setColor('#999900');
            }
        
            await player.message.edit({embeds: [player.embed]});
        });
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

async function deletePlayer(interaction) {
    try {
        let player = players.get(interaction.guild.id);
        if (player != null && player.id == interaction.message.id) {
            players.delete(interaction.guild.id);
            await player.mutex.runExclusive(async () => {
                console.log("deleted existing");
                player.active = false;
                await interaction.deferUpdate();
                await interaction.deleteReply();
            });
        } else {
            console.log("deleted unexisting");
            await interaction.deferUpdate();
            await interaction.deleteReply();
        }
    } catch (e) {
        console.log(e);
        interaction.channel.send(`<@${interaction.user.id}> + ${e}`);
    }
}

function checkInChannel(interaction) {
    voiceChannel = interaction.member.voice.channel;

    if (voiceChannel == null || voiceChannel == undefined) {
        console.log("not in channel");
        
        interaction.reply({ content: `<@${interaction.user.id}> кажется ты не в канале!`, ephemeral: true, fetchReply: true});
        return false;
    }

    return true;
}