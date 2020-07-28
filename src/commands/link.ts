import Discord from 'discord.js';
import { dispatch, getState } from "../store";
import { accountLinked } from "../store/link";
import { getUserByName } from "../store/zoom";
import { formatMessage, panic } from '../helpers';

export default function link(args: string, message: Discord.Message) {
  const name = args.trim();
  const id = getUserByName(name)(getState());
  if (id !== null) {
    dispatch(accountLinked({ discord: message.author.id, id  }));
    return formatMessage(message.guild || panic())`${`@${message.author.username}`} I'll know who you are when I see ${name} on Zoom.`
  } else {
    return `I've never met anyone called **${name}**. Try joining the Zoom and linking again.`
  }
}