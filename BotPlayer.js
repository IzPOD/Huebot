const { Mutex } =  require('async-mutex');
const { 
    joinVoiceChannel, 
    VoiceConnectionStatus, 
    entersState, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus 
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');

const playerName = "HuePlayer";
const stringsSpacer = "         ###         ";
const maxChars = 35;
const shiftAmount = 2;
const updateDelay = 1000;

module.exports = {
    BotPlayer: class {
        id = null;
        info = null;
        infoTime = 0;
        infoGoing = false;

	    help = `use /q <ytube link> to add songs`;

        track = null;
        trackLink = null;
        nextTrack = null;
        nextLink = null;

        message;
        embed;
        active = true;
        index = 0;
        mutex = new Mutex();

        stream;
        interaction;
        voiceConnection;
        voiceChannelId;
        audioPlayer;
        res;
        volume = 0.5;
        readyLock = false;
        trackIndex = 0;

        list = Array.from([
            "https://www.youtube.com/watch?v=HfMQsXfDuno",
            "https://www.youtube.com/watch?v=XwZ6hBwTogg",
            "https://www.youtube.com/watch?v=a3DjORugHiQ"
        ]);

        queue = new Array();

        repeatQ = true;
        repeat = false;
        shuffled = false;
    
        setInfo(info) {
            this.info = info;
            this.infoTime = 2000;
            this.index = 0;
        }

        addTrack(link) {
            console.log("added: " + link);
            this.list.push(link);
            this.queue.push(link);
        }

        createPlayer() {
            if(this.audioPlayer == null || this.audioPlayer == undefined) {
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
            if (this.index < 0) {
                this.index = 0;
            }

            //THIS IS CANCER BUT...
            if (this.infoTime == -1) {
                this.infoTime = 0;
                this.index = 0;
            }

            let str = "  ";
            if (this.infoTime <= 0) {
                str += playerName;
        
                if (this.track != null) {
                    str += stringsSpacer;
                    str += "Now playing: "
                    str += this.track;
                }

                if (this.nextTrack != null) {
                    str += stringsSpacer;
                    str += "Next: "
                    str += this.nextTrack;
                }

                if (this.help != null) {
                    str += stringsSpacer;
                    str += this.help;
                }
            
                str += stringsSpacer;
            } else {
                str += this.info;
                this.infoTime -= updateDelay;
                if (this.infoTime <= 0) {
                    this.infoTime = -1;
                }
            }

            if (str.length < maxChars) {
                let toAdd = (maxChars - str.length) / 2;
                let round = Math.round(toAdd);

                str = new Array(round).join(" ")  + str + " "
                    + new Array(round).join(" ")

                if (round < toAdd)
                    str += " ";
            }

            if (this.index >= str.length) {
                this.index = 0;
            }

            str = str.slice(this.index) + str.slice(0, this.index);
            this.index += shiftAmount;

            if (str.length > maxChars) {
                str = str.slice(0, maxChars);
            }

            str = "_" + str + "_";

            return str;
        }

        getStats() {
            let str = "-[";
            str += this.trackIndex;
            str += "/"
            str += this.list.length;
            str += "]-";

            let pad = 11 - str.length;
            if(pad > 0) {
                str += new Array(pad).join("--");
            }
            str += "-------"

            if (this.repeat) {
                str += "-[R]"
            } else if (this.repeatQ) {
            str += "-[P]"
            } else {
                str += "-[X]"
            }

            if (this.shuffled) {
                str += "[S]---["
            } else {
                str += "[X]---["
            }

            let sound = (Math.round(this.volume * 10) + 1);
            str += new Array(10 - sound).join("░");
            str += new Array(sound).join("▓");
            str += "]-";
            return str;
        }

        async play() {
            this.setInfo("FETCHING INFO...");
        
            if(this.repeat && this.trackLink != null && this.trackLink != undefined) {
                console.log("repating track");
                this.queue.unshift(this.trackLink);
                this.trackIndex--;
            }

            if (this.queue.length <= 0) {
                this.trackIndex = 0;
                this.track = null;
                this.nextTrack = null;

                if(this.repeatQ && this.list.length > 0) {
                    console.log("repating playlist");
                    this.queue = Array.from(this.list);

                    if(this.shuffled) {
                        await this.mutex.runExclusive(async () => {
                            this.shuffle(this.queue);
                        });
                    }

                    this.setInfo("RESTARTING...");
                } else {
                    console.log("empty playlist");
                    this.list = new Array();
                    this.setInfo("QUEUE IS EMPTY");
                    return;
                }
            }

            this.trackIndex++;
            this.trackLink = this.queue.shift();

            ytdl.getBasicInfo(this.trackLink).then(info => {
                this.track = info.videoDetails.title;
                console.log("playing: " + info.videoDetails.title); 
            }).catch(error => console.log(error));

            //TODO CATCH POSSIBLE ERROR

            this.stream = ytdl(this.trackLink, {
                filter: "audioonly",
                highWaterMark: 1<<25,
                opusEncoded: true,
                encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200']
            });

            this.stream.on('error', (error) => {
                console.log("stream error: " + error);
                //skip
                //messageChannel.channel.send("видео недоступно");
                //nextSong(msg, channel);
            });

            this.stream.on('finish', () => {
                console.log("stream finished");
                //next;
            })

            this.res = createAudioResource(this.stream, {seek: 0, inlineVolume: true});
            this.res.volume.setVolume(this.volume);

            this.audioPlayer.play(this.res);

            if (this.queue.length > 0) {
            //foreach?
                let nextLink = this.queue[0];

                ytdl.getBasicInfo(nextLink).then(info => {
                    this.sleep(updateDelay * 8);
                    this.nextTrack = info.videoDetails.title;
                    console.log("next: " + info.videoDetails.title); 
                }).catch(error => console.log(error));
            }
        }

        next() {
            //stop stream
            if (this.stream != null) {
                this.stream.destroy();
            }

            //next
            this.play();
        }

        sleep(ms) {
            return new Promise((resolve) => {
              setTimeout(resolve, ms);
            });
        }

        async connect(voiceChannel) {
            this.createPlayer();

            let connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                console.log("disconnection");
                this.audioPlayer.pause();
                try {
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                    // Seems to be reconnecting to a new channel - ignore disconnect
                    this.audioPlayer.unpause();
                    console.log("reconnected");

                } catch (error) {
                    console.log("real disconnection");
                    // Seems to be a real disconnect which SHOULDN'T be recovered from
                    connection.destroy();
                    this.voiceChannelId = null;
                }
            });
    
            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
                this.voiceChannelId = voiceChannel.id;
                console.log("connected");
            } catch (error) {
                console.warn(error);
                return false;
            }

            this.dispatcher = connection.subscribe(this.audioPlayer);

            return true;
        }

        shuffle(array) {
            let currentIndex = array.length,  randomIndex;
        
            console.log(currentIndex);
          
            // While there remain elements to shuffle...
            while (currentIndex != 0) {
          
              // Pick a remaining element...
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex--;
          
              // And swap it with the current element.
              [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
            }
          
            return array;
        }
    }
}