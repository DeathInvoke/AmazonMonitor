import {getPupPage} from './browser.js'
import pup from 'puppeteer'
import debug from './debug.js'


export async function autobuy(link: string) {
	const buy_now_selector: string = '#buy-now-button'
	const submit_btn_selector: string = '#submitOrderButtonId'
	const save_order_selector: string = '#pp-8XfXHM-88'
	const force_double_order_selector_name: string = '[name="forcePlaceOrder"]'
	// const order_complete_selector: string = '#widget-purchaseConfirmationStatus'

	const page = await getPupPage(link)
	try{
		await _clickOnElement(page, buy_now_selector);
		await page.waitForNavigation()
		await _sleep(500)

		await _clickOnElement(page, submit_btn_selector)
		await page.waitForNavigation()
		await _sleep(500)

		const isDouble = await _checkIfElementExists(page, force_double_order_selector_name)
		if(isDouble){
			await _clickOnElement(page, force_double_order_selector_name)
			await page.waitForNavigation()
			await _sleep(500)
		}

		await _clickOnElement(page, save_order_selector)
		await page.waitForNavigation()
		await _sleep(500)

		return true;
	}catch (error){
		debug.log(`Error while autobuy product ${link}`, 'error')
		return false;
	}finally {
		await page.close()
	}



}

async function _checkIfElementExists(page: pup.Page, selector: string) {
	try {
		await page.waitForSelector(selector, { timeout: 1000 }); // you can adjust the timeout
		return true;
	} catch (error) {
		console.log(`Element with selector ${selector} does not exists`);
		return false;
	}
}

function _sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function _clickOnElement(page: pup.Page, sel: string){
	await page.evaluate((sel) => {

		let element = document.querySelector(sel);
		console.log(element)
		if(element) { // @ts-ignore
			element.click();
		}
	}, sel);
}