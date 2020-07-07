const Discord = require('discord.js');
const bot = new Discord.Client();
const token = 'NzMwMDE0ODc2OTgyMDUwODc2.XwRVfA.M1_ULpAemPy48Ea25kpUyLanngA';

bot.on('ready', () =>{
	console.log('bot online');
})

bot.login(token);