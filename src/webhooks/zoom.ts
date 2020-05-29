import { RouteHandler, ResponseError } from './helpers';
import { processWebhookEvent } from '../zoom';
import { ZOOM_WEBHOOK_SECRET } from '../config';
import { Client } from 'discord.js';

export default function makeZoomWebhookHandler(discord: Client): RouteHandler {
	return async function (req, res) {
		if (ZOOM_WEBHOOK_SECRET && req.headers['authorization'] !== ZOOM_WEBHOOK_SECRET) {
			console.log('WARNING: Unauthorized Zoom Webhook Request... Ignoring');
			console.log(req);
			throw new ResponseError('Invalid authorization header!', 401);
		}
		processWebhookEvent(discord, req.body);
		res.status(200);
		res.end();
	};
}
