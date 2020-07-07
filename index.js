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
			if (channel.name == "музыка") {
				channel.send('онлайн').then(sentMessage => sentMessage.delete({
						timeout: 2000
					}))
					.catch(error => {
						// handle error
					});
				logChannel = channel;
			}
			if (channel.name == "основной-чат") {
				globalChannel = channel;
			}
		});
	});
});

bot.on('message', msg => {
	switch (msg.content) {
		case 'hello':
			msg.reply('suck some dick');
			break;
		case 'embed':
			logChannel.send('<@' + msg.author.id + '>', exampleEmbed).catch(console.error);
			break;
		case 'Хай':
		case 'хай':
			msg.channel.send(msg.author.username + ' на хуй свой начихай');
			break;
		case 'си':
		case 'si':
			{
				let guildMember = msg.guild.member(msg.author);
				let chosenOne;
				chosenOne = guildMember.voice.channel.members.filter(gMember => !chosen.has(gMember.id)).random();
				if ((typeof chosenOne !== 'undefined')) {
					chosen.set(chosenOne.id, chosenOne);
					msg.channel.send("ha-ha look at this duuuude :point_right: " + chosenOne.displayName + " :point_left:");
				} else {
					msg.channel.send("расчет мудаков в канале \"" + guildMember.voice.channel.name + "\" окончен, используй sir").then(sentMessage => sentMessage.delete({
						timeout: 10000
					})).catch(error => {
						// handle error
					});
				}
				msg.delete();
			}
			break;
		case 'сир':
		case 'sir':
			{
				chosen.clear();
				msg.channel.send("расчет обнулен").then(sentMessage => sentMessage.delete({
					timeout: 10000
				}))
				.catch(error => {
					// handle error
				});
				msg.delete();
			}
			break;
	}
});

bot.on('message', msg => {
	var splitted = msg.content.split(' ');
	switch (splitted[0]) {
		case 'roll':
		case 'ролл':
			{
				if (splitted.length > 0) {
					if (splitted.length > 1) {
						if (splitted[1] < 2 || typeof splitted[1] == 'number') {
							msg.reply("ты ебобо? цифру нормально укажи и зайди заново!").then(sentMessage => sentMessage.delete({
									timeout: 30000
								}))
								.catch(error => {
									// handle error
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
									timeout: 30000
								}))
								.catch(error => {
									// handle error
								});
						}
					} else {
						msg.reply("ты ебобо? цифру укажи!").then(sentMessage => sentMessage.delete({
								timeout: 30000
							}))
							.catch(error => {
								// handle error
							});
					}
					msg.delete({
						timeout: '0'
					});
				}
			}
			break;
	}
})

bot.on('userUpdate', (oldUser, newUser) => {
	logChannel.send(newUser);
});

bot.on("guildMemberAdd", member => {
	globalChannel.send('<@' + member.id + '>', exampleEmbed, 'where is image?').catch(console.error);
});

bot.login(token);