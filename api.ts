import * as debug from './common/debug.js'
import fs from 'fs'
import express from 'express'
import http from 'http'

const app = express();
const router = express.Router();
const config: Config = JSON.parse(fs.readFileSync('./config.json').toString())

router.use((req, res, next) => {
	res.header('Access-Control-Allow-Methods', 'GET');
	next();
});

router.get('/health', (req, res) => {
	res.status(200).send('Ok');
});

app.use('/api/v1', router);

export function startServer(){
	const PORT = config.server_port
	const server = http.createServer(app);
	server.listen(PORT);

	debug.log(`SERVER STARTED ON PORT ${PORT}`, 'info')
}

