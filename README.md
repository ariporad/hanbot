# Hanbot

## A Discord bot for the Olin 2024 Mittens server

## Introduction

Hanbot is written in Typescript using [Discord.js][].

## Installation

First, you'll need Node.js and NPM installed. I used node `12.13.1`.

Then, clone the repo and run `npm install` to install the dependencies.

## Environment Variables

The bot expects a number of tokens and configuartion parameters in environment variables. They are:

### Discord

The bot authenticates to Discord as a bot user. Follow [these instructions][create-bot-user] to create a bot user, then [these instructions][add-bot-to-server] to add the bot to your Discord server (in code, and in the rest of this document, called a `Guild`). This bot has not been tested to operate in more than one guild at once, but it should work in theory.

-   `$DISCORD_TOKEN`: The token for your bot user (**not** OAuth tokens).
-   `$DISCORD_WELCOME_CHANNEL`: The name of the Discord channel to post welcome messages to. Don't set or leave blank to disable the welcome message. For Olin 2024 Mittens, we set this to `general`.
-   `$DISCORD_ADMITTED_ROLE`: The name of the role to automatically add to every user who joins the server. Don't set or leave blank to prevent giving everyone a role. For Olin 2024 Mittens, we set this to `Admitted`.
-   `$DISCORD_ZOOM_ACTIVE_ROLE`: The name of the role to add to users who are on Zoom. Don't set or leave blank to disable this feature. For Olin 2024 Mittens, we set this to `Zoomer`.

### Zoom

The bot authenticates to Zoom as a JWT app. A JWT app can only access the account that registers it and has full access to that account, and each Zoom account can only have one JWT at a time. However, JWT authentication is far simpler than the alternative (OAuth 2), which is why we use it.

Register your JWT app with Zoom following [these instructions][zoom-setup]

-   `$ZOOM_API_KEY`: The Zoom JWT API Key
-   `$ZOOM_API_SECRET`: The Zoom JWT API Secret
-   `$ZOOM_MEETING_ID`: The numerical Zoom meeting ID to monitor with the `!zoom` command. This is the same numerical meeting ID visible in the Zoom app. The Olin 2024 Zoom call is set up as a recurring Zoom call with no set frequency, which is to say that we always use the same call and the ID never changes.

### Other

-   `$PERSISTED_STATE_FILE`: The file to load/save state to. Used for restoring state after a restart or update.

## Environment Variable Management

[dotenv][dotenv] is used to manage environment variables during development and in production. This involves putting all the environment variables in a file called `.env` (see [`.env.example`](.env.example)), which is loaded by the app at runtime. This file is gitignored for security.

## Building

The project is compiled exclusively with `tsc`, which compiles every `.ts` file in `src/**/*` to a corresponding file in `dist/`. Just run `tsc` to compile the entire project (or run `npm run build`, which does the same thing).

To clean the project, simply delete the `dist/` folder and everything in it (or run `npm run clean`).

To have the compiler watch for and re-compile any changes, run `tsc --watch` or `npm run watch`.

## Running

To run the bot, build as described above then run `node ./dist/index.js` or `npm run start` (which will build for you).

You can also run and debug from within VS Code, which will work properly with the VS Code debugger use the `Run` task (not the `Watch` task, which is buggy).

In development, you can run `npm run dev`, which will clean the project, build, and run the bot. It will also watch changes, and subsequently recompile the project and reboot the bot.

For development purposes, we use the `@Hanbot Beta#9729` user. It's possible that multiple instances may be running at the same time.

**Warning:** If you run the bot in development with the real Discord tokens, it won't prevent the production version from running--the practical effect of which is that the bot will respond to all queries twice.

## Hosting

The bot running on Discord as `@Hanbot#9541` is hosted on a VPS [here][hanbot-live]. The bot is owned by Ari Porad ([@ariporad][]) <[ari@ariporad.com][]> and Elvis Wolcott ([@elviswolcott][]) owns the VPS. Feel free to contact them (or ping them on the Discord) if something's gone wrong or if you have questions.

All commits to `master` on this repo are automatically built by [Travis CI][travis-ci], which compiles the Typescript and deploys to the VPS. This usually takes only a few minutes.

The VPS is running Ubuntu 18 with [pm2][], NodeJS, and NGINX as the reverse proxy.

## Contributing

Please feel free to contribute to Hanbot! This bot belongs to all of us, and I'd love to have others contribute functionality (or just suggestions). Feel free to fork the project and open a PR, or just [create an issue](https://github.com/ariporad/hanbot/issues/new).

If you need help, feel free to reach out to me on Discord (I'm `Ari (Han X)`).

If you do contribute code, please make sure that your code works, and run `npm run lint` to ensure it's formatted properly (using [prettier][]). Ping me on the Discord and I'll set you up with the relevant credentials and tokens for testing your changes.

## License

Hanbot is licensed under the MIT License:

Copyright © 2020 Ari Porad <ari@ariporad.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[discord.js]: https://discord.js.org/
[dotenv]: https://github.com/motdotla/dotenv
[zoom-setup]: https://marketplace.zoom.us/docs/guides/build/jwt-app
[create-bot-user]: https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot
[add-bot-to-server]: https://discordjs.guide/preparations/adding-your-bot-to-servers.html
[hanbot-live]: https://hanbot.elviswolcott.com/
[@ariporad]: https://github.com/ariporad
[@elviswolcott]: https://github.com/elviswolcott
[ari@ariporad.com]: mailto:ari@ariporad.com?subject=Hanbot
[travis-ci]: https://travis-ci.com/github/ariporad/hanbot
[pm2]: https://pm2.keymetrics.io/
[prettier]: https://prettier.io/
