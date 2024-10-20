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

const pendingDeletions = {};

export default {
  name: 'delete',
  description: 'Delete an entire tag and all associated nicknames. Requires confirmation within 30 seconds.',
  async execute(message, args) {
    const tag = args[0];

    if (!tag) {
      return message.reply('Usage: `sudo delete <Tag>`');
    }

    const userId = message.author.id;

    if (pendingDeletions[userId] && pendingDeletions[userId].tag === tag) {
      await db.delete(`tags.${tag}`);

      clearTimeout(pendingDeletions[userId].timeout);
      delete pendingDeletions[userId];

      return message.reply(`Tag \`${tag}\` and all associated nicknames have been removed.`);
    }

    const existingTag = await db.get(`tags.${tag}`);
    
    if (!existingTag) {
      return message.reply(`Tag \`${tag}\` does not exist.`);
    }

    pendingDeletions[userId] = {
      tag: tag,
      timeout: setTimeout(() => {
        delete pendingDeletions[userId];
        message.reply(`Tag deletion for \`${tag}\` has been cancelled due to timeout.`);
      }, 30000)
    };

    return message.reply(`Are you sure you want to delete the tag \`${tag}\`? Please run the command again within 30 seconds to confirm.`);
  },
};
