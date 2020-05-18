import express from 'express';
import makeZoomWebhookHandler from './zoom';
import { version, START_TIME } from '../config';
import { getZoomInfo } from '../zoom';

export default function createApp() {
	const app = express();

	app.use(express.json());

	app.post('/webhooks/zoom', makeZoomWebhookHandler());
	app.get('*', async (req, res) => {
		try {
			const { active, participants } = await getZoomInfo();
			res.status(200);
			res.write(
				`
Hanbot OK (v${version})

Running Since ${START_TIME.toISOString()}.

Current Zoom Status: ${active ? `Active, ${participants} participants` : `Inactive`}.
`.trim(),
			);
			res.end();
		} catch (err) {
			console.error(`ERROR(app.get(*))!`);
			console.error(req);
			console.error(err.message);
			err.stack && console.error(err.stack);
			res.status(500);
			res.write('Error, please check logs.');
			res.end();
		}
	});

	return app;
}
