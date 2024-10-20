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

import { QuickDB } from 'quick.db';
const db = new QuickDB();

import config from '../config.json' assert { type: 'json' };
const { developerId } = config;

export default {
    name: 'wl',
    description: 'Manage the whitelist',
    async execute(message, args) {
        if (message.author.id !== developerId) return;

        if (args.length < 1) {
            return message.reply('Usage: `sudo wl --add <UserID>`, `sudo wl --delete <UserID>`, `sudo wl --list`');
        }

        const option = args[0];

        try {
            let whitelist = await db.get('config.whitelist');
            if (!whitelist) {
                whitelist = [];
            }

            if (option === '--add') {
                if (args.length < 2) {
                    return message.reply('Please provide a user ID to add.');
                }

                const userId = args[1];

                if (whitelist.includes(userId)) {
                    return message.reply(`User ID \`${userId}\` is already in the whitelist.`);
                }

                whitelist.push(userId);
                await db.set('config.whitelist', whitelist);
                return message.reply(`User ID \`${userId}\` has been added to the whitelist.`);

            } else if (option === '--delete') {
                if (args.length < 2) {
                    return message.reply('Please provide a user ID to delete.');
                }

                const userId = args[1];

                if (!whitelist.includes(userId)) {
                    return message.reply(`User ID \`${userId}\` is not in the whitelist.`);
                }

                whitelist = whitelist.filter(id => id !== userId);
                await db.set('config.whitelist', whitelist);
                return message.reply(`User ID \`${userId}\` has been removed from the whitelist.`);

            } else if (option === '--list') {
                if (whitelist.length === 0) {
                    return message.reply('The whitelist is currently empty.');
                }

                const list = whitelist.join('\n');
                return message.reply(`Current whitelist:\n\`\`\`\n${list}\n\`\`\``);

            } else {
                return message.reply('Invalid option! Use `--add`, `--delete`, or `--list`.');
            }
        } catch (error) {
            console.error('Error interacting with the database:', error);
            return message.reply('There was an error interacting with the database.');
        }
    },
};
