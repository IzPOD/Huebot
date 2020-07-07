const Discord = require('discord.js');
const bot = new Discord.Client();

const dotenv = require('dotenv');
dotenv.config();
const token = process.env.TOKEN;

const exampleEmbed = new Discord.MessageEmbed().setImage('https://unvegetariano.com/images/sad-cat-png-3.png');
var logChannel;
var globalChannel;
var chosen = new Map();

bot.on('ready', () => {
	console.log('bot online');
	bot.guilds.cache.forEach(server => {
		server.channels.cache.forEach(channel => {
			if(channel.name == "музыка") {
				channel.send('онлайн');
				logChannel = channel;
			}
			if(channel.name == "основной-чат") {
            	globalChannel = channel;
            }

			//channel.send('� �����');
		});
	});
});

bot.on('message', msg => {
    if(msg.content == "си" || msg.content == "si") {
        let guildMember = msg.guild.member(msg.author);
        let chosenOne;
        //if((typeof chosen == 'undefined') || (chosen.array().length == 0)) {
        //    chosenOne = guildMember.voice.channel.members.random();
        //    //guildMember.voice.channel.members.clone().clear().set(guildMember.id, chosenOne);
        //    chosen.set(guildMember.id, chosenOne);
        //} else {
        chosenOne = guildMember.voice.channel.members.filter(gMember => !chosen.has(gMember.id)).random();
        if((typeof chosenOne !== 'undefined')) {
            chosen.set(chosenOne.id, chosenOne);
            //const emoji = msg.guild.emojis.cache.get("id");
            logChannel.send("ha-ha look at this duuuude :point_right: " + chosenOne.displayName + " :point_left:");
        } else {
            logChannel.send("расчет мудаков в канале \""+ guildMember.voice.channel.name + "\" окончен, используй sir");
        }
        //}


    } else if (msg.content == "сир" || msg.content == "sir") {
        chosen.clear();

        logChannel.send("расчет обнулен");
    }
});

bot.on('userUpdate', (oldUser, newUser) => {
	logChannel.send(newUser);
});

bot.on('message', msg=>{
	if(msg.content == "HELLO") {
		msg.reply('suck some dick');
	}
});

bot.on('message', msg=>{
	if(msg.content == "Хай" || msg.content == "хай") {
        msg.channel.send(msg.author.username + ' на хуй свой начихай');
	}
});

bot.on("guildMemberAdd", member => {
    globalChannel.send('<@' + member.id + '>', exampleEmbed, 'where is image?').catch(console.error);
});

bot.on('message', msg=>{
	if(msg.content == "embed") {
	    logChannel.send('<@' + msg.author.id + '>', exampleEmbed).catch(console.error);
        ///logChannel.send(exampleEmbed);
	}
});



bot.on ('message', msg=>{
	if(msg.content == "онлайн" && msg.author.bot == true) {
    msg.delete({timeout: 2000});
	}
})

bot.on('message', msg=> {
    var splitted = msg.content.split(' ');
    if(splitted.length > 0) {
        if((splitted[0] == ("roll")) || (splitted[0] == ("ролл"))) {
            if(splitted.length > 1) {
                if(splitted[1] < 2 || typeof splitted[1] == 'number') {
                    msg.reply("ты ебобо? цифру нормально укажи и зайди заново!");
                } else {
                    var number = Math.floor(Math.random() * splitted[1] + 1);
                    var response = '' + number;
                    if(number == 1) {
                        response += ' (критическая неудача)';
                    } else if (number == splitted[1]) {
                        response += ' (Critical damage)';
                    }
                    msg.reply(response);
                }
            } else {
                msg.reply("ты ебобо? цифру укажи!");
            }
            msg.delete({timeout: '0'});
        }
    }
});

bot.login(token);