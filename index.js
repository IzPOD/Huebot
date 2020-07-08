const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const readline = require('readline');
const dotenv = require('dotenv');
dotenv.config();
const token = process.env.TOKEN;
const exampleEmbed = new Discord.MessageEmbed().setImage('https://unvegetariano.com/images/sad-cat-png-3.png');

    var unlocked = false;
    var logChannels = new Map();
    var globalChannels = new Map();
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
        console.log('bot online');
        bot.guilds.cache.forEach(server => {
            server.channels.cache.forEach(channel => {
                if (channel.name == "музыка") {
                    channel.send('онлайн').then(sentMessage => sentMessage.delete({
                            timeout: 2000
                        }))
                        .catch(error => {
                            // handle error
                        });
                     logChannels.set(server.id, channel);
                }
                if (channel.name == "основной-чат") {
                    globalChannels.set(server.id, channel);
                }
            });
        });
    });

    bot.on('message', msg => {
        var splitted = msg.content.toLowerCase().split(' ');
        switch (splitted[0]) {
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
        }


    });

    bot.on('userUpdate', (oldUser, newUser) => {
    });

    bot.on("guildMemberAdd", member => {
        globalChannels.get(msg.guild.id).send('<@' + member.id + '>', exampleEmbed).catch(console.error);
    });

    function helpMessage(splitted, msg) {
        msg.reply("вот список доступных команд, уебан... \n" +
            "хай,   hi,     hello,      !hello   - поприветствовать народ на канале \n" +
            "си,    si,     !strawpoll           - выбрать неудачника в голосовом канале \n" +
            "сир,   sir,    !reset               - перезапустить выбор неудачников в канале \n" +
            "ролл,  !roll                        - ролл от 1 до указанной цифры \n" +
            "ауф,   !auf                         - цитаты великих людей \n");
    }

    function resetStrawpoll(splitted, msg) {
        let guildMember = msg.guild.member(msg.author);
        let channel = guildMember.voice.channel;
        if(chosenChannels.has(channel.id)) {
            chosenChannels.get(channel.id).clear();
        } else {
            chosenChannels.set(channel.id, new Map());
        };
        msg.channel.send("расчет в канале " + guildMember.voice.channel.name + " обнулен").then(sentMessage => sentMessage.delete({timeout: 10000}))
           .catch(error => {console.error});
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

    function auf(splitted, msg) {
        if(msg.guild.member(msg.author).voice.channel != null) {
            if(unlocked) {
                let broadcast = bot.voice.createBroadcast();
                let dispatcher = broadcast.play('auf.mp3');
                dispatcher.setVolume(0.01);
                msg.channel.send('<@' + msg.author.id + '> ' + aufFileLines[Math.floor(Math.random() * aufFileLines.length)] + " АУФ :point_up:")
                    .then(sentMessage => sentMessage.delete({timeout: 30000})).catch(console.error);
                let voiceChannel = msg.guild.member(msg.author).voice.channel;
                voiceChannel.join().then(connection => connection.play(broadcast))

                dispatcher.on('finish', () => {
                    console.log("left channel");
                    voiceChannel.leave();
                });
            }
        } else {
            msg.channel.send("в канал зайди, дебил!");
        }
        msg.delete();
    };

    function test(splitted, msg) {
        logChannels.get(msg.guild.id).send('<@' + msg.author.id + '>', exampleEmbed).catch(console.error);
    };

    bot.login(token);