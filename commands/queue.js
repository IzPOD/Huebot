const { SlashCommandBuilder } = require('@discordjs/builders');
const player = require("./player.js");
const ytpl = require("ytpl");
const ytdl = require("ytdl-core");


module.exports = {
	data: new SlashCommandBuilder()
		.setName('q')
		.setDescription('Добавить трек')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Youtube link')
                .setRequired(false)),
	async execute(interaction) {
        //TODO: CALL PLAYER
        await interaction.deferReply({ephemeral: true});

        let link = interaction.options.getString("link");
        if (link != null || link != undefined) {
            try {
                let result = await ytpl(link, {limit: 500});
                
                console.log(result.estimatedItemCount);

                result.items.forEach(item => {
                    player.addTrack(interaction, item.shortUrl);
                });

                await interaction.editReply(`<@${interaction.user.id}> tracks added: ` + result.estimatedItemCount, {ephemeral: true, fetchReply: true});
                return;
            } catch (e) {
                console.log(e);
                //not ytpl
                if(ytdl.validateURL(link)) {
                    await player.addTrack(interaction, link);
                    interaction.editReply(`<@${interaction.user.id}> track added`, {ephemeral: true, fetchReply: true});
                    return;
                } else {
                    console.log(`<@${interaction.user.id}> Bad url: ` + link);
                    interaction.editReply(`<@${interaction.user.id}> Bad url`, {fephemeral: true, fetchReply: true});
                    return;
                }
            }
        } else {
            //show queue;
            interaction.editReply(`<@${interaction.user.id}> QUEUE:`, {ephemeral: true, fetchReply: true});
        }
	},
};