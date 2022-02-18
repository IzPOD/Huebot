
import { getVoiceStream } from 'discord-tts';
import EventEmitter from 'events';

class TTS extends EventEmitter {}

const handler = new TTS();

export function tts(broadcast, text) {
    let dispatcher = broadcast.play(getVoiceStream(text,
        'ru'));
    return dispatcher;
}
export function say(text) {
    return getVoiceStream(text);
}
