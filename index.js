const Discord = require('discord.js');
const bot = new Discord.Client();
//const token = process.env.TOKEN;
token = "NzMwMDE0ODc2OTgyMDUwODc2.XwSP5w.kWLXOt2la8CSQb4B5DErg_BcBNI";

const exampleEmbed = new Discord.MessageEmbed().setImage('https://unvegetariano.com/images/sad-cat-png-3.png');
var logChannel;

bot.on('ready', () => {
	console.log('bot online');
	bot.guilds.cache.forEach(server => {
		server.channels.cache.forEach(channel => {
			if(channel.name == "музыка") {
				channel.send('онлайн');
				logChannel = channel;
			}
			//channel.send('� �����');
		});
	});
	
	
});

bot.on('userUpdate', (oldUser, newUser) => {
	logChannel.send(newUser);
});

bot.on('message', msg=>{
	if(msg.content == "HELLO"){
		msg.reply('suck some dick,  ' + msg.author.username);
	}
});

bot.on('message', msg=>{
	if(msg.content == "Хай" || msg.content == "хай"){
    msg.channel.send(msg.author.username + ' на хуй свой начихай');
	}
});

// bot.on("guildMemberAdd", member => {
//     member.send(exampleEmbed)
//         .catch(console.error);
// });

bot.on('message', msg=>{
	if(msg.content == "embed" ) {
    msg.channel.send(exampleEmbed);
	}
});



bot.on ('message', msg=>{
	if(msg.content == "онлайн" && msg.author.bot == true) {
    msg.delete({timeout: 2000});
	}
})

bot.on('message', msg=> {
  var splitted = msg.content.split(' ');
  if(splitted.length > 1) {
    if((splitted[0] == ("roll")) || (splitted[0] == ("ролл"))) {
      var number = Math.floor(Math.random() * splitted[1] + 1);
      var response = '' + number;
      if(number == 1) {
        response += ' (критическая неудача)';
      } else if (number == splitted[1]) {
        response += ' (Critical damage)';
      }
       msg.reply(response);
    }
  }
});

bot.login(token);