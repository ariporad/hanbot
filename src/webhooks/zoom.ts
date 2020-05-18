import { RouteHandler } from './helpers';
import { processWebhookEvent } from '../zoom';

export default function makeZoomWebhookHandler(): RouteHandler {
	return async function (req, res) {
		processWebhookEvent(req.body);
		res.status(200);
		res.end();
	};
}
