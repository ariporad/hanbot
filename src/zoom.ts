import request from "request-promise";
import { ResponseError } from "./webhooks/helpers";
import {
  ZOOM_MEETING_ID,
  getZoomToken,
  ZOOM_TIME_THRESHOLD,
  ZOOM_TIME_ANNOUNCEMENT_CHANNEL,
  ZOOM_TIME_DEBOUNCE_HOURS,
  PRODUCTION,
} from "./config";
import { Client, TextChannel } from "discord.js";
import { formatMessage } from "./helpers";
import { dispatch, getState } from "./store";
import {
  getParticipants,
  getCallIsActive,
  userLeft,
  userJoined,
  callStarted,
  callEnded,
  getHasSeenStart,
} from "./store/zoom";

interface ZoomParticipant {
  id: string;
  name: string;
}

export interface ZoomInfo {
  meetingInfo: any;
  active: boolean;
  hasSeenStart: boolean;
  participants: ZoomParticipant[];
}

let lastZoomTime: number = -1; // Date.now() format

/**
 * Check the status of the Zoom call.
 */
export async function updateZoomStatus(): Promise<string> {
  const meetingInfo = await request.get({
    uri: `https://api.zoom.us/v2/meetings/${ZOOM_MEETING_ID}`,
    auth: {
      bearer: getZoomToken(),
    },
    headers: {
      "User-Agent": "Hanbot",
      "Content-Type": "application/json",
    },
    json: true,
  });

  const active = meetingInfo.status === "started";
  const wasActive = getCallIsActive(getState());
  // status change
  if (wasActive !== active) {
    if (active) {
      dispatch(callStarted());
    } else {
      dispatch(callEnded());
    }
  }
  return meetingInfo.join_url;
}

const zoomId = (
  event: ZoomParticipantJoinedEvent | ZoomParticipantLeftEvent
) => {
  const participant = event.payload.object.participant;
  return (
    participant.id || `${event.payload.object.uuid}.${participant.user_id}`
  );
};

export async function processWebhookEvent(discord: Client, event: ZoomEvent) {
  console.log(`Processing Zoom Webhook Event: ${event.event}`);
  if (!PRODUCTION) console.log(JSON.stringify(event, null, 2));

  const { id: meetingId } = event.payload.object;

  // We toString both IDs because they're numerical and I don't want funny type errors.
  if (!meetingId || meetingId.toString() !== ZOOM_MEETING_ID.toString()) {
    console.log(`Webhook is for a different meeting (${meetingId}), ignoring.`);
    return;
  }

  switch (event.event) {
    // We don't want to trust Zoom's webhooks for synchronization reasons, so we re-fetch the status
    case "meeting.started":
    case "meeting.ended": {
      await updateZoomStatus();
      break;
    }
    case "meeting.participant_joined": {
      const participant = event.payload.object.participant;
      await updateZoomStatus();
      dispatch(
        userJoined({
          zoomId: zoomId(event),
          name: participant.user_name,
          temporary: !Boolean(participant.id),
        })
      );

      const participants = getParticipants(getState());
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
              .join(",")}, and ${participants[participants.length - 1].name}`;

        await Promise.all(
          discord.guilds.cache.map(async (guild) => {
            const channel = guild.channels.cache.find(
              (ch) =>
                ch.name.toLowerCase() ===
                ZOOM_TIME_ANNOUNCEMENT_CHANNEL?.toLowerCase()
            ) as TextChannel | undefined;

            if (!channel) return;

            await channel.send(formatMessage(guild)`
🚨 Paging everybody, ${participantsStr} are starting a call, it's ${`%Zoom Time`}! 🚨
						`);
          })
        );
      }
      break;
    }
    case "meeting.participant_left": {
      await updateZoomStatus();
      dispatch(
        userLeft({
          zoomId: zoomId(event),
          name: event.payload.object.participant.user_name,
        })
      );
      break;
    }
    default: {
      throw new ResponseError(
        `Unknown Webhook Event!: ${(event as ZoomEvent).event}`,
        400
      );
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
  event: "meeting.started";
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
  event: "meeting.ended";
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
  event: "meeting.participant_joined";
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
  event: "meeting.participant_left";
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
