import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { readdirSync } from 'fs';
import { config } from 'dotenv';
config();

// Place your client and guild ids here
const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		const commands = [];
		const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const command = await import(`./commands/${file}`);
			commands.push(command.data.toJSON());
			console.log(command);
		}

		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
        console.log(clientId);
	}
})();

