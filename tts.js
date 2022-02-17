
const discordTTS = require('discord-tts');
const EventEmitter = require('events');

class TTS extends EventEmitter {}

const handler = new TTS();

module.exports = {
    tts: function (broadcast, text) {
        let dispatcher = broadcast.play(discordTTS.getVoiceStream(text,
            'ru'));
        return dispatcher;
    },

    say: function (text) {
        return discordTTS.getVoiceStream(text);
    }
}
