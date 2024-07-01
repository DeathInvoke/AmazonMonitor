import pup from 'puppeteer'
import fs from 'fs'
import debug from './debug.js'
import {load} from 'cheerio'
import {delay} from './utils.js'

const userAgents = [
	'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0',
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.11 (KHTML, like Gecko) Ubuntu/14.04.6 Chrome/81.0.3990.0 Safari/537.36',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.3538.77 Safari/537.36',
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.62 Safari/537.36 Edg/81.0.416.31'
]

export async function initBrowser() {
	const config: Config = JSON.parse(fs.readFileSync('./config.json').toString())
	globalThis.browser = await pup.launch({
		// @ts-ignore
		headless: false,//'new',
		protocolTimeout: 360000,
		timeout: 40000,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
		...(config.custom_chromium_exec && {executablePath: config.custom_chromium_exec})
	})
}

async function loadCookies(page: pup.Page): Promise<boolean> {
	let loaded = false
	const cookiesString = fs.readFileSync('./cookies.json', {encoding: 'utf-8'})
	if (!cookiesString) {
		return loaded
	} else {
		loaded = true
	}
	const cookies = JSON.parse(cookiesString)

	const sessionStorageString = fs.readFileSync('./sessionStorage.json', {encoding: 'utf-8'})
	const sessionStorage = JSON.parse(sessionStorageString)

	const localStorageString = fs.readFileSync('./localStorage.json', {encoding: 'utf-8'})
	const localStorage = JSON.parse(localStorageString)

	await Promise.all([
		await page.setCookie(...cookies),

		await page.evaluate((data) => {
			for (const [key, value] of Object.entries(data)) {
				sessionStorage[key] = value
			}
		}, sessionStorage),

		await page.evaluate((data) => {
			for (const [key, value] of Object.entries(data)) {
				localStorage[key] = value
			}

		}, sessionStorage)
	])


	return loaded
}

export async function getPage(url: string) {
	// IF it's a product link, append aod=1 to the URL
	if (url.includes('/dp/')) {
		if (url.includes('?')) url += '&aod=1'
		else url += '?aod=1'
	}

	debug.log(`URL: ${url}`, 'info')

	const page = await global?.browser.newPage()
	const uAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
	const now = new Date().getTime()

	/*let proxy: string | null = null

	if (fs.existsSync('proxylist.txt')) {
		const proxies = fs.readFileSync('proxylist.txt').toString().split('\n')

		if (proxies.length > 0) {
			proxy = proxies[Math.floor(Math.random() * proxies.length)]
		}
	}

	if (proxy) {
		debug.log('Selected proxy URL: ' + proxy, 'info')
		await page.setRequestInterception(true)

		page.on('request', async (req) => {
			if (!proxy?.startsWith('http')) proxy = 'https://' + proxy

			await useProxy(req, proxy).catch(e => {
				debug.log('Failed to apply proxy, request won\'t go through', 'error')
				debug.log(e, 'error')
			})
		})
	}*/

	await Promise.all([
		await page.setUserAgent(uAgent),
		await page.goto(url, {waitUntil: 'domcontentloaded'}),
		await loadCookies(page)
	])

	//await page.reload()
	debug.log('Waiting a couple seconds for JavaScript to load...', 'info')

	//await new Promise(r => setTimeout(r, 1500))

	// Just in case there are misleading redirects, make sure we click the right "dimension-value" button
	const areDimensionValues: boolean = (await page.$$('.dimension-values-list')).length !== 0
	const areImgSwatches: boolean = (await page.$$('.imageSwatches')).length > 0

	const useImgSwatch = areDimensionValues && areImgSwatches
	const maybeDimensionValues = useImgSwatch ? await page.$$('.imageSwatches') : await page.$$('.dimension-values-list')

	debug.log('Do we have dimension values? ' + String(maybeDimensionValues.length > 0), 'debug')
	debug.log('Are they via img swatches? ' + String(useImgSwatch), 'debug')

	/*if (maybeDimensionValues.length > 0) {
		debug.log('Found dimension values, ensuring we are on the right one...', 'debug')

		// Each <li> should have a data-csa-c-item-id attr which contains their ASIN. We need to compare this asin to the one we have in the URL
		const asin = linkToAsin(url)

		debug.log('ASIN: ' + asin, 'debug')

		const dimensionValues = await maybeDimensionValues[0].$$('li')

		for (const dimensionValue of dimensionValues) {
			const dataAsin = await page.evaluate(el => el.getAttribute('data-csa-c-item-id'), dimensionValue)

			debug.log('data-csa-c-item-id (aka: the variant ASIN): ' + dataAsin, 'debug')

			if (asin.includes(dataAsin)) {
				debug.log('Found the correct dimension value, clicking...', 'debug')
				await dimensionValue.click()

				// Wait a couple seconds to let the new page load
				await new Promise(r => setTimeout(r, 1000))
				break
			}
		}
	}*/

	const html = await page.evaluate(() => document.body.innerHTML).catch(e => debug.log(e, 'error'))
	await Promise.all([
		await delay(5000)
	])

	//const html = await page.$eval('', () => {return document.body.innerHTML}).catch(e => debug.log(e, 'error'))

	// No need for page to continue to exist
	await page.close()

	if (!html) {
		debug.log('Failed to load page.', 'error')
		return null
	}

	const $ = load(html)

	debug.log(`Page took ${new Date().getTime() - now}ms to load.`, 'info')

	if (typeof $ !== 'function') {
		debug.log('Failed to load page.', 'error')
		return null
	}


	return $
}

export async function getPupPage(url: string) {
	debug.log(`URL: ${url}`, 'info')

	const page = await global?.browser.newPage()
	const uAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
	await Promise.all([
		await page.setUserAgent(uAgent),
		await page.goto(url, {waitUntil: 'domcontentloaded'}),
		await loadCookies(page)
	])

	//await page.reload()
	debug.log('Waiting a couple seconds for JavaScript to load...', 'info')

	return page
}