"use strict"

const ytpl = require('ytpl');
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const bot = new Discord.Client();
bot.setMaxListeners(100);
process.setMaxListeners(100);
const fs = require('fs');
const readline = require('readline');
const dotenv = require('dotenv');
const tools = require('./tools');
const tts = require('./tts');
dotenv.config();

const token = process.env.TOKEN;

const { Client } = require('pg');

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    client.connect();

    var unlocked = false;
    var musicChannels = new Map();
    var chosenChannels = new Map();

    const rl = readline.createInterface({
        input: fs.createReadStream('auf')
    });

    var aufFileLines = new Array();
        rl.on('line', (line) => {
        aufFileLines.push(line);
    });

    rl.on('close', () => {unlocked = true});

    bot.on('ready', () => {
        //loadPlaylistsData();
        tools.onReady(bot, musicChannels);
    });

    bot.on('message', msg => {
        var splitted = msg.content.split(' ');
        switch (splitted[0].toLowerCase()) {
            case '!help':
            case 'help':
                helpMessage(splitted, msg);
                break;
            case '!hello':
            case 'hello':
            case 'хай':
            case 'hi':
                sayHello(splitted, msg);
                break;
            case 'си':
            case 'si':
            case '!strawpoll':
                strawpoll(splitted, msg);
                break;
            case 'сир':
            case 'sir':
            case '!reset':
                resetStrawpoll(splitted, msg);
                break;
            case 'ауф':
            case '!auf':
                auf(splitted, msg);
                break;
            case 'ролл':
            case '!roll':
                roll(splitted, msg);
                break;
            case '!test':
                test(splitted, msg);
                break;
            case 'музло':
            case '!play':
                playSong(splitted, msg);
                break;
            case 'очередь':
            case '!q':
                queueSong(splitted, msg);
                break;
            case 'скип':
            case '!skip':
            case '!next':
                skipSong(splitted, msg);
                break;
            case 'звук':
            case '!volume':
            case '!v':
                setVolume(splitted, msg);
                break;
            case 'стоп':
            case '!stop':
            case '!p':
            case '!pause':
                stopSong(splitted, msg);
                break;
            case '!save':
                save(splitted, msg);
                break;
            case '!playlist':
                playPlaylist(splitted, msg);
                break;
            case '!playlists':
                showPlaylists(splitted, msg);
                break;
            case '!show':
                showPlaylist(splitted, msg);
                break;
            case '!resume':
            case '!r':
                resumeSong(splitted, msg);
                break;
            case '!clear':
                clearQueue(splitted, msg);
                break;
            case "!ytpl":
                queueYtpl(splitted, msg);
                break;
            case "!join":
            case "!j":
                tools.connect(msg);
                break;
            case "!leave":
            case "!l":
                tools.disconnect(msg);
                break;
            case "!say":
            case "!s":
            case "!сей":
                say(splitted, msg);
                break;

        }
    });

    bot.on('userUpdate', (oldUser, newUser) => {
    });

    bot.on("guildMemberAdd", member => {
        //globalChannels.get(msg.guild.id).send('<@' + member.id + '>', exampleEmbed).catch(console.error);
    });

    function helpMessage(splitted, msg) {
        msg.reply("вот список доступных команд, уебан... \n" +
            "хай,   hi,     hello,      !hello   - поприветствовать народ на канале \n" +
            "си,    si,     !strawpoll           - выбрать неудачника в голосовом канале \n" +
            "сир,   sir,    !reset               - перезапустить выбор неудачников в канале \n" +
            "ролл,  !roll                        - ролл от 1 до указанной цифры \n" +
            "ауф,   !auf                         - цитаты великих людей \n" +
            "музло, !play                        - запустить плеер или запустить плеер по YouTube ссылке \n" +
            "стоп,  !stop                        - остановить плеер\n" +
            "!resume                             - продолжить остановленный трек\n" +
            "очередь, !q                         - поставить в очередь по YouTube ссылке\n" +
            "скип,  !skip                        - скипнуть трек\n" +
            "звук,  !volume                      - узнать или установить громкость канала от 0 до 100\n" +
            "!save                               - сохранить очередь как плейлист под указанным именем\n" +
            "!playlist                           - установить в качестве очереди указаный плейлист \n" +
            "!playlists                          - список плейлистов на сервере\n" +
            "!show                               - список треков в указанном плейлисте\n" +
            "!clear                              - очистить очередь\n" +
            "!ytpl                               - загрузить в очередь плейлист с YouTube\n");
        msg.delete();
    }

    function resetStrawpoll(splitted, msg) {
        let guildMember = msg.guild.member(msg.author);
        let channel = guildMember.voice.channel;
        if(channel != null) {
            if(chosenChannels.has(channel.id)) {
                chosenChannels.get(channel.id).clear();
            } else {
                chosenChannels.set(channel.id, new Map());
            };
            msg.channel.send("расчет в канале " + guildMember.voice.channel.name + " обнулен")
                .then(sentMessage => sentMessage.delete({timeout: 10000}))
                .catch(error => {console.error});
        } else {
            msg.reply("you are not connected to any voice channels");
        }
        msg.delete();
    }

    function strawpoll(splitted, msg) {
        let guildMember = msg.guild.member(msg.author);
        let channel = guildMember.voice.channel;
        if(channel != null) {
            let chosenOne;
            if(!chosenChannels.has(channel.id)) {
                chosenChannels.set(channel.id, new Map());
            }
            chosenOne = guildMember.voice.channel.members.filter(gMember => !chosenChannels.get(channel.id).has(gMember.id)).random();
            if ((typeof chosenOne !== 'undefined')) {
                chosenChannels.get(channel.id).set(chosenOne.id, chosenOne);
                msg.channel.send("ha-ha look at this duuuude :point_right: " + chosenOne.displayName + " :point_left:");
            } else {
                msg.channel.send("расчет мудаков в канале \"" + guildMember.voice.channel.name + "\" окончен, используй sir").then(sentMessage => sentMessage.delete({
                    timeout: 10000
                })).catch(error => {
                    console.error;
                });
            }
        } else {
            msg.channel.send("в канал зайди, дебил!");
        }
        msg.delete();
    }

    function sayHello(splitted, msg) {
        if(splitted.length == 1) {
            msg.channel.send('<@' + msg.author.id + '>' + ' иди своей дорогой, сталкер.');
        } else if (splitted[1] == "всем" || splitted[1] == "народ") {
            msg.channel.send('<@' + msg.author.id + '>' + ' тебе здесь не рады...');
        }
    }

    function roll(splitted, msg) {
        if (splitted.length > 0) {
            if (splitted.length > 1) {
                if (splitted[1] < 2 || typeof splitted[1] == 'number') {
                    msg.reply("ты ебобо? цифру нормально укажи и зайди заново!").then(sentMessage => sentMessage.delete({
                            timeout: 30000
                        }))
                        .catch(error => {
                            console.error
                        });
                } else {
                    var number = Math.floor(Math.random() * splitted[1] + 1);
                    var response = '' + number;
                    if (number == 1) {
                        response += ' (критическая неудача)';
                    } else if (number == splitted[1]) {
                        response += ' (Critical damage)';
                    }
                    msg.reply(response + "    (roll 1-" + splitted[1] + ")").then(sentMessage => sentMessage.delete({
                            timeout: 60000
                        }))
                        .catch(error => {
                            console.error
                        });
                }
            } else {
                msg.reply("ты ебобо? цифру укажи!").then(sentMessage => sentMessage.delete({
                        timeout: 30000
                    }))
                    .catch(error => {
                        console.error
                    });
            }
            msg.delete({timeout: '0'});
        }
    }

    function lock(guildId) {
        if(!guildsLocks.get(guildId)) {
            guildsLocks.set(guildId, true);
            return true;
        } else {
            return false;
        }
    }

    function unlock(guildId) {
        guildsLocks.set(guildId, false);
    }

    function say(splitted, msg) {
        let voiceChannel = msg.guild.member(msg.author).voice.channel;
        if(lock(msg.guild.id)) {
            if(splitted.length > 1 && voiceChannel != null && construct(msg)) {
                pause(msg.guild.id);
                let oldChannel = guildsVoiceChannels.get(msg.guild.id);
                let voiceChannel = msg.guild.member(msg.author).voice.channel;
                let currentConnection;
                    
                voiceChannel.join().then(connection => {
                    
                    let broadcast = bot.voice.createBroadcast();
                    let volume = channelsVolumes.get(voiceChannel.id) + 0.5;
                    let stream = tts.say(splitted.slice(1, splitted.length).join(' '));
                    let dispatcher = broadcast.play(stream);
                    dispatcher.setVolume(volume);

                    currentConnection = connection;
                    currentConnection.play(broadcast);
                    
                    dispatcher.on('finish', () => {
                        console.log('phrase finish');
                        dispatcher.end();

                        if(guildsBroadcasts.get(msg.guild.id) != undefined && oldChannel != undefined) {
                            if(voiceChannel != oldChannel) {
                                console.log("trying to resume song on diffirent channel");
                                oldChannel.join().then(connection => {
                                    console.log("connected to the old channel");
                                    connection.play(guildsBroadcasts.get(msg.guild.id));
                                    resume(msg.guild.id);
                                });
                                
                            } else {
                                console.log("trying to resume song on same channel");
                                currentConnection.play(guildsBroadcasts.get(msg.guild.id));
                                resume(msg.guild.id);
                            }
                            
                        }

                        broadcast.end();
                        
                        unlock(msg.guild.id);    
                    });
                    
                }).catch(error => {
                    console.log(error);
                    unlock(msg.guild.id);
                });;
            
            } else {
                unlock(msg.guild.id);
                msg.channel.send("в канал зайди, дебил!");
            }
        } else {
            msg.channel.send("отдохни я болтаю");
        }

        msg.delete();
    }

    let guildsLocks = new Map();

    function auf(splitted, msg) {
        if(lock(msg.guild.id)) {
            if(msg.guild.member(msg.author).voice.channel != null && construct(msg)) {
                if(unlocked) {
                    pause(msg.guild.id);

                    let oldChannel = guildsVoiceChannels.get(msg.guild.id);

                    
                    let voiceChannel = msg.guild.member(msg.author).voice.channel;
                    let currentConnection;
                    voiceChannel.join().then(connection => {
                        let broadcast = bot.voice.createBroadcast();
                        let text = aufFileLines[Math.floor(Math.random() * aufFileLines.length)];
                        let volume = channelsVolumes.get(msg.guild.member(msg.author).voice.channel.id) + 0.5;
                        let dispatcher = tts.tts(broadcast, text + " АУФ");

                        dispatcher.setVolume(volume);
                        msg.channel.send('<@' + msg.author.id + '> ' + text + " АУФ :point_up:")
                            .then(sentMessage => sentMessage.delete({timeout: 30000})).catch(console.error);
                            
                        currentConnection = connection;
                        currentConnection.play(broadcast);
                
                        dispatcher.on('finish', () => {
                            dispatcher.end();
                            dispatcher = broadcast.play('auf.mp3');

                            let volume = channelsVolumes.get(msg.guild.member(msg.author).voice.channel.id);
                            dispatcher.setVolume(volume);

                            dispatcher.on('finish', () => {
                                if(guildsBroadcasts.get(msg.guild.id) != undefined && oldChannel != undefined) {
                                    if(voiceChannel != oldChannel) {
                                        oldChannel.join().then(connection => {
                                            connection.play(guildsBroadcasts.get(msg.guild.id));
                                            resume(msg.guild.id);
                                        });
                                        
                                    } else {
                                        currentConnection.play(guildsBroadcasts.get(msg.guild.id));
                                        resume(msg.guild.id);
                                    }
                                    
                                } 
                                dispatcher.end();
                                broadcast.end();
                                unlock(msg.guild.id);
                            });
                        });
                    }).catch(error => {
                        console.log(error);
                        unlock(msg.guild.id);
                    });
                }
            } else {
                unlock(msg.guild.id);
                msg.channel.send("в канал зайди, дебил!");
            }
        } else {
            msg.channel.send("отдохни я болтаю");
        }
        msg.delete();
        
    };

    var guildsBroadcasts = new Map();
    var guildsVoiceChannels = new Map();
    var channelsQueues = new Map();
    var channelsVolumes = new Map();

    function playSong(splitted, msg) {
        if(construct(msg)) {
            let channel = msg.guild.member(msg.author).voice.channel;
            if(splitted.length > 1) {
                
                channelsQueues.get(channel.id).unshift(splitted[1]);
                console.log("song acquired");
                
                let currentBroadCast = guildsBroadcasts.get(msg.guild.id);
                if(currentBroadCast != undefined) {
                    msg.channel.send("трек добавлен первым в очередь...");
                } else {
                    nextSong(msg, channel);
                }
            } else {
                console.log("no song, restarting player...");

                let currentBroadCast = guildsBroadcasts.get(msg.guild.id);
                if(currentBroadCast == undefined) {
                    nextSong(msg, channel);
                } else {
                    console.log("queue is clear");
                }
            }
         } else {
             msg.channel.send("в канал зайди, дебил!");
         }
         msg.delete();
    };

    function nextSong(msg, channel) {
        console.log("trying to play next song");
        let queue = channelsQueues.get(channel.id);
        if(queue.length > 0) {
            let url = queue.shift();
            if(!ytdl.validateURL(url)) {
                msg.reply("bad URL").then(sentMessage => sentMessage.delete({timeout: 10000}));
                nextSong(msg, channel);
                return;
            }
            console.log("playing next song: joining");
            channel.join().then(connection => {
                guildsVoiceChannels.set(msg.guild.id, channel);

                let broadcast;

                if (!guildsBroadcasts.has(msg.guild.id)) {
                    broadcast = bot.voice.createBroadcast();
                    guildsBroadcasts.set(msg.guild.id, broadcast);
                } else {
                    broadcast = guildsBroadcasts.get(msg.guild.id);
                }

                if(broadcast != undefined)
                    broadcast.end();

                let stream = ytdl(url, {filter: 'audio'});

                console.log("playing next song: fetching info");
                stream.on('error', (error) => {
                    console.log(error);
                    msg.reply("sorry, but the video is unavailable").then(sentMessage => sentMessage.delete({timeout: 10000}));
                    nextSong(msg, channel);
                });

                stream.on('info', (info) => {
                    let dispatcher = broadcast.play(stream);
                    dispatcher.setVolume(channelsVolumes.get(channel.id));
                    console.log("playing next song: broadcasting");
                    let streamDispatcher = connection.play(broadcast);

                    let temp = function () {
                        console.log(info.videoDetails.title + " has ended");
                        streamDispatcher.destroy();
                        dispatcher.end();
                        nextSong(msg, channel);

                    };
                    dispatcher.on('finish', temp);
                    dispatcher.on('end', reason => {
                        console.log("ended: " + reason);
                        streamDispatcher.destroy();
                        dispatcher.end();
                        nextSong(msg, channel);
                    });

                    msg.reply("now playing: " + info.videoDetails.title);
                    console.log("playing song: " + info.videoDetails.title);
                });

                console.log("playing next song: queuing");
                if(queue.length > 0) {
                    let nextStream = ytdl(queue[0]);
                    nextStream.on('info', (info) => {
                        msg.reply("next: " + info.videoDetails.title).then(sentMessage => sentMessage.delete({timeout: 10000}));
                        if(queue.length > 1) {
                            msg.reply("and " + (queue.length - 1) + " to go!").then(sentMessage => sentMessage.delete({timeout: 10000}));
                        }
                        console.log("next should be: " + info.videoDetails.title);
                    });
                    nextStream.on('error', (error) => {
                        console.log(error);
                    });
                }
            }).catch(error => msg.reply("не найдено: " + error).then(sentMessage => sentMessage.delete({timeout: 10000})));
        } else {
            msg.channel.send("конец очереди").then(sentMessage => sentMessage.delete({timeout: 10000}));
            guildsVoiceChannels.delete(msg.guild.id);
            
            let endedBroadcast = guildsBroadcasts.get(msg.guild.id);
            if(endedBroadcast != undefined) {
                endedBroadcast.end();
                guildsBroadcasts.delete(msg.guild.id);
            }
            console.log("playing next song: no songs");
        }
        console.log("playing next song: procedure ended");
    }

    function queueSong(splitted, msg) {
        if(construct(msg)) {
            let channel = msg.guild.member(msg.author).voice.channel;
            let queue = channelsQueues.get(channel.id);
            if(splitted.length > 1) {
                queue.push(splitted[1]);
                msg.reply("queued song for " + channel.name + ". queue size: " + queue.length).then(sentMessage => sentMessage.delete({timeout: 10000}));
            } else {
                let reply = "playlist for " + channel.name + " is: \n"
                queue.forEach(function(item, i, arr) {
                    reply += "" + i + ". " + item + " \n";
                });
                msg.reply(reply).then(sentMessage => sentMessage.delete({timeout: 10000}));
            }
        } else {
            msg.reply("you are not connected to any voice channels").then(sentMessage => sentMessage.delete({timeout: 10000}));
        }
        msg.delete();
    }

    function skipSong(splitted, msg) {
        if(construct(msg)) {
            let channel = msg.guild.member(msg.author).voice.channel;
            let broadcast = guildsBroadcasts.get(msg.guild.id);
            if(broadcast != undefined) {
                if(channelsQueues.get(channel.id).length > 0) {
                    nextSong(msg, channel);
                    console.log("skipped to the next");
                } else {
                    broadcast.end();
                    guildsBroadcasts.delete(msg.guild.id);
                    console.log("skipped to the end");
                }
                msg.reply("song skipped").then(sentMessage => sentMessage.delete({timeout: 10000}));
                console.log("skip ended")
            }
        } else {
            msg.reply("you are not connected to any voice channels").then(sentMessage => sentMessage.delete({timeout: 10000}));
        }
        msg.delete();
    }

    async function queueYtpl(splitted, msg) {
        if(construct(msg)) {
            let channel = msg.guild.member(msg.author).voice.channel;
            let queue = channelsQueues.get(channel.id);
            if(splitted.length > 1) {
                const ytplID = await ytpl.getPlaylistID(splitted[1]);
                const ytplaylist = await ytpl(ytplID, {pages: Infinity });
                ytplaylist.items.forEach(function(item, i, arr) {
                    queue.push(item.shortUrl);
                })
                queue.push(splitted[1]);
                msg.reply("queued song for " + channel.name + ". queue size: " + queue.length).then(sentMessage => sentMessage.delete({timeout: 10000}));
            } else {
                let reply = "please specify ytpl link";
                msg.reply(reply).then(sentMessage => sentMessage.delete({timeout: 10000}));
            }
        } else {
            msg.reply("you are not connected to any voice channels").then(sentMessage => sentMessage.delete({timeout: 10000}));
        }
        msg.delete();
    }

    function construct(msg) {

        

        if (!guildsLocks.has(msg.guild.id)) {
            guildsLocks.set(msg.guild.id, false);
        }

        let channel = msg.guild.member(msg.author).voice.channel;
        if (channel != null) {
            if (!channelsQueues.has(channel.id)) {
                channelsQueues.set(channel.id, new Array());
            }
            if(!channelsVolumes.has(channel.id)) {
                channelsVolumes.set(channel.id, 0.15);
            }
        } else {
            return false;
        }

        return true;
    }

    function setVolume(splitted, msg) {
        if(construct(msg)) {
            let channel = msg.guild.member(msg.author).voice.channel;
            if(splitted.length > 1) {
                channelsVolumes.set(channel.id, splitted[1] / 100);
                let dispatcher = guildsBroadcasts.get(msg.guild.id).dispatcher;
                if(dispatcher != null) {
                    guildsBroadcasts.get(msg.guild.id).dispatcher.setVolume(channelsVolumes.get(channel.id));
                }
                msg.reply("volume for channel " + channel.name + " set to " + splitted[1])
                    .then(sentMessage => sentMessage.delete({timeout: 10000}));
            } else {
                 msg.reply("volume for this channel is: " + channelsVolumes.get(channel.id) + " specify value to set!")
                    .then(sentMessage => sentMessage.delete({timeout: 10000}));
            }
        } else {
            msg.reply("you are not connected to any voice channels").then(sentMessage => sentMessage.delete({timeout: 10000}));
        }
        msg.delete();
    }

    function stopSong(splitted, msg) {
        construct(msg);
        pause(msg.guild.id);
        msg.delete();
    }

    function pause(guildId) {
        let broadcast = guildsBroadcasts.get(guildId);
        if(broadcast != undefined) {
            let dispatcher = broadcast.dispatcher;
            if(dispatcher != null) {
                dispatcher.pause();
            }
        }
    }

    function resume(guildId) {
        let broadcast = guildsBroadcasts.get(guildId);
        if(broadcast != undefined) {
            let dispatcher = guildsBroadcasts.get(guildId).dispatcher;
            console.log("trying to resume dispatcher");
            if(dispatcher != null) {
                dispatcher.resume();
                console.log("resumed");
            }
        } else {
            console.log("nothing to resume");
        }
    }

    function clearQueue(splitted, msg) {
         construct(msg);
         let channel = msg.guild.member(msg.author).voice.channel;
         if(channel != null) {
             channelsQueues.set(channel.id, new Array());
             msg.reply("queue cleared").then(sentMessage => sentMessage.delete({timeout: 10000}));
         } else {
             msg.reply("you are not connected to any voice channels").then(sentMessage => sentMessage.delete({timeout: 10000}));
         }
         msg.delete();
     }

    function resumeSong(splitted, msg) {
        construct(msg);
        resume(msg.guild.id);
        msg.delete();
    }

    function save(splitted, msg) {
        if(splitted.length > 1 && splitted[1].length > 0) {
            if(construct(msg)) {
                let channel = msg.guild.member(msg.author).voice.channel;
                let queue = channelsQueues.get(channel.id);
                if(queue.length > 0) {
                    savePlaylistDataToDB(msg.guild.id, splitted[1], queue);
                    msg.reply("playlist " + splitted[1] + " has been saved!").then(sentMessage => sentMessage.delete({timeout: 10000}));
                } else {
                    msg.reply("queue for that channel is empty! use !q to add tracks").then(sentMessage => sentMessage.delete({timeout: 10000}));
                }
            } else {
                msg.reply("you are not connected to any voice channels").then(sentMessage => sentMessage.delete({timeout: 10000}));
            }
        } else {
            msg.reply("specify playlist NAME").then(sentMessage => sentMessage.delete({timeout: 10000}));
        }
        msg.delete();
    }

    function playPlaylist(splitted, msg) {
        if(splitted.length > 1 && splitted[1].length > 0) {
            let guildId = msg.guild.id;
            let playlistName = splitted[1];
            let channel = msg.guild.member(msg.author).voice.channel;
            if(construct(msg)) {
                getPlaylistByName(guildId, playlistName).then(playlistId => {
                    if(playlistId != undefined) {
                        loadSongs(playlistId).then(songs => {
                            channelsQueues.set(channel.id, songs);
                            msg.reply("playlist " + splitted[1] + " set as queue! use !play to start").then(sentMessage => sentMessage.delete({timeout: 10000}));
                        });
                    } else {
                        msg.reply("no playlist with such name").then(sentMessage => sentMessage.delete({timeout: 10000}));
                    }
                });
            } else {
                msg.reply("you are not connected to any voice channels").then(sentMessage => sentMessage.delete({timeout: 10000}));
            }
        } else {
            msg.reply("specify playlist NAME").then(sentMessage => sentMessage.delete({timeout: 10000}));
        }
        msg.delete();
    }

    function showPlaylist(splitted, msg) {
        construct(msg);
        let guildId = msg.guild.id;
        if(splitted.length > 1 && splitted[1].length > 0) {
            getPlaylistByName(guildId, splitted[1]).then(res => {
                if(res != undefined) {
                    loadSongs(res).then(songs => {
                        let reply = "tracks for playlist " + splitted[1] + " are: \n";
                        for(let i =0; i < songs.length; i++) {
                            reply += "" + i + ". " + songs[i] + " \n";
                        }
                        msg.reply(reply).then(sentMessage => sentMessage.delete({timeout: 10000}));
                    });
                } else {
                    msg.reply("no playlist with such name").then(sentMessage => sentMessage.delete({timeout: 10000}));
                }
            });
        } else {
            msg.reply("specify playlist NAME").then(sentMessage => sentMessage.delete({timeout: 10000}));
        }
        msg.delete();
    }

    function showPlaylists(splitted, msg) {
        construct(msg);
        let reply = "playlists for this guild are: \n";

        loadPlaylistsData(msg.guild.id).then(playlists => {
            for(let i = 0; i < playlists.length; i++) {
                reply += "" + i + ".\t" + playlists[i] + " \n";
            }
            msg.reply(reply + "use !show <name> to see tracks").then(sentMessage => sentMessage.delete({timeout: 10000}));

            msg.delete();
        });
    }

    bot.login(token);

