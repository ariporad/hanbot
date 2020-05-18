import request from 'request-promise';
import { ResponseError } from './webhooks/helpers';
import { ZOOM_MEETING_ID, getZoomToken } from './config';

let hasSeenStart: boolean = false;
let participants: number = 0;

/**
 * Check the status of the Zoom call.
 */
export async function getZoomInfo() {
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

export async function processWebhookEvent(event: ZoomEvent) {
	console.log('Processing Zoom Webhook:');
	console.log(event);
	switch (event.event) {
		// We don't want to trust Zoom's webhooks for synchronization reasons, so we re-fetch the status
		case 'meeting.started':
		case 'meeting.ended': {
			await getZoomInfo();
			break;
		}
		case 'meeting.participant_joined': {
			const { active } = await getZoomInfo();
			if (!active) {
				console.log(
					'WARNING(webhook): Zoom participant joined while meeting was inactive. Ignoring.',
				);
				break;
			}
			participants++;
			break;
		}
		case 'meeting.participant_left': {
			const { active } = await getZoomInfo();
			if (!active) {
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
