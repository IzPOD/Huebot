const { TextChannel, GuildChannel, MessageEmbed } = require("discord.js");
const os = require('os');
var maintenance = false;

module.exports = {
    isMaintenance: function (callbackMsg, args) {
        if (args[0].toLowerCase() == "!maintenance") {
            maintenance = !maintenance;
            
            if (maintenance) {
                callbackMsg.reply("bot is now in maintenance mode").then(callbackMsg.delete());
                return true;
            } else {
                callbackMsg.reply("bot is no longer in maintenance mode").then(callbackMsg.delete());
                return false;
            }
        } else {
            if (maintenance) {
                callbackMsg.reply("maintenance").then(callbackMsg.delete());
                return true;
            } else {
                return false;
            }
        }
    },

    onReady: function (bot, globalChannels) {

        console.log('bot online');
        bot.guilds.cache.forEach(server => {
            server.channels.cache.forEach(channel => {
                if (channel.type == "text" && (channel.name == "музыка" || channel.name == "bot-debug")) {
                    globalChannels.set(server.id, channel);
                }
            });
        });

      globalChannels.forEach(globalChannel => {
          updateStatus(globalChannel);
      });
    },

    connect: function(msg) {
        let channel = msg.guild.member(msg.author).voice.channel;
        if(channel != null) {
            channel.join();
        } else {
            msg.reply("you are not connected to any voice channels").then(sentMessage => sentMessage.delete({timeout: 10000}));
        }
    },

    disconnect: function(msg) {
        let channel = msg.guild.member(msg.author).voice.channel;
        if(channel != null) {
            channel.leave();
        } else {
            msg.reply("you are not connected to any voice channels").then(sentMessage => sentMessage.delete({timeout: 10000}));
        }
    }
  };

let updateTimeout = 1000;
let pinging = true;
async function updateMessage(embedMessage) {
    return new Promise(resolve => {
        setTimeout(async () => {
            let message = "PINGING"
            const embed = embedMessage.embeds[0] 
            embed.setTimestamp(new Date());
            if(pinging == true) {
                embed.setColor(0x990000);
                updateTimeout = 1000;
            } else {
                embed.setColor(0x009900);
                updateTimeout = 10000;
                message = "ONLINE"
            }
            pinging = !pinging;

            embed.setDescription(message);
            await embedMessage.edit(embed).then(updateMessage(embedMessage));
         }, updateTimeout);
      });
}

function updateStatus(channel) {
    let exampleEmbed = new MessageEmbed();

    exampleEmbed.setTitle("СТАТУС БОТА")
    .setColor(0x990000)
    .setTimestamp(new Date());
    exampleEmbed.setDescription("PINGING");
    //exampleEmbed.addField('CPU', getLoad().CPU, true)

    channel.send(exampleEmbed).then(embedMessage => updateMessage(embedMessage));
}

var oldCPUTime = 0
var oldCPUIdle = 0
function getLoad(){
    var cpus = os.cpus()
    var totalTime = -oldCPUTime
    var totalIdle = -oldCPUIdle
    for(var i = 0; i < cpus.length; i++) {
        var cpu = cpus[i]
        for(var type in cpu.times) {
            totalTime += cpu.times[type];
            if(type == "idle"){
                totalIdle += cpu.times[type];
            }
        }
    }

    var CPUload = 100 - Math.round(totalIdle/totalTime*100)
    oldCPUTime = totalTime
    oldCPUIdle = totalIdle

    return {
        CPU:CPUload,
        mem:100 - Math.round(os.freemem()/os.totalmem()*100)
    }       
}

