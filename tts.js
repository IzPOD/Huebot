
const discordTTS = require('discord-tts');

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