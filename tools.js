const { TextChannel, GuildChannel, MessageEmbed } = require("discord.js");

module.exports = {
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
    bar: function () {
      
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

    channel.send(exampleEmbed).then(embedMessage => updateMessage(embedMessage));
}


