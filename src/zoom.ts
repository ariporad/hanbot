import request from 'request-promise';
import { ResponseError } from './webhooks/helpers';
import { ZOOM_MEETING_ID, getZoomToken } from './config';
import { Client } from 'discord.js';

interface ZoomInfo {
	meetingInfo: any;
	active: boolean;
	participants: number;
}

let hasSeenStart: boolean = false;
let participants: number = 0;

/**
 * Check the status of the Zoom call.
 */
export async function getZoomInfo(): Promise<ZoomInfo> {
	const meetingInfo = await request.get({
		uri: `https://api.zoom.us/v2/meetings/${ZOOM_MEETING_ID}`,
		auth: {
			bearer: getZoomToken(),
		},
		headers: {
			'User-Agent': 'Hanbot',
			'Content-Type': 'application/json',
		},
		json: true,
	});

	const active = meetingInfo.status === 'started';

	if (!active) {
		hasSeenStart = true;
		participants = 0;
	}

	if (!hasSeenStart) participants = -1;

	return { meetingInfo, active, participants };
}

export async function updateDiscordStatusFromZoom(discord: Client, zoomInfo?: ZoomInfo) {
	if (!zoomInfo) zoomInfo = await getZoomInfo();

	if (zoomInfo.active) {
		const status = zoomInfo.active
			? // We can't use zoomInfo.participants because, in `processWebhookEvent`, it's set before participants is updated
			  hasSeenStart
				? `with ${participants} people on Zoom`
				: 'on Zoom'
			: 'with nobody'; /* currently disabled */

		console.log(`Setting Discord status to: ${status}`);
		await discord.user?.setActivity(status, { type: 'PLAYING' });
	} else {
		console.log('Clearing Discord Status');
		// This is the best way I can find to clear activity (bots cant have custom statuses)
		await discord.user?.setActivity('', { type: 'CUSTOM_STATUS' });
	}
}

export async function processWebhookEvent(discord: Client, event: ZoomEvent) {
	console.log('Processing Zoom Webhook Event:');
	console.log(JSON.stringify(event, null, 2));

	// We toString both IDs because they're numerical and I don't want funny type errors.
	if (event.payload.object.id.toString() !== ZOOM_MEETING_ID.toString()) {
		console.log(`Webhook is for a different meeting (${event.payload.object.id}), ignoring.`);
		return;
	}

	let zoomInfo: ZoomInfo;
	switch (event.event) {
		// We don't want to trust Zoom's webhooks for synchronization reasons, so we re-fetch the status
		case 'meeting.started':
		case 'meeting.ended': {
			zoomInfo = await getZoomInfo();
			break;
		}
		case 'meeting.participant_joined': {
			zoomInfo = await getZoomInfo();
			if (!zoomInfo.active) {
				console.log(
					'WARNING(webhook): Zoom participant joined while meeting was inactive. Ignoring.',
				);
				break;
			}
			participants++;
			break;
		}
		case 'meeting.participant_left': {
			zoomInfo = await getZoomInfo();
			if (!zoomInfo.active) {
				console.log(
					'WARNING(webhook): Zoom participant left while meeting was inactive. Ignoring.',
				);
				break;
			}
			if (participants >= 1) {
				participants--;
			} else {
				console.log(
					'WARNING(Webhook): Zoom participant left while the meeting had no participants. Ignoring.',
				);
			}
			break;
		}
		default: {
			throw new ResponseError(`Unknown Webhook Event!: ${(event as ZoomEvent).event}`, 400);
		}
	}
	await updateDiscordStatusFromZoom(discord, zoomInfo);
}

type ZoomMeetingType =
	| /* Instant */ 1
	| /* Scheduled */ 2
	| /* Recurring (no fixed time) */ 3
	| /* Recurring (fixed time) */ 8;

type ZoomEvent =
	| ZoomMeetingStartedEvent
	| ZoomMeetingEndedEvent
	| ZoomParticipantJoinedEvent
	| ZoomParticipantLeftEvent;

interface ZoomMeetingStartedEvent {
	event: 'meeting.started';
	payload: {
		account_id: string;
		operator: string;
		object: {
			uuid: string;
			id: string;
			host_id: string;
			topic: string;
			type: ZoomMeetingType;
			start_time: string;
			duration: number;
			timezone: string;
		};
	};
}

interface ZoomMeetingEndedEvent {
	event: 'meeting.ended';
	payload: {
		account_id: string;
		object: {
			uuid: string;
			id: string;
			host_id: string;
			topic: string;
			type: ZoomMeetingType;
			start_time: string;
			duration: number;
			timezone: string;
		};
	};
}

interface ZoomParticipantJoinedEvent {
	event: 'meeting.participant_joined';
	payload: {
		account_id: string;
		object: {
			uuid: string;
			id: string;
			host_id: string;
			topic: string;
			type: ZoomMeetingType;
			start_time: string;
			duration: number;
			timezone: string;
			participant: {
				user_id: string;
				user_name: string;
				id: string;
				join_time: string;
			};
		};
	};
}

interface ZoomParticipantLeftEvent {
	event: 'meeting.participant_left';
	payload: {
		account_id: string;
		object: {
			uuid: string;
			id: string;
			host_id: string;
			topic: string;
			type: ZoomMeetingType;
			start_time: string;
			duration: number;
			timezone: string;
			participant: {
				user_id: string;
				user_name: string;
				id: string;
				leave_time: string;
			};
		};
	};
}
