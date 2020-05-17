# Hanbot

## A Discord bot for the Olin 2024 Mittens server

## Introduction

Hanbot is written in Typescript using [Discord.js][].

## Installation

First, you'll need Node.js and yarn installed. I used node `12.13.1`.

Then, clone the repo and run `yarn` to install the dependencies.

I also use [direnv][] for managing environment variables, but that's optional.

## Environment Variables

The bot expects a number of tokens and configuartion parameters in environment variables. They are:

### Discord

The bot authenticates to Discord as a bot user. Follow [these instructions][create-bot-user] to create a bot user, then [these instructions][add-bot-to-server] to add the bot to your Discord server (in code, and in the rest of this document, called a `Guild`). This bot has not been tested to operate in more than one guild at once, but it should work in theory.

-   `$DISCORD_TOKEN`: The token for your bot user (**not** OAuth tokens).
-   `$DISCORD_WELCOME_CHANNEL`: The name of the Discord channel to post welcome messages to. Don't set or leave blank to disable the welcome message. For Olin 2024 Mittens, we set this to `general`.
-   `$DISCORD_ADMITTED_ROLE`: The name of the role to automatically add to every user who joins the server. Don't set or leave blank to prevent giving everyone a role. For Olin 2024 Mittens, we set this to `Admitted`.

### Zoom

The bot authenticates to Zoom as a JWT app. A JWT app can only access the account that registers it and has full access to that account, and each Zoom account can only have one JWT at a time. However, JWT authentication is far simpler than the alternative (OAuth 2), which is why we use it.

Register your JWT app with Zoom following [these instructions][zoom-setup]

-   `$ZOOM_API_KEY`: The Zoom JWT API Key
-   `$ZOOM_API_SECRET`: The Zoom JWT API Secret
-   `$ZOOM_MEETING_ID`: The numerical Zoom meeting ID to monitor with the `!zoom` command. This is the same numerical meeting ID visible in the Zoom app. The Olin 2024 Zoom call is set up as a recurring Zoom call with no set frequency, which is to say that we always use the same call and the ID never changes.

## Environment Variable Management

For convinence during development, I use [direnv][] to manage environment variables. This involves putting all the environment variables in a file called `.envrc` (see [`.envrc.example`](.envrc.example)), which is automagically loaded by your terminal. This file is gitignored for security.

Unfortunately, this doesn't work when running from within VS Code. For that, we have to duplicate all of the environment variables into `.env`. It's important that both files are kept in sync.

## Building

The project is compiled exclusively with `tsc`, which compiles every `.ts` file in `src/**/*` to a corresponding file in `dist/`. Just run `tsc` to compile the entire project (or run `yarn build`, which does the same thing).

To clean the project, simply delete the `dist/` folder and everything in it (or run `yarn clean`).

To have the compiler watch for and re-compile any changes, run `tsc --watch` or `yarn watch`.

## Running

To run the bot, build as described above then run `node ./dist/index.js` or `yarn start` (which will build for you).

You can also run and debug from within VS Code, which will work properly with the VS Code debugger use the `Run` task (not the `Watch` task, which is buggy).

In development, you can run `yarn dev`, which will clean the project, build, and run the bot. It will also watch changes, and subsequently recompile the project and reboot the bot.

## License

Hanbot is licensed under the MIT License:

Copyright © 2020 Ari Porad <ari@ariporad.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[discord.js]: https://discord.js.org/
[direnv]: https://direnv.net/
[zoom-setup]: https://marketplace.zoom.us/docs/guides/build/jwt-app
[create-bot-user]: https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot
[add-bot-to-server]: https://discordjs.guide/preparations/adding-your-bot-to-servers.html
