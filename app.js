require('dotenv').config();

const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Utility Functions
const normalizePort = (val) => {
	const port = parseInt(val, 10);
	return isNaN(port) ? val : port >= 0 ? port : false;
};

const onError = (error) => {
	if (error.syscall !== 'listen') throw error;

	const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
	switch (error.code) {
		case 'EACCES':
			console.error(`${bind} requires elevated privileges`);
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(`${bind} is already in use`);
			process.exit(1);
			break;
		default:
			throw error;
	}
};

const onListening = () => {
	const addr = server.address();
	const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
	console.log(`Listening on ${bind}`);
};

// Constants
const PORT = normalizePort(process.env.PORT || '3000');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// App Setup
const app = express();
app.set('port', PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Deposit Routes
app.post('/deposit', async (req, res) => {
	const { userId, amount } = req.body;

	if (!userId || !amount) {
		return res.status(400).json({ status: 'failed', message: 'UserId and amount are required' });
	}

	try {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) return res.status(404).json({ status: 'failed', message: 'User not found' });

		const deposit = await prisma.deposit.create({
			data: {
				userId: userId,
				amount: amount,
				token: uuidv4(),
			},
		});

		return res.status(200).json({ status: 'success', data: { token: deposit.token } });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ status: 'failed', message: 'Internal server error' });
	}
});

// Webhook Routes
app.post('/webhook', async (req, res) => {
	const { secret } = req.query;
	if (secret !== WEBHOOK_SECRET) {
		return res.status(403).json({ status: 'failed', message: 'Invalid secret' });
	}

	const { message: token, amount } = req.body;
	if (!uuidValidate(token)) {
		return res.status(400).json({ status: 'failed', message: 'Invalid token' });
	}

	try {
		const deposit = await prisma.deposit.findFirst({
			where: { token: token, status: 'pending' },
		});

		if (!deposit) return res.status(404).json({ status: 'failed', message: 'Deposit not found' });

		if (parseFloat(amount) < deposit.amount) {
			return res.status(400).json({ status: 'failed', message: 'Amount too low' });
		}

		await prisma.deposit.update({
			where: { id: deposit.id },
			data: { status: 'completed' },
		});

		await prisma.user.update({
			where: { id: deposit.userId },
			data: { balance: { increment: deposit.amount } },
		});

		return res.status(200).json({ status: 'success' });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ status: 'failed', message: 'Internal server error' });
	}
});

// Server Setup
const server = http.createServer(app);
server.listen(PORT);
server.on('error', onError);
server.on('listening', onListening);
