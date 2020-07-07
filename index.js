const Discord = require('discord.js');
const bot = new Discord.Client();
const token = process.env.TOKEN;


bot.on('ready', () =>{
	console.log('bot online');
})

bot.on('message', msg=>{
	if(msg.content == "HELLO"){
		msg.reply('SOSI HUI DIMA');
	}
})

bot.login(token);