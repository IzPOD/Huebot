import { SlashCommandBuilder } from '@discordjs/builders';
import { onAddTrack } from "./player.js";


export const data = new SlashCommandBuilder()
    .setName('q')
    .setDescription('Добавить трек')
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
        //show queue;
        interaction.reply(`<@${interaction.user.id}> QUEUE:`, { ephemeral: true, fetchReply: true });
    }
}