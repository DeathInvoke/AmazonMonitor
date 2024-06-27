/* eslint-disable indent */
import { ActivityType, Client } from 'discord.js'
import fs from 'fs'
import { addWatchlistItem, getWatchlist, removeWatchlistItem } from './watchlist.js'
import debug from './debug.js'
import { item, category, search } from './amazon.js'
import {sendNotifications, sendPerformedAutobuy} from './notifications.js'
import {autobuy} from './buyer.js'
// @ts-ignore
import {LinkItem} from '../global.js'

const config: Config = JSON.parse(fs.readFileSync('./config.json').toString())

export async function startWatcher(bot: Client) {
  const curRows = await getWatchlist()

  bot.user.setActivity(`${curRows.length} items! | ${config.prefix}help`, {
    type: ActivityType.Watching,
  })

  setInterval(async () => {
    const rows = await getWatchlist()

    debug.log('Controllo prezzi...')

    if (rows.length > 0) await doCheck(bot, 0)
  }, config.minutes_per_check * 60 * 1000)
}

export async function doCheck(bot: Client, i: number) {
  const watchlist = await getWatchlist()

  if (i >= watchlist.length) return

  const item = watchlist[i]
  let result: NotificationData[] | null = null

  switch (item.type) {
    case 'link':
      // @ts-ignore we are properly checking the type
      result = await itemCheck(item, bot)
      break
    case 'category':
      // @ts-ignore we are properly checking the type
      result = await categoryCheck(item)
      break
    case 'query':
      // @ts-ignore we are properly checking the type
      result = await queryCheck(item)
      break
  }

  if (result) {
    await sendNotifications(bot, result)
  }

  // If this is not the last index in the array, run the next check
  if (i < watchlist.length - 1) {
    setTimeout(() => {
      doCheck(bot, i + 1)
    }, (config?.seconds_between_check || 5) * 1000)
  }
}

async function itemCheck(product: LinkItem, bot: Client) {
  const newData = await item(product.link)
  const mustBuy: boolean = product.autobuy
  const hasCoupon = newData?.coupon.hasCoupon

  debug.log(`new price arrived => ${newData?.price}`, 'debug')
  // It's possible the item does not have a price, so we have to anticipate that
  const newPrice = parseFloat(newData?.price) || -1
  //const newPrice = parseFloat(newData?.price?.replace(/,/g, '')) || -1

  // Push the price change to the watchlist
  if (newPrice !== product.lastPrice) {
    await removeWatchlistItem(product.link)
    await addWatchlistItem({
      ...product,
      lastPrice: newPrice,
    })
  }

  // const underPriceLimit = product.priceLimit ? newPrice <= product.priceLimit : true
  const underPriceLimit = product.priceLimit ? newPrice <= product.priceLimit : false

  debug.log(`Under price limit? ${underPriceLimit}...`, 'debug')
  debug.log(`Nuovo prezzo: ${newPrice}...`, 'debug')
  debug.log(`Vecchio prezzo: ${product.lastPrice}...`, 'debug')

  if (newPrice !== -1 && underPriceLimit && (product.lastPrice !== -1 && product.lastPrice > newPrice)) {
    let notifData = [
      {
        itemName: newData?.fullTitle || 'N/A',
        oldPrice: product.lastPrice,
        newPrice: newPrice,
        link: product.link,
        guildId: product.guildId,
        channelId: product.channelId,
        priceLimit: product.priceLimit || null,
        pricePercentage: product.pricePercentage || null,
        difference: product.difference || null,
        symbol: newData?.symbol,
        image: newData?.image,
        coupon: newData?.coupon
      }
    ] as NotificationData[]


    debug.log('Sending notification...', 'debug')
    if(mustBuy){
      debug.log(`Calling autobuy function for ${product.itemName}`, 'debug')
      const success: boolean = await autobuy(product.link, hasCoupon)
      if(success){
        await sendPerformedAutobuy(bot, notifData)
      }
    }
    return notifData
  }
  return null
}

async function categoryCheck(cat: CategoryItem) {
  let total = 0

  // First, get current items in category for comparison
  const newItems = await category(cat.link)

  // Match items in both arrays and only compare those prices.
  const itemsToCompare = newItems.list.filter((ni) =>
    cat.cache.find((o) => o.asin === ni.asin)
  )

  debug.log(`Numero di oggetti nella categoria: ${itemsToCompare.length}`, 'info')

  const notifications: NotificationData[] = []

  // Compare new items to cache and alert on price change
  itemsToCompare.forEach((item) => {
    const matchingObj = cat.cache.find((o) => o.asin === item.asin)

    if (matchingObj.lastPrice === item.lastPrice) return
    total++

    if (item.lastPrice > matchingObj.lastPrice) {
      notifications.push({
        itemName: item.fullTitle,
        oldPrice: matchingObj.lastPrice,
        newPrice: item.lastPrice,
        link: item.fullLink,
        guildId: cat.guildId,
        channelId: cat.channelId,
        priceLimit: cat.priceLimit || null,
        pricePercentage: cat.pricePercentage || null,
        difference: cat.difference || null,
        symbol: item.symbol,
        image: item?.image,
        coupon: null,
      })
    }
  })

  // Push new list to watchlist
  const addition: CategoryItem = {
    ...cat,
    cache: newItems.list,
  }

  debug.log(`${total} oggetto/i cambiato/i`, 'debug')

  // Remove old stuff
  await removeWatchlistItem(cat.link)
  // Add new stuff
  await addWatchlistItem(addition)

  return notifications
}

async function queryCheck(query: QueryItem) {
  const newItems = await search(query.query, config.tld)
  const itemsToCompare = newItems.filter((ni) =>
    query.cache.find((o) => o.asin === ni.asin)
  )

  const notifications: NotificationData[] = []

  // Compare new items to cache and alert on price change
  itemsToCompare.forEach((item) => {
    const matchingObj = query.cache.find((o) => o.asin === item.asin)

    if (matchingObj.lastPrice === item.lastPrice) return

    // if the obj has a coupon, modify the lastprice to reflect that
    /*if (matchingObj?.coupon > 0) {
      matchingObj.lastPrice -= matchingObj.coupon
    }*/

    //const newPriceWithCoupon = item.coupon > 0 ? item.lastPrice - item.coupon : item.lastPrice

    if (item.lastPrice < matchingObj.lastPrice) {
      notifications.push({
        itemName: item.fullTitle,
        oldPrice: matchingObj.lastPrice,
        newPrice: item.lastPrice,
        link: item.fullLink,
        guildId: query.guildId,
        channelId: query.channelId,
        priceLimit: query.priceLimit || null,
        pricePercentage: query.pricePercentage || null,
        difference: query.difference || null,
        symbol: item.symbol,
        image: item?.image,
        coupon: item.coupon,
      })
    }
  })

  // Push new list to watchlist
  const addition: QueryItem = {
    ...query,
    cache: newItems,
  }

  // Remove old stuff
  await removeWatchlistItem(query.query)
  // Add new stuff
  await addWatchlistItem(addition)

  return notifications
}
