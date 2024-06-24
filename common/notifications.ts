import {CategoryChannel, Client, EmbedBuilder, TextChannel} from 'discord.js'
import fs from 'fs'
import {parseParams, priceFormat} from './utils.js'
// @ts-ignore
import {NotificationData} from '../global.js'

const config: Config = JSON.parse(fs.readFileSync('./config.json').toString())
const tld: string = config.tld

export async function sendNotifications(bot: Client, notifications: NotificationData[]) {
  const channels = config.notification_channels

  for (const notif of notifications) {
    // If we have url_params, add them to the URL
    if (Object.keys(config.url_params).length > 0) {
      notif.link += parseParams(config.url_params)
    }

    if ((notif.oldPrice === 0 || notif.oldPrice != ' ' || notif.oldPrice === -1) && notif.newPrice > 0) {
      // Old price was 0 but new price isn't? Item is now in stock!
      await sendInStock(bot, notif, channels.get('restocks'))
    }

    // Now we check if the price differences meet all of the provided criteria
    const meetsPriceLimit = notif.priceLimit ? notif.newPrice <= notif.priceLimit : true
    const meetsPricePercentage = notif.pricePercentage ? notif.newPrice <= (notif.oldPrice - (notif.oldPrice * (notif.pricePercentage / 100))) : true
    const meetsDifference = notif.difference ? notif.newPrice < (notif.oldPrice - notif.difference) : true

    // Prices being zero just means the item is out of stock
    const priceNotZero = notif.newPrice !== 0

    if (meetsPriceLimit && meetsPricePercentage && meetsDifference && priceNotZero) {
      await sendPriceChange(bot, notif, channels.get('price_drops'))
    }
  }
}

export async function sendInStock(bot: Client, notification: NotificationData, channel: string) {
  const embed = new EmbedBuilder()
    .setTitle(`Restock per "${notification.itemName}"`)
    .setAuthor({
      name: 'AmazonMonitor'
    })
    .setThumbnail(notification.image)
    .setDescription(`Nuovo prezzo: ${notification.symbol} ${notification.newPrice}\n\n${notification.link}`)
    .setColor('Green')

  await sendToNotifyChannel(bot, notification, embed, channel)
}

export async function sendPriceChange(bot: Client, notification: NotificationData, channel: string) {
  const embed = new EmbedBuilder()
    .setTitle(`Notifica cambio di prezzo per "${notification.itemName}"`)
    .setAuthor({
      name: 'AmazonMonitor'
    })
    .setThumbnail(notification.image)
    .setDescription(`Prezzo precedente: ${notification.symbol}${priceFormat(notification.oldPrice)}\nNuovo prezzo: ${notification.symbol}${notification.newPrice.toFixed(2) + (
      notification.coupon > 0 ? ` (${notification.symbol}${notification.coupon.toFixed(2)} off with coupon)` : ''
    )}\n\n${notification.link}`)
    .setColor('Green')

  await sendToNotifyChannel(bot, notification, embed, channel)
}

// ------------------------------------------------------------
// ------------------------------------------------------------

async function sendToNotifyChannel(bot: Client, notification: NotificationData, embed: EmbedBuilder, channelName: string) {

  const channel = await _getNotificationChannel(bot, notification, channelName)
  if (channel instanceof TextChannel) {
    await channel.send({embeds: [embed]})
  }
}

async function _getNotificationChannel(bot: Client, notification: NotificationData, channelName: string) {
  if(channelName){
    return bot.channels.cache.find(value => {
      // @ts-ignore
      return value.isTextBased && value.parent['name'] === tld && value['name'] === channelName
    })
  }else{
    return await bot.channels.fetch(notification.channelId)
  }
}