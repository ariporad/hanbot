import request from 'request-promise';
import { ResponseError } from './webhooks/helpers';
import {
	ZOOM_MEETING_ID,
	getZoomToken,
	ZOOM_TIME_THRESHOLD,
	ZOOM_TIME_ANNOUNCEMENT_CHANNEL,
	ZOOM_TIME_DEBOUNCE_HOURS,
	PRODUCTION,
} from './config';
import { dispatch, getState } from './store';
import {
	getOnlineUsers,
	getIsActive,
	userLeave,
	userJoin,
	callStart,
	callEnd,
	setJoinUrl,
} from './store/zoom';

/**
 * Check the status of the Zoom call.
 */
export async function updateZoomStatus(): Promise<void> {
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
	const wasActive = getIsActive(getState());
	// status change
	if (wasActive !== active) {
		if (active) {
			dispatch(callStart());
		} else {
			dispatch(callEnd());
		}
	}
	dispatch(setJoinUrl(meetingInfo.join_url));
}

const getZoomUserIdFromEvent = (event: ZoomParticipantJoinedEvent | ZoomParticipantLeftEvent) => {
	/**
	 * When the user is signed in, the event includes a stable id
	 * When they are not signed in, the id is ommited
	 * Because the user_id is not stable and can be assigned to different users during different meetings (sessions),
	 * it is neccessary to prefix it with the meeting uuid
	 */
	const participant = event.payload.object.participant;
	return participant.id || `${event.payload.object.uuid}.${participant.user_id}`;
};

export async function processWebhookEvent(event: ZoomEvent) {
	console.log(`Processing Zoom Webhook Event: ${event.event}`);
	if (!PRODUCTION) console.log(JSON.stringify(event, null, 2));

	const { id: meetingId } = event.payload.object;

	// We toString both IDs because they're numerical and I don't want funny type errors.
	if (!meetingId || meetingId.toString() !== ZOOM_MEETING_ID.toString()) {
		console.log(`Webhook is for a different meeting (${meetingId}), ignoring.`);
		return;
	}

	await updateZoomStatus();

	switch (event.event) {
		// We don't want to trust Zoom's webhooks for synchronization reasons, so we re-fetch the status above
		case 'meeting.started':
		case 'meeting.ended': {
			break;
		}
		case 'meeting.participant_joined': {
			const participant = event.payload.object.participant;
			dispatch(
				userJoin({
					zoomId: getZoomUserIdFromEvent(event),
					name: participant.user_name,
					temporary: !participant.id,
				}),
			);
			break;
		}
		case 'meeting.participant_left': {
			dispatch(
				userLeave({
					zoomId: getZoomUserIdFromEvent(event),
					name: event.payload.object.participant.user_name,
				}),
			);
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
