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
import fetch from 'node-fetch';

const db = new QuickDB();

export default {
    name: 'info',
    description: 'Displays or sets information about a Roblox user',
    async execute(message, args) {
        if (args.length < 1) {
            return message.reply('Usage: `sudo info <Nickname>` or `sudo info <Nickname> --description <Text>`');
        }

        const username = args[0];
        const isSettingDescription = args.includes('--description');
        const descriptionIndex = args.indexOf('--description');
        const description = isSettingDescription ? args.slice(descriptionIndex + 1).join(' ') : null;

        let playerDescription = await db.get(`players.${username}.description`);

        if (isSettingDescription) {
            if (!description) {
                return message.reply('Please provide a description!');
            }

            await db.set(`players.${username}.description`, description);
            return message.reply(`Description for ${username} has been updated!`);
        } else {
            try {
                const userResponse = await fetch('https://users.roblox.com/v1/usernames/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usernames: [username] }),
                });
                const userData = await userResponse.json();

                if (userData.errors || userData.errorMessage) {
                    return message.reply('User not found!');
                }

                const userId = userData.data[0].id;

                const avatarResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
                const avatarData = await avatarResponse.json();
                const avatarUrl = avatarData.data[0].imageUrl;

                const embed = {
                    title: `${username}'s Information`,
                    thumbnail: { url: avatarUrl },
                    fields: [
                        { name: 'Username', value: username, inline: true },
                        { name: 'Roblox ID', value: `${userId}`, inline: true },
                    ],
                };

                if (playerDescription) {
                    embed.fields.push({ name: 'Description', value: `>>> ${playerDescription}` });
                }

                return message.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                return message.reply('An error occurred while fetching the user data.');
            }
        }
    },
};
