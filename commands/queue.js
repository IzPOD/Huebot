import { SlashCommandBuilder } from '@discordjs/builders';
import { onAddTrack, getQueue } from "./player.js";

export const data = new SlashCommandBuilder()
    .setName('q')
    .setDescription('Add track to queue')
    .addStringOption(option => option.setName('link')
        .setDescription('Youtube link')
        .setRequired(false));
export async function execute(interaction) {
    //TODO: CALL PLAYER

    let link = interaction.options.getString("link");
    if (link != null || link != undefined) {
        onAddTrack(interaction, link);
        return;
    } else {
        //await interaction.deferReply();
        let list = await getQueue(interaction);
        let index = 1;
        let str = "";

        if(list != null && list != undefined) {
            list.some((link) => {
                if(str.length < 1000 && index <= 5) {
                    str += `\n${index}: ${link}`;
                    index++;
                    return false;
                } 
                return true;
            });
        }

        if (index >= 5 && list.length > 5) {
            str += `\nAnd ${list.length - index} to go!`
        }
        //show queue;
        await interaction.reply({content: `<@${interaction.user.id}> Queue: ${str}`, ephemeral: true, fetchReply: true });
    }
}