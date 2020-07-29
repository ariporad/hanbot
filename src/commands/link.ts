import Discord from 'discord.js';
import { dispatch, getState } from "../store";
import { userLinked } from "../store/zoom";
import { getUserByName } from "../store/zoom";
import { formatMessage, panic } from '../helpers';

export default function link(args: string, message: Discord.Message) {
  const name = args.trim();
  const zoomId = getUserByName(name)(getState());
  if (zoomId !== undefined) {
    dispatch(userLinked({ discordId: message.author.id, zoomId  }));
    return formatMessage(message.guild || panic())`${`@${message.author}`} I'll know who you are when I see ${name} on Zoom.`
  } else {
    return `I've never met anyone called **${name}**. Try joining the Zoom and linking again.`
  }
}