import {createWorker, PSM} from 'tesseract.js'

export async function resolve(imageUrl: string){
	const worker = await createWorker(['eng']);
	//const url: string = 'https://images-na.ssl-images-amazon.com/captcha/uyvnnjxx/Captcha_rdgufpyagh.jpg'
	const ret = await worker.recognize(imageUrl);
	const captcha = ret.data.text.trim()
	console.log(captcha);
	await worker.terminate();

	return captcha
}