//    client.connect();
//    client.query('drop table s, ps, gp');
//    client.query('create table GP (Guild VARCHAR(255) PRIMARY KEY)');
//    client.query('CREATE TABLE PS (PlayListID SERIAL PRIMARY KEY, playlistName VARCHAR(255), Guild VARCHAR(255) REFERENCES gp (guild), CONSTRAINT C_playlist UNIQUE  (playlistName, guild))');
//    client.query('CREATE TABLE S (SongID SERIAL, URL VARCHAR(255), PlayListID INTEGER REFERENCES ps (playlistid), PRIMARY KEY (songid, playlistid))', (err, res) => {
//        if(err) {
//            console.log(err);
//        }
//    });

    function savePlaylistDataToDB(guild, name, playlist) {
        let values = [guild];
        client.query('insert into gp (guild) values ($1) ON CONFLICT (guild) DO NOTHING', values, (err, res) => {
            if (err) {
                console.log(err);
                return;
            }
            insertPlaylist(guild, name, playlist);

        });
    }

    function insertPlaylist(guild, name, playlist) {
        let values = [name, guild];
        client.query('SELECT * FROM ps where guild = $2 and playlistname = $1 FETCH FIRST ROW ONLY;', values, (err, res) => {
            if(err) {
                console.log(err);
                return;
            }

            if(res.rowCount > 0) {
                let fetchedPlaylistId = res.rows[0].playlistid;
                let delValues = [fetchedPlaylistId];
                client.query('DELETE FROM s WHERE playlistid = $1', delValues, (err, res) => {
                    if(err) {
                        console.log(err);
                        return;
                    }

                    insertSongs(fetchedPlaylistId, playlist);
                });
            } else {
                client.query('INSERT INTO ps (playlistname, guild) values ($1, $2) ON CONFLICT (playlistname, guild) DO NOTHING;', values, (err, res) => {
                    if(err) {
                        console.log(err);
                        return;
                    }
                    insertPlaylist(guild, name, playlist);
                });
            }
        });
    }

    async function insertSongs(fetchedPlaylistId, playlist) {

        playlist.forEach(function(item, i, arr) {
            let values = [item, fetchedPlaylistId];
            client.query('insert into s (URL, playlistid) VALUES ($1, $2);', values, (err, res) => {
                if(err) {
                    console.log(err);
                }

            });
        });
    }

    async function loadPlaylistsData(guildid) {
        let values = [guildid];
        let playlists = new Array();
        try {
            let res = await client.query('select * from ps where guild = $1', values);
            for (let row of res.rows) {
                playlists.push(row.playlistname);
                //loadSongs(row);
            }
        } catch (err) {
            console.log(err);
        }
        return playlists;
    }

    async function getPlaylistByName(guildid, playlistname) {
        let values = [guildid, playlistname];
        try {
            let res = await client.query('select playlistid from ps where guild = $1 and playlistname = $2', values);
            if(res.rowCount == 1) {
                return res.rows[0].playlistid;
            }
        } catch (err) {
            console.log(err);
        }
    }

    async function loadSongs(playlistid) {
        let values = [playlistid]
        try {
            let res = await client.query('SELECT URL FROM s WHERE playlistid = $1', values);
            let playlist = [];
            for (let row of res.rows) {
                playlist.push(row.url);
            }
            return playlist;
        } catch (err) {
            console.log(err);
        }
    }


