import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageButton } from 'discord.js';
import { Poll } from '../Poll.js';

var activePolls = new Map();

export const data = new SlashCommandBuilder()
    .setName('poll')
    .setDescription('voice-channel strawpoll')
    .addStringOption(option => option.setName('subject')
        .setDescription('Poll subject')
        .setRequired(false));

export async function execute(interaction) {
    if (!checkInChannel(interaction)) {
        return;
    }

    let subject = interaction.options.getString("subject");

    let voiceChannel = interaction.member.voice.channel;
    let poll = createPoll(interaction, subject);
    let row = new MessageActionRow();
    let pollButton = new MessageButton();
    let resetButton = new MessageButton();
    let closeButton = new MessageButton();

    pollButton.setCustomId('poll')
        .setLabel('Select')
        .setStyle('PRIMARY');

    resetButton.setCustomId('restart')
        .setLabel('Restart')
        .setStyle('PRIMARY');

    closeButton.setCustomId('closePoll')
        .setStyle('DANGER')
        .setEmoji('✖️');
        
    row.addComponents(pollButton, resetButton, closeButton);

    await interaction.reply({ content: `Strawpoll in the channel ${voiceChannel.name}: ${poll.getText()}`, components: [row], fetchReply: true})
        .then(message => poll.message = message);
}

export async function onPoll(interaction) {
    let voiceChannel = interaction.member.voice.channel;
    let poll = attachPoll(interaction);

    if (poll == null)
        return;

    poll.pick();

    await interaction.update({content: `Strawpoll in the channel ${voiceChannel.name}: ${poll.getText()}`});
    console.log("poll picked");
}

export async function onRestart(interaction) {
    let voiceChannel = interaction.member.voice.channel;
    let poll = attachPoll(interaction);

    if (poll == null)
        return;

    poll.reset(voiceChannel);

    await interaction.update({content: `Strawpoll in the channel ${voiceChannel.name}: ${poll.getText()}`});
    console.log("poll restarted");
}

export async function onClosePoll(interaction) {
    if (!checkPerms(interaction, false)) {
        return;
    }

    deletePoll(interaction);
    await interaction.reply({content: `<@${interaction.user.id}> poll has been closed!`, ephemeral: true});
    
    console.log("poll closed");
}

function createPoll(interaction, subject = null) {
    let voiceChannel = interaction.member.voice.channel;
    let poll = new Poll(interaction.user, voiceChannel, subject);

    let guildPolls = null;

    if (activePolls.has(interaction.guild.id)) {
        guildPolls = activePolls.get(interaction.guild.id);
        let prevPoll = guildPolls.get(interaction.user.id);

        if (prevPoll != null && prevPoll != undefined) {
            prevPoll.message.delete();
        }
    } else {
        guildPolls = new Map();
        activePolls.set(interaction.guild.id, guildPolls);
    }

    guildPolls.set(interaction.user.id, poll);

    return poll;
}

async function deletePoll(interaction) {
    try {
        let guildPolls = activePolls.get(interaction.guild.id);
        if(guildPolls != null && guildPolls != undefined) {
            let poll = guildPolls.get(interaction.user.id);
            if(poll != null && poll != undefined) {
                guildPolls.delete(interaction.user.id);
            }
        }

        await interaction.message.delete();
        console.log("poll deleted");
    } catch (e) {
        console.log(e);
        interaction.channel.send(`<@${interaction.user.id}> ${e}`);
    }
}

function attachPoll(interaction) {
    if (!checkInChannel(interaction) || !checkPerms(interaction)) {
        return null;
    }

    let guildPolls = activePolls.get(interaction.guild.id);
    let poll;

    if (guildPolls == null || guildPolls == undefined
        || !guildPolls.has(interaction.user.id)) {
        poll = createPoll(interaction);
        return poll;
    } 

    return guildPolls.get(interaction.user.id);
}

function checkPerms(interaction) {
    let guildPolls = activePolls.get(interaction.guild.id);
    let poll;
    if (guildPolls == null || guildPolls == undefined) {
        console.log("outdated poll");
        interaction.reply({content: `<@${interaction.user.id}> outdated poll!`, ephemeral: true});
        deletePoll(interaction);
        return false;
    } else {
        let poll = guildPolls.get(interaction.user.id);
        if (poll == null || poll == undefined || interaction.message.id != poll.message.id) {
            console.log("outdated poll");
            interaction.reply({content: `<@${interaction.user.id}> outdated poll!`, ephemeral: true});
            deletePoll(interaction);
            return false;
        } 
    }

    if(interaction.member.permissions.has('ADMINISTRATOR')) {
        return true;
    } else if (poll.initiator.id != interaction.user.id) {
        interaction.reply({content: `<@${interaction.user.id}> don't interrupt please!`, ephemeral: true});
        return false;
    }

    return true;
}

function checkInChannel(interaction) {
    let voiceChannel = interaction.member.voice.channel;

    if (voiceChannel == null || voiceChannel == undefined) {
        interaction.reply({content: `<@${interaction.user.id}> seems like you are not in the channel!`, ephemeral: true})
        return false;
    }

    return true;
}