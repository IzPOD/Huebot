import { Mutex } from 'async-mutex';

export class Queue {
    mutex = new Mutex();

    list = Array.from([
        "https://www.youtube.com/watch?v=cpeuGKT8r2Q"
    ]);
    queue =  Array.from(Array(this.list.length).keys());
    queueIndex = -1;

    repeatTrack = false;
    repeat = false;

    async addTrack(trackLink) {
        return this.mutex.runExclusive(() => {
            this.list.push(trackLink);
            this.queue.push(this.list.length - 1);
        });
    }

    async unload() {
        return this.mutex.runExclusive(() => {
            this.repeatTrack = false;
            this.repeat = false;
            this.list = new Array();
            this.queue = new Array();
            this.queueIndex = -1;
        });
    }

    async rewind(index) {
        return this.mutex.runExclusive(() => {
            if(this.queueIndex - index >= -1) {
                this.queueIndex -= index;
            } else {
                this.queueIndex = -1;
            }
        });
    }

    async next() {
        return this.mutex.runExclusive(() => {
            if (!this.repeatTrack || this.queueIndex == -1) {
                this.queueIndex++; //just played
            }

            if (this.queue.length > this.queueIndex) {
                //GET NEXT
                console.log("Queue: next");
                return this.list[this.queue[this.queueIndex]];
            } else {
                if (this.repeat && this.list.length > 0) {
                    //REPEAT QUEUE
                    this.queueIndex = 0;
                    this.queue = Array.from(Array(this.list.length).keys());
                    console.log("Queue: repeat");
                    return this.list[this.queue[this.queueIndex]];
                } else {
                    //EMPTY QUEUE
                    console.log("Queue: drop");
                    this.queueIndex = -1;
                    this.repeatTrack = false;
                    this.list = new Array();
                    this.queue = new Array();
                }
            }

            return null;
        });
    }

    async shuffle() {
        return this.mutex.runExclusive(() => {
            console.log(`shuffling: ${this.list.length} tracks`);
            this.queue = Array.from(Array(this.list.length).keys());
            let currentIndex = this.queue.length,  randomIndex;
      
            // While there remain elements to shuffle...
            while (currentIndex != 0) {
      
                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
      
                // And swap it with the current element.
                [this.queue[currentIndex], this.queue[randomIndex]] = [
                    this.queue[randomIndex], this.queue[currentIndex]
                ];
            }
            
            this.queueIndex = -1;
            console.log("queue shuffled");
        });
    }

    async getCurrentLink() {
        return this.mutex.runExclusive(() => {
            if (this.queue.length > this.queueIndex && this.list.length > this.queue[this.queueIndex]) {
                return this.list[this.queue[this.queueIndex]];
            }

            return null;
        });
    }

    async getNextLink() {
        return this.mutex.runExclusive(() => {
            if (this.queue.length > this.queueIndex + 1 && this.list.length > this.queue[this.queueIndex + 1]) {
                return this.list[this.queue[this.queueIndex + 1]];
            }

            return null;
        });
    }

    async getQueue() {
        return this.mutex.runExclusive(() => {
            let q = new Array();
            for (var i = this.queueIndex >= 0 ? this.queueIndex : 0; i < this.queue.length; i++) {
                q.push(this.list[i]);
            }

            return q;
        });
    }

    getQueueLength() {
        return this.queue.length;
    }
}