import request from 'request-promise';
import { ResponseError } from './webhooks/helpers';
import {
	ZOOM_MEETING_ID,
	getZoomToken,
	ZOOM_TIME_THRESHOLD,
	ZOOM_TIME_ANNOUNCEMENT_CHANNEL,
	ZOOM_TIME_DEBOUNCE_HOURS,
} from './config';
import { Client, TextChannel } from 'discord.js';
import { formatMessage } from './helpers';

export interface ZoomInfo {
	meetingInfo: any;
	active: boolean;
	hasSeenStart: boolean;
	participants: ZoomParticipant[];
}

interface ZoomParticipant {
	id: string;
	name: string;
}

let hasSeenStart: boolean = false;
let participants: ZoomParticipant[] = [];
let lastZoomTime: number = -1; // Date.now() format

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
		participants = [];
	}

	if (!hasSeenStart) participants = [];

	return { meetingInfo, active, hasSeenStart, participants };
}

export async function updateDiscordStatusFromZoom(discord: Client, zoomInfo?: ZoomInfo) {
	if (!zoomInfo) zoomInfo = await getZoomInfo();

	if (zoomInfo.active) {
		// Curently, the outer ternary is redundant because status is only set when zoomInfo.active is true
		const status = zoomInfo.active
			? hasSeenStart && participants.length >= 0
				? `with ${
						participants.length === 1 ? `1 person` : `${participants.length} people`
				  } on Zoom`
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

			participants.push({
				name: event.payload.object.participant.user_name,
				id: event.payload.object.participant.user_id,
			});

			if (
				ZOOM_TIME_THRESHOLD &&
				ZOOM_TIME_ANNOUNCEMENT_CHANNEL &&
				participants.length === ZOOM_TIME_THRESHOLD &&
				Date.now() - lastZoomTime >= ZOOM_TIME_DEBOUNCE_HOURS * 60 * 60 * 10000
			) {
				lastZoomTime = Date.now();
				const participantsStr =
					participants.length === 1
						? participants[0].name
						: `${participants
								.slice(0, -1)
								.map((p) => p.name)
								.join(',')}, and ${participants[participants.length - 1].name}`;

				await Promise.all(
					discord.guilds.cache.map(async (guild) => {
						const channel = guild.channels.cache.find(
							(ch) =>
								ch.name.toLowerCase() ===
								ZOOM_TIME_ANNOUNCEMENT_CHANNEL?.toLowerCase(),
						) as TextChannel | undefined;

						if (!channel) return;

						await channel.send(formatMessage(guild)`
🚨 Paging everybody, ${participantsStr} are starting a call, it's ${`%Zoom Time`}! 🚨
						`);
					}),
				);
			}
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

			participants = participants.filter(
				(participant) => participant.id !== event.payload.object.participant.user_id,
			);

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
