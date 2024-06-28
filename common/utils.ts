// @ts-ignore
import {CouponInfo} from '../global.js'

export function linkToAsin(link: string) {
  return link?.split('/dp/')[1]?.split("?")[0] || link.split('/gp/product/')[1]?.split("?")[0]
}

export function trim(str: string, toLength: number = 128) {
  if (str?.length > toLength) return str.slice(0, toLength - 3) + '...'
  return str
}

export function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

/**
 * Apply coupon value to given price
 * @param fullPrice
 * @param coupon
 */
export function applyCoupon(fullPrice: number, coupon: CouponInfo) {
  if(coupon.isPercentage){
    return fullPrice -= (fullPrice/100) * coupon.couponAbsoluteValue
  }else{
    return fullPrice -= coupon.couponAbsoluteValue
  }
}

/**
 * Format a price
 */
export const priceFormat = (p: string | number) => {
  p = '' + p

  const currencySymbol = p.replace(/[,.]+/g, '').replace(/\d/g, '')

  if (currencySymbol) p = p.replace(currencySymbol, '')

  if (!p.includes('.') && !p.includes(',')) {
    p += '.00'
  }

  // Strip symbols from number
  if (p.indexOf('.') > p.indexOf(',')) {
    const cents = p.split('.')[1]
    const dollars = p.split(`.${cents}`)[0].split(',').join('')

    p = `${dollars}.${cents}`
  } else {
    const cents = p.split(',')[1]
    const dollars = p.split(`,${cents}`)[0].split('.').join('')

    p = `${dollars}.${cents}`
  }

  p = parseFloat(p).toFixed(2)

  return p
}

/**
 * Parses the url_params object to a URL-appendable string
 * 
 * @param {Object} obj 
 */
export const parseParams = (obj: { [key:string]: string }) => {
  if(Object.keys(obj).length === 0) return '?'
  let str = '?'
  Object.keys(obj).forEach(k => {
    str += `${k}=${obj[k]}&`
  })
  return str
}