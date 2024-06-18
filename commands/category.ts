import { Client, EmbedBuilder, EmbedField, Message } from 'discord.js'
import fs from 'fs'
import {CATEGORY_TREE} from '../common/categories.js'

export default {
	name: 'category',
	description: 'Restituisce un file json con tutte le URL delle varie categorie estratte.',
	usage: 'search [search term] [optional: -p for price limit]',
	type: 'view',
	run
}

async function run(bot: Client, message: Message, commands: { default: Command }[]) {
	const embed = new EmbedBuilder()
	let myObj = Object.fromEntries(CATEGORY_TREE)
	let myJSON = JSON.stringify(myObj);
	fs.writeFileSync('./category_tree.json', myJSON)

	embed.setTitle('AmazonMonitor: Albero delle categorie')
	embed.setDescription('Restituisce un file json con tutte le URL delle varie categorie estratte.')
	embed.setColor('Red')

	message.channel.send({
		embeds: [embed], files: ['./category_tree.json']
	})
}