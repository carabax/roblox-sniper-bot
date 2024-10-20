// MIT License

// Copyright (c) 2024 carabax

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import config from '../config.json' assert { type: 'json' };
const { prefix, developerId } = config;

import { QuickDB } from 'quick.db';
const db = new QuickDB();

export default {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const whitelist = await db.get('config.whitelist') || [];

    if (!whitelist.includes(message.author.id) && message.author.id !== developerId ) {
      console.log(`\💢 > The user [${message.author.username}] is not on the whitelist. Ignore the command. <${Date.now()}>`);
      return message.reply({ content: '\🤨 Who are you? DM to the developer (\`@one.carabax\`) to add you to the whitelist.' })
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = message.client.commands.get(commandName);

    if (!command) return message.reply({ content: `There is no such command! [Here is the documentation for using the bot](<https://heavy-chatter-5df.notion.site/Roblox-Sniper-28f9cc7ef5d04894b4ddcfb81f0ca1e3?pvs=4>).` });

    try {
      command.execute(message, args);
    } catch (error) {
      console.error(error);
      message.reply({ content: '[MessageCreate Event] An error has occurred!' });
    }
  },
};
