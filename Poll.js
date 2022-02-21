import { bot } from './index.js';

export class Poll {
    participants;
    initiator;
    winner;
    subject;
    message;

    constructor(inititator, voiceChannel, subject) {
        this.initiator = inititator;
        this.subject = subject;
        this.fromVoiceChannel(voiceChannel);
    }

    pick() {
        this.winner = null;

        if (this.participants.length > 0) {
            let winnerIndex = Math.floor(Math.random() * this.participants.length);
            this.winner = this.participants[winnerIndex];

            this.participants.splice(winnerIndex, 1);
        }
    }

    reset(voiceChannel) {
        this.winner = null;
        this.fromVoiceChannel(voiceChannel);
    }

    getText() {
        let str = "";

        if(this.subject != null && this.subject != undefined) 
            str += `"${this.subject}"`;
        
        str += `\nInitiator: ${this.initiator.username}#${this.initiator.discriminator}`;

        if (this.winner != null && this.winner != undefined)
            str += `\nWinner: ${this.winner.username}#${this.winner.discriminator}`;
            
        str +="\nParticipants: ";
        if (this.participants.length > 0) {
            this.participants.forEach((user) => {
                str += ` ${user.username}#${user.discriminator}`;
            });
        } else {
            str += "none";
        }

        return str;
    }

    fromVoiceChannel(voiceChannel) {
        this.participants = new Array();
        voiceChannel.members.forEach((value) => {
            if (value.user.id != bot.user.id) 
                this.participants.push(value.user);
        });
    }
}