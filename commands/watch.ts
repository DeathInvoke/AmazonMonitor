import fs from 'fs'
import {addWatchlistItem, getWatchlist} from '../common/watchlist.js'
import {Client, Message} from 'discord.js'
import {category, item, search} from '../common/amazon.js'
import {parseArgs} from '../common/arguments.js'
// @ts-ignore
import {LinkItem} from '../global.js'

const {cache_limit, tld, guild_item_limit}: Config = JSON.parse(fs.readFileSync('./config.json').toString())

export default {
	name: 'watch',
	desc: 'Aggiungi e traccia dei prodotti Amazon',
	usage: 'watch [argomenti: -q per query | -c per categoria | -l per link)] [link amazon, link di una categoria, oppure query di ricerca]\n' +
	  '[opzionali: -b (true|false) per attivare autobuy | -p per limite di prezzo | -d per differenza di prezzo | -e per percentuale sconto]',
	type: 'edit',
	run
}

const argDef = {
	link: {
		name: 'link',
		aliases: ['l'],
		type: 'string'
	},
	query: {
		name: 'query',
		aliases: ['q'],
		type: 'string'
	},
	category: {
		name: 'category',
		aliases: ['c'],
		type: 'string'
	},
	priceLimit: {
		name: 'priceLimit',
		aliases: ['p'],
		type: 'number'
	},
	pricePercentage: {
		name: 'pricePercentage',
		aliases: ['e'],
		type: 'number'
	},
	difference: {
		name: 'difference',
		aliases: ['d'],
		type: 'number'
	},
	autobuy: {
		name: 'autobuy',
		aliases: ['b'],
		type: 'boolean'
	},
	piecesToBuy: {
		name: 'piecesToBuy',
		aliases: ['pz'],
		type: 'number'
	}
}

async function run(bot: Client, message: Message, args: string[]) {
	const watchlist: Watchlist = await getWatchlist()
	const processed = parseArgs(args, argDef)

	processed.type = processed.link ? 'link' : processed.query ? 'query' : processed.category ? 'category' : null

	if (watchlist.length >= guild_item_limit) {
		message.channel.send(`Hai raggiunto il limite massimo di prodotti da osservare (${guild_item_limit})`)
		return
	}

	if (!processed.type) {
		message.channel.send('Fornisci un link o query valida')
		return
	}

	let response = ''

	// Process the results
	switch (processed.type) {
	case 'link': {
		// @ts-ignore this is guaranteed to be a link
		if (!processed.link?.startsWith('http')) {
			message.channel.send('Please provide a valid link')
			return
		}

		// See if the item is already there
		// @ts-ignore this is guaranteed to be a link
		const existing = watchlist.find(item => item.link === processed.link)

		if (existing) {
			message.channel.send('Il prodotto è già presente nella watchlist')
			return
		}

		// @ts-ignore this is guaranteed to be a link
		const product = await item(processed.link)

		if (!product) {
			message.channel.send('Link non valido')
			return
		}

		const piecesToBuy = processed.piecesToBuy as number

		const data: LinkItem = {
			guildId: message.guildId,
			channelId: message.channelId,
			type: 'link',
			link: processed.link as string,
			priceLimit: processed.priceLimit as number,
			pricePercentage: processed.pricePercentage as number,
			difference: processed.difference as number,
			symbol: product.symbol,
			itemName: product.fullTitle,
			lastPrice: parseFloat(product.price),
			autobuy: processed.autobuy,
			bought: 0,
			piecesToBuy: piecesToBuy
		}

		await addWatchlistItem(data)

		response = `Prodotto aggiunto con successo: ${processed.link}`

		if(piecesToBuy){
			response += `\nIl numero di pezzi da acquistare è: ${piecesToBuy}`
		}

		break
	}
	case 'category': {
		// @ts-ignore this is guaranteed to be a category
		if (!processed.category?.startsWith('http')) {
			message.channel.send('Fornisci un link valido')
			return
		}

		// Get if the category is already there
		// @ts-ignore this is guaranteed to be a category
		const existing = watchlist.find(item => item.link === processed.category)

		if (existing) {
			message.channel.send('La categoria è già presente nella watchlist')
			return
		}

		// @ts-ignore this is guaranteed to be a category
		const results = await category(processed.category)

		if (!results) {
			message.channel.send('Link non valido')
			return
		}

		addWatchlistItem({
			guildId: message.guildId,
			channelId: message.channelId,
			type: 'category',
			link: processed.category as string,
			priceLimit: processed.priceLimit as number,
			pricePercentage: processed.pricePercentage as number,
			difference: processed.difference as number,
			symbol: results.list[0].symbol,
			name: results.name,
			cache: results.list.splice(0, cache_limit)
		})

		response = `Categoria aggiunta con successo: ${processed.category}`

		break
	}
	case 'query': {
		// Check if the query is already there
		// @ts-ignore this is guaranteed to be a query
		const existing = watchlist.find(item => item.query === processed.query)

		if (existing) {
			message.channel.send('La query è già presente nella watchlist')
			return
		}

		// @ts-ignore this is guaranteed to be a query
		const results = await search(processed.query, tld)

		if (!results || results.length < 1) {
			message.channel.send(`Nessun risultato trovato per "${processed.query}"`)
			return
		}

		addWatchlistItem({
			guildId: message.guildId,
			channelId: message.channelId,
			type: 'query',
			query: processed.query as string,
			priceLimit: processed.priceLimit as number,
			pricePercentage: processed.pricePercentage as number,
			difference: processed.difference as number,
			cache: results.splice(0, cache_limit),
			symbol: results[0]?.symbol
		})

		response = `Query aggiunta con successo: ${processed.query}`

		break
	}
	}

	// Add the extras for price difference, price percentage, and price limit
	let symbol: string | number = ''
	if(processed.symbol && processed.symbol != ''){
		symbol = processed.symbol as string
	}else{
		symbol = '$'
	}
	const currency = `${symbol}`
	if (processed.priceLimit) {
		// @ts-ignore we null check this
		response += `\nIl prezzo deve essere inferiore a ${currency}${processed.priceLimit}`
	}

	if (processed.pricePercentage) {
		response += `\nIl prezzo deve essere scontato del ${processed.pricePercentage}% rispetto al prezzo precedentemente rilevato`
	}

	if (processed.difference) {
		// @ts-ignore we null check this
		response += `\nIl prezzo deve essere più di ${currency}${processed.difference} in meno rispetto al prezzo precedentemente rilevato`
	}

	const autobuy: boolean = processed.autobuy as boolean
	if (autobuy){
		response += '\nPer questo prodotto è stata attivata la funzione di autobuy'
	}

	message.channel.send({tts: false, content: response})
}