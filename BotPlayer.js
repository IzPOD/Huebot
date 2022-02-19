
import { joinVoiceChannel, VoiceConnectionStatus, entersState, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';

import ytdl from 'ytdl-core';
import { Queue } from './Queue.js';
import { updateDelay } from './index.js'

const maxChars = 22;
const spacer = new Array(Math.round(60)).join("-");

export class BotPlayer {
    id = null;
    info = `use /q <ytube link> to add songs`;
    infoTime = 0;
    infoGoing = false;

    track = null;
    nextTrack = null;

    message;    //probably need to remove that and find by id in update
    embed;      //and then this goes to
    active = false;
    index = 0;

    stream;  // don't need this since audioplayer destroys resource?
    connection;
    voiceChannelId;
    audioPlayer;
    res;
    volume = 0.5;
    lock = false;

    rewinded = 0;

    queue = new Queue();

    setInfo(info) {
        this.info = info;
        this.infoTime = updateDelay;
        this.index = 0;
    }

    addTrack(link) {
        console.log(`added: ${link}`);
        this.queue.addTrack(link);
    }

    createPlayer() {
        if (this.audioPlayer == null || this.audioPlayer == undefined) {
            this.audioPlayer = createAudioPlayer();

            this.audioPlayer.on('stateChange', (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                    // The queue is then processed to start playing the next track, if one is available.
                    //NEXT
                    this.play();
                    console.log("idle");
                } else if (newState.status === AudioPlayerStatus.Playing) {
                    // If the Playing state has been entered, then a new track has started playback.
                    console.log("playing");
                } else if (newState.status === AudioPlayerStatus.Paused) {
                    console.log("paused");
                }
            });

            this.audioPlayer.on('error', (error) => {
                console.log("player error: " + error);
                this.play();
            });
        }
    }

    getText() {
        // if (this.index < 0) {
        //     this.index = 0;
        // }

        // //THIS IS CANCER BUT...
        // if (this.infoTime == -1) {
        //     this.infoTime = 0;
        //     this.index = 0;
        // }

        let str = "  ";
        // if (this.infoTime <= 0) {
        //     str += name;

        //     if (this.track != null) {
        //         str += `${stringsSpacer}Now playing:  ${this.track}`;
        //     }

        //     if (this.nextTrack != null) {
        //         str += `${stringsSpacer}Next: ${this.nextTrack}`;
        //     }

        //     str += `${stringsSpacer}${help}${stringsSpacer}`;
        // } else {
        //     str += this.info;
        //     this.infoTime -= updateDelay;
        //     if (this.infoTime <= 0) {
        //         this.infoTime = -1;
        //     }
        // }

        if (this.info != null) {
            str += this.info;
        }

        // CANT EDIT MESSAGE FAST TO SMOTH ANIMATION DUE TO DISCORD API RESTRICTIONS
        //if (str.length < maxChars) { 
        //    let toAdd = (maxChars - str.length) / 2;
        //    let round = Math.round(toAdd);
        //
        //    str = new Array(round).join(" ") + str + " "
        //        + new Array(round).join(" ");
        //
        //    if (round < toAdd)
        //        str += " ";
        //}

        //if (this.index >= str.length) {
        //    this.index = 0;
        //}

        //str = str.slice(this.index) + str.slice(0, this.index);
        //this.index += shiftAmount;

        if (str.length > maxChars + 3) {
            str = str.slice(0, maxChars) + "...";
        }

        str = "_" + str + "_";

        return str;
    }

    getQueueLen() {
        let str = "" + (this.queue.queueIndex + 1);
        str += `/${this.queue.getQueueLength()}`;

        let pad = 11 - str.length;
        if (pad > 0) {
            str += new Array(pad).join("  ");
        }

        return str;
    }

    getStats() {
        let bars = 4;
        let sound = Math.min(bars, Math.max(0, (Math.round(this.volume * bars))));
        
        let str = 
            `[| ${new Array(bars + 1 - sound).join("\\ ")}${new Array(sound + 1).join("🙽")} |                         `;
        
        let status = this.audioPlayer.state.status;

        if (status === AudioPlayerStatus.Playing) {
            str += "\\◀  ";
        } else if (status === AudioPlayerStatus.Paused) {
            str += "\\⏸  ";
        } else {
            str += "\\⏹  ";
        }

        if (this.queue.repeatTrack) {
            str += "\\⟳";
        } else if (this.queue.repeat) {
            str += "\\🖭";
        }
        return str;
    }

    async play() {
        //this.setInfo("FETCHING INFO...");
        if(this.audioPlayer.state.status !== AudioPlayerStatus.Idle) {
            this.audioPlayer.stop();
        }
        this.info = "FETCHING INFO...";
        //this.track = null;
        //this.nextTrack = null;
        let link = await this.queue.next();

        if(link == null || link == undefined) {
            console.log("queue is empty, stopping");
            //this.setInfo("QUEUE IS EMPTY");
            this.info = "QUEUE IS EMPTY";
            return;
        }

        let info = await ytdl.getBasicInfo(link).catch(error => console.log(error));
        if(info == undefined) {
            this.play();
            return;
        }

        //this.track = info.videoDetails.title;
        this.info = `${info.videoDetails.title}`;
        console.log("playing: " + info.videoDetails.title);

        console.log(info.videoDetails.isLive);

        //TODO CATCH POSSIBLE ERROR
        this.stream = ytdl(link, info.videoDetails.isLive ? {quality: [91,92,93,94,95], liveBuffer: 4900} : {
            filter: "audioonly",
            highWaterMark: 1 << 25,
            opusEncoded: true,
            encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200']
        });

        this.stream.on('error', (error) => {
            console.log("stream error: " + error);
        });

        this.stream.on('finish', () => {
            console.log("stream finished");
        });

        this.res = createAudioResource(this.stream, { seek: 0, inlineVolume: true });
        this.res.volume.setVolume(this.volume);

        this.audioPlayer.play(this.res);
    }

    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async connect(voiceChannel) {
        this.createPlayer();

        if (this.connection != null && this.connection != null) {
            if(voiceChannel.id != this.voiceChannelId) {
                this.connection.destroy();
                this.connection = null;
                this.voiceChannelId = null;
                console.log("disconnected from an old channel");
            } else {
                console.log("already connected");
                return true; // aleready connected
            }
        }

        this.connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        this.connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            console.log("disconnection");
            this.audioPlayer.pause();
            this.connection.destroy();
            this.connection = null;
            this.voiceChannelId = null;
        });

        try {
            await entersState(this.connection, VoiceConnectionStatus.Ready, 1500);
            this.voiceChannelId = voiceChannel.id;
            console.log("connected");
        } catch (error) {
            console.warn(error);
            return false;
        }

        this.connection.subscribe(this.audioPlayer);

        return true;
    }

    async rewind() {
        if(this.rewinded > 0) {
            await this.queue.rewind(2);
            console.log("rewinding");
        } else {
            await this.queue.rewind(1);
            console.log("replaying");
        }

        if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
            this.play();
        } else if (this.audioPlayer.state.status === AudioPlayerStatus.Playing
            || this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
            this.rewinded = 5000;
            this.audioPlayer.stop();
        }
    }

    async updatePlayer() {
        if (this.active) {
            return;
        }

        console.log("entered update loop");
        
        this.active = true;
        while(this.active)
        {
            await sleep(updateDelay);
            if (!this.active) {
                console.log("exited update loop");
                return;
            }

            if (this.rewinded >= 0) {
                this.rewinded -= updateDelay; // for tracking "repeat this\previous"
            }

            let que = this.getQueueLen();
            let text = this.getText();
            let stats = this.getStats();
            this.embed.setTitle( `PGN\n${que}        #>    ${text}\n${stats}\n${spacer}`);
    
            if(this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
                this.embed.setColor('#ff0000');
            } else if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
                this.embed.setColor('#00ff00');
            } else if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
                this.embed.setColor('#999900');
            }
            
            await this.message.edit({embeds: [this.embed]}).catch((error) => {
                console.log(error); //probably the message was deleted by admin
                this.active = false;
                this.id = null;
                        
                if(this.connection != null) {
                    this.connection.destroy();
                    this.connection = null;
                }

                if(this.audioPlayer != null) {
                    this.audioPlayer.stop();
                    this.audioPlayer = null
                }

                this.queue.unload();
            });
        }
    }
}
    
// sleep I guess?
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}