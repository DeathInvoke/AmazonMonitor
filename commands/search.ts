import fs from 'fs'
import {Client, EmbedBuilder, EmbedField, Message, RestOrArray} from 'discord.js'
import {applyCoupon, delay, trim} from '../common/utils.js'
import debug from '../common/debug.js'
import {search} from '../common/amazon.js'
import {parseArgs} from '../common/arguments.js'

const {tld} = JSON.parse(fs.readFileSync('./config.json').toString())

export default {
	name: 'search',
	description: 'Search and return the top 10 items using a search term',
	usage: 'search [search term] [optional: -p for price limit]',
	type: 'view',
	run
}

const argDef = {
	priceLimit: {
		name: 'priceLimit',
		aliases: ['p'],
		type: 'number'
	},
	pricePercentage: {
		name: 'pricePercentage',
		aliases: ['e'],
		type: 'number'
	}
}

async function run(bot: Client, message: Message, args: string[]) {
	args.splice(0, 1)
	const phrase = args.join(' ')
	const parsedArgs = parseArgs(args, argDef)

	if (!phrase) {
		message.channel.send('Please provide a search term')
		return
	}

	debug.log(`Searching for ${phrase}...`)

	let embedFields: EmbedField[] = []
	const results = await search(phrase, tld)

	await delay(1500)
	if (!results || results.length < 1) {
		message.channel.send(`No results found for "${phrase}"`)
		return

	}
	for (let i = 0; i <= results.length - 1; i++) {
		if (!results[i]) break

		const result = results[i]
		let priceNbr = parseFloat(result.price)

		const couponInfo = result.coupon
		if (parsedArgs.priceLimit && parseFloat(result.price) > (parsedArgs.priceLimit as number)) continue
		let priceWithCoupon: number
		if (couponInfo.hasCoupon) {
			/* if(couponInfo.isPercentage){
			   priceNbr -= (priceNbr/100) * couponInfo.couponAbsoluteValue
			 }else{
			   priceNbr -= couponInfo.couponAbsoluteValue
			 }

			 priceWithCoupon = priceNbr*/
			priceWithCoupon = applyCoupon(priceNbr, couponInfo)
		}
		//const priceWithCoupon = couponInfo.hasCoupon ? parseFloat(result.price) - result.coupon : result.price
		const couponSymbol: string = couponInfo.isPercentage ? `%` : result.symbol
		const couponMessage: string = couponInfo.hasCoupon ? `con coupon di/del ${couponSymbol}${couponInfo.couponAbsoluteValue} (${result.symbol}${priceWithCoupon})` : ``
		const inStockMessage: string = `${result.symbol}${priceNbr} ${couponMessage}`

		const messageValue: string = priceNbr ? `${inStockMessage} - ${result.fullLink}` : `Non in stock`

		// €100.00 con coupon di 5€ (€95.00) - https://www.amazon.it/dp/HDHDJDHUS
		// €100.00 - https://www.amazon.it/dp/HDHDJDHUS
		// Non in stock - https://www.amazon.it/dp/HDHDJDHUS

		embedFields.push({
			name: trim(result.fullTitle, 50),
			value: messageValue,
			inline: false
		})
	}

	const chunks = _chunk(embedFields, 25)
	for (const c of chunks) {
		const embed = new EmbedBuilder()
		  .setColor('Orange')
		  .setTitle(`Search results for phrase: ${phrase}`)
		  .addFields(c)

		await message.channel.send({
			embeds: [embed]
		})
	}
}

const _chunk = (arr: EmbedField[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
	arr.slice(i * size, i * size + size)
  );