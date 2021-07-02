
const discordTTS = require('discord-tts');

module.exports = {
    tts: function (broadcast, text) {
        let dispatcher = broadcast.play(discordTTS.getVoiceStream(text,
            'en'));
        return dispatcher;
    }
}