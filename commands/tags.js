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

export default {
    name: 'tags',
    description: 'Lists all tags and their associated Roblox users.',
    async execute(message) {
        try {
            const allTags = await db.get('tags');
            if (!allTags) {
                return message.reply('No tags found in the database!');
            }

            let responseMessage = '';

            Object.entries(allTags).forEach(([tag, users]) => {
                if (users.length > 0) {
                    responseMessage += `\▶ \`${tag}\`:\n\`\`\`Users: ${users.join(', ')}\`\`\`\n`;
                } else {
                    responseMessage += `\▶ \`${tag}\`:\nNo users associated with this tag.\n`;
                }
            });

            message.reply(responseMessage);
        } catch (error) {
            console.error(error);
            message.reply('An error occurred while fetching the tags.');
        }
    },
};
