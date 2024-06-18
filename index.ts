// @ts-ignore
import Discord, {Partials} from 'discord.js'
import fs from 'fs'
import * as debug from './common/debug.js'
import {initBrowser} from './common/browser.js'
import {startWatcher} from './common/watcher.js'
import {getCategoryTree} from './common/categories.js'
import {startServer} from './api.js'
// @ts-ignore
import {EnvironmentConfig} from './environment_config.js'

declare global {
	var browser: import('puppeteer').Browser
}
const envConfig: EnvironmentConfig = new EnvironmentConfig()
const __dirname = import.meta.url.split('/').slice(0, -1).join('/')

const bot = new Discord.Client({
	intents: [
		'Guilds',
		'GuildMembers',
		'GuildMessages',
		'MessageContent',
	],
	partials: [
		Partials.Channel,
		Partials.Message
	]
})

//const config: Config = JSON.parse(fs.readFileSync('./envConfig.json').toString())
const commands = new Discord.Collection()

// Check environment and get right token
let token
if (envConfig.dev) {
	token = envConfig.token_test
} else {
	token = envConfig.token
}
// ----------------------------------

bot.login(token)
//bot.login(token)

bot.on('ready', async () => {
	console.log(`
  ##########################################################################
   _____                                        __      __         __         .__                  
  /  _  \\   _____ _____  ____________   ____   /  \\    /  \\_____ _/  |_  ____ |  |__   ___________ 
 /  /_\\  \\ /     \\\\__  \\ \\___   /  _ \\ /    \\  \\   \\/\\/   /\\__  \\\\   __\\/ ___\\|  |  \\_/ __ \\_  __ \\
/    |    \\  Y Y  \\/ __ \\_/    (  <_> )   |  \\  \\        /  / __ \\|  | \\  \\___|   Y  \\  ___/|  | \\/
\\____|__  /__|_|  (____  /_____ \\____/|___|  /   \\__/\\  /  (____  /__|  \\___  >___|  /\\___  >__|   
        \\/      \\/     \\/      \\/          \\/         \\/        \\/          \\/     \\/     \\/       

  by DeathInvoke
  ##########################################################################
  `)

	if (envConfig.prefix.length > 3) debug.log('Your prefix is more than 3 characters long. Are you sure you set it properly?', 'warn')
	if (envConfig.prefix.length === 0) debug.log('You do not have a prefix set, you should definitely set one.', 'warn')

	if (envConfig.minutes_per_check < 1) {
		debug.log('You have set minutes_per_check to something lower than a minute. This can cause the bot to start new checks before the previous cycle has finshed.', 'warn', true)
		debug.log('If you experience heightened RAM usage, CPU usage, or general slowness, bring this value back up a reasonable amount.', 'warn', true)
		debug.log('This message is not an error, and the bot is still running.', 'warn', true)
	}

	if (__dirname.indexOf(' ') !== -1) {
		debug.log('The current path the bot resides in contains spaces. Please move it somewhere that does not contain spaces.', 'error', true)
		process.exit()
	}

	const env = envConfig.dev ? 'DEV' : 'PROD'
	debug.log(`Current environment is ${env}`, 'info', true)


	// Read all files in commands/ and add them to the commands collection
	for (const command of fs.readdirSync('./commands/')) {
		const cmd = await import(`./commands/${command}`)

		debug.log(`Loaded command ${cmd.default.name}`, 'info')

		commands.set(cmd.default.name, cmd)
	}

	// Initialize the globally accessible browser
	await initBrowser()

	if (envConfig.category_config_scan) {
		await getCategoryTree()
	}

	await startWatcher(bot)

	startServer()

	debug.log('Bot is ready!', 'info')
})

bot.on('messageCreate', function (message: Discord.Message) {
	if (message.author.bot || !message.content.startsWith(envConfig.prefix)) return

	const command = message.content.split(envConfig.prefix)[1].split(' ')[0],
	  args = message.content.split(' '),
	  cmd = commands.get(command)?.default

	if (cmd) {
		if (cmd.name === 'help') {
			cmd.run(bot, message, commands)
			return
		}

		switch (cmd.type) {
		case 'view':
			exec(message, args, cmd)
			break
		case 'edit':
			if (message.member.permissions.has(envConfig.required_perms)) exec(message, args, cmd)
			break
		}
	}
})

async function exec(message: Discord.Message, args: string[], cmd: Command) {
	const ch = await message.channel.fetch()
	ch.sendTyping()

	await cmd.run(bot, message, args).catch((e: Error) => {
		message.channel.send(e.message)
		debug.log(e, 'error')
	})
}
