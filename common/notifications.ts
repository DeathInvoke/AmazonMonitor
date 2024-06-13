import {Client, EmbedBuilder, TextChannel} from 'discord.js'
import fs from 'fs'
import {parseParams, priceFormat} from './utils.js'
// @ts-ignore
import {NotificationData} from '../global.js'

const config: Config = JSON.parse(fs.readFileSync('./config.json').toString())

export async function sendNotifications(bot: Client, notifications: NotificationData[]) {
  const config: Config = JSON.parse(fs.readFileSync('./config.json').toString())

  for (const notif of notifications) {
    // If we have url_params, add them to the URL
    if (Object.keys(config.url_params).length > 0) {
      notif.link += parseParams(config.url_params)
    }

    if (notif.oldPrice === 0 && notif.newPrice !== 0) {
      // Old price was 0 but new price isn't? Item is now in stock!
      await sendInStock(bot, notif)
    }

    // Now we check if the price differences meet all of the provided criteria
    const meetsPriceLimit = notif.priceLimit ? notif.newPrice <= notif.priceLimit : true
    const meetsPricePercentage = notif.pricePercentage ? notif.newPrice <= (notif.oldPrice - (notif.oldPrice * (notif.pricePercentage / 100))) : true
    const meetsDifference = notif.difference ? notif.newPrice < (notif.oldPrice - notif.difference) : true

    // Prices being zero just means the item is out of stock
    const priceNotZero = notif.newPrice !== 0

    if (meetsPriceLimit && meetsPricePercentage && meetsDifference && priceNotZero) {
      await sendPriceChange(bot, notif)
    }
  }
}

export async function sendInStock(bot: Client, notification: NotificationData) {
  const embed = new EmbedBuilder()
    .setTitle(`In-stock alert for "${notification.itemName}"`)
    .setAuthor({
      name: 'AmazonMonitor'
    })
    .setThumbnail(notification.image)
    .setDescription(`Nuovo prezzo: ${notification.symbol} ${notification.newPrice}\n\n${notification.link}`)
    .setColor('Green')

  await sendToNotifyChannel(bot, notification, embed)
}

export async function sendPriceChange(bot: Client, notification: NotificationData) {
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

  await sendToNotifyChannel(bot, notification, embed)
}

// ------------------------------------------------------------
// ------------------------------------------------------------

async function sendToNotifyChannel(bot: Client, notification: NotificationData, embed: EmbedBuilder) {

  const channel = await _getNotificationChannel(bot, notification)
  if (channel instanceof TextChannel) {
    await channel.send({embeds: [embed]})
  }
}

async function _getNotificationChannel(bot: Client, notification: NotificationData) {
  if(config.notification_channel_name){
    // @ts-ignore
    return bot.channels.cache.find(value => value.isTextBased && value['name'] === config.notification_channel_name)
  }else{
    return await bot.channels.fetch(notification.channelId)
  }
}