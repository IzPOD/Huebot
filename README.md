# HueBot
Discord bot ***(for testing or private use purposes)*** based on Discord js API v13 and ytdl-core\ytpl js API 

![image](https://user-images.githubusercontent.com/36813380/154811158-3ae16250-252a-492c-9800-3b76f59c3f73.png);

## Bot features:
- Discord commands (/player (link: optional), /q (link: optional), ~~(/poll oh boy, I should rewrite this)~~)
- Visualized player with embed-updatable-message (~~Discord API rate limits ruining the fun~~) and control buttons 
- Playing audio from YouTube videos\streams
- Queuing tracks from single\playlist tracks
- Skipping\repeating\rewinding\playing previous tracks
- Shuffling\dropping queue
- Volume change
- ~~Variety of bugs and memory leaks~~ :wink:

~~Bot is capable to work across multiple guilds but it's not tested at all~~

# Usage for your purposes
1. **MAKE FORK** (This version is used internally on our fun-server! so probably would not update on its own, found any bugs? - fix them on your fork or make PR)
2. This bot uses **GLOBAL** slash commands so **node deploy-commands.js** should be ran at least once (on your local machine or somewhere else) **BEFORE** inviting bot to your server https://github.com/FoLoKe/Huebot/blob/777fa825f62185a0ad733ca33fa608f2bdad094e/deploy-commands.js#L1 
otherwise slash commands simply wouldn't appear on your server, if you missed that part simply kick bot, run script and invite it again.

## Discord App creation
1. Create a **New app** https://discord.com/developers/applications
2. Open created **App** and in the **Bot** section create new Bot - set its name and image, and enable "Privileged Intents" there too (all probably), then copy your **TOKEN** for config vars ![image](https://user-images.githubusercontent.com/36813380/154814130-96858d5b-de09-40ff-8427-093b3e908e9c.png)
3. In **OAuth2** section remember your **CLIENT ID**, it will be used as **CLIENT_ID** config var ![image](https://user-images.githubusercontent.com/36813380/154816809-8f2c0f85-b2be-4d49-b507-2650b909518f.png)
4. Generate invite link in **OAuth2** section ![image](https://user-images.githubusercontent.com/36813380/154813931-365e7b9b-5e3f-4c0f-9674-551153f28e30.png)

## Local deploy
1. Install latest node.js (used 16.x for this bot) https://nodejs.org/en/
2. Clone your fork to your local machine (https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
3. Open folder in terminal or use Visual Studio Code -> open folder and run in terminal "npm i" this should install all packages listed in package.json ![image](https://user-images.githubusercontent.com/36813380/154815302-87692728-fd67-49c7-9b9c-026b35c67e8b.png)
4. create .env file and fill it with config vars **TOKEN**, **APPLICATION ID**, **DELAY** (for delay less than 6000 you would probably exceed Discord API update\edit\send rate limits) ![image](https://user-images.githubusercontent.com/36813380/154815839-7e51f806-e1cf-48b8-9474-59779208b703.png)
5. Now run **node deploy-commands.js**, after successful run cancel process (Ctrl + C)![image](https://user-images.githubusercontent.com/36813380/154814910-99b69ee3-d2ae-49fb-b749-302941a5d411.png)
6. Invite bot to your server simply by pasting invite link in your browser's address line.
7. Now you can run your bot locally by typing command **node .** ![image](https://user-images.githubusercontent.com/36813380/154814987-bba963ed-cc69-436a-8ae2-424102113640.png)
8. All done - bot should appear online! use **/** commands to call different actions ![image](https://user-images.githubusercontent.com/36813380/154815089-8eb49671-6641-4637-8953-f37b5dbac777.png)

## Heroku deploy (**node deploy-commands.js** should be ran localy before)
use this guide -> https://github.com/synicalsyntax/discord.js-heroku (but you still need ffmpeg buildpack) or:
1. Login to https://id.heroku.com/login 
2. Create new app and connect it to your fork (**Deploy** section of Heroku App, probably you would like to enable automatic deploy there on GitHub changes) ![image](https://user-images.githubusercontent.com/36813380/154812314-6988b488-b12f-4329-9374-887d00dde8af.png)
3. In the **Settings** section create config vars ![image](https://user-images.githubusercontent.com/36813380/154816742-ea32ef3f-864e-472a-aadd-2332480443de.png)
4. In the same section add buildpacks ![image](https://user-images.githubusercontent.com/36813380/154812694-4f6918cb-d401-49c6-87d5-118991fd611d.png)
5. **Deploy** app ![image](https://user-images.githubusercontent.com/36813380/154813021-1fd424b7-8390-48ba-a020-7b859bb2ae7d.png)
6. After some time Dynos should appear... In Resources section change from "web" to "worker" ![image](https://user-images.githubusercontent.com/36813380/154813154-c1b64993-f45e-4749-a966-04f415e3ecf9.png)
7. Invite bot to your server simply by pasting invite link in your browser's address line.
8. All done - bot should appear online! (if you testing new code on your **local** machine don't forget to **disable** worker on Heroku)

