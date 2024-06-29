import {getPupPage} from './browser.js'
import pup from 'puppeteer'
import debug from './debug.js'
import {delay} from './utils.js'

export async function autobuy(link: string, hasCoupon: boolean) {
	const buy_now_selector: string = '#buy-now-button'
	const submit_btn_selector: string = '#submitOrderButtonId'
	const save_order_selector: string = 'a[class="a-button-text"]'
	const force_double_order_selector_name: string = '[name="forcePlaceOrder"]'
	const error_selector: string = 'h4[class=".a-color-error"]'

	const page = await getPupPage(link)
	try {

		if (hasCoupon) {
			await _applyCouponInPage(page)
			await delay(500)
		}
		await _clickOnElement(page, buy_now_selector)

		const isThereSubmit = await _checkIfElementExists(page, submit_btn_selector)
		if(!isThereSubmit){
			const isThereError = await _checkIfElementExists(page, error_selector)
			if(isThereError){
				return false
			}
		}

		await page.waitForSelector(submit_btn_selector)
		await delay(500)

		await _clickOnElement(page, submit_btn_selector)
		await page.waitForNavigation()
		//await page.waitForSelector(force_double_order_selector_name, {timeout: 2000}).
		await delay(500)

		const isDouble = await _checkIfElementExists(page, force_double_order_selector_name)
		if (isDouble) {
			await _clickOnElement(page, force_double_order_selector_name)
		}

		await delay(500)
		await page.waitForSelector(save_order_selector, {timeout: 5000})

		await _clickOnElement(page, save_order_selector)
		await page.waitForNavigation()
		await delay(500)

		return true
	} catch (error) {
		debug.log(error, 'error')
		debug.log(`Error while autobuy product ${link}`, 'error')
		return false
	} finally {
		await page.close()
	}
}

// ----------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------

async function _applyCouponInPage(page: pup.Page) {
	try {
		const checkboxCouponSelector: string = 'input[id*="checkboxpctch"]'

		const checkboxExists = await _checkIfElementExists(page, checkboxCouponSelector)
		if (checkboxExists) {
			await _clickOnElement(page, checkboxCouponSelector)
		}
	} catch (error) {
		debug.log('Error while applying coupon to page.', 'error')
	}
}

async function _checkIfElementExists(page: pup.Page, selector: string) {
	try {
		await page.waitForSelector(selector, {timeout: 5000}) // you can adjust the timeout
		return true
	} catch (error) {
		console.log(`Element with selector ${selector} does not exists`)
		return false
	}
}

async function _clickOnElement(page: pup.Page, sel: string) {
	await page.evaluate((sel) => {

		let element = document.querySelector(sel)
		console.log(element)
		if (element) { // @ts-ignore
			element.click()
		}
	}, sel)
}