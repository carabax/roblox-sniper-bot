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
  name: 'add',
  description: 'Add one or more nicknames to a specific tag',
  async execute(message, args) {
    const tag = args[0];
    const nicknamesInput = args.slice(1).join(' ');

    if (!tag || !nicknamesInput) {
      return message.reply('Usage: `sudo add <Tag> <Nickname1, Nickname2, ...>`');
    }

    let nicknames = nicknamesInput
      .split(',')
      .map(nickname => nickname.trim().replace(/ /g, '_'));

    if (nicknames.length > 10) {
      return message.reply('You can add a maximum of 10 nicknames at a time.');
    }

    const allTags = await db.get('tags') || {};

    let existingNicknames = allTags[tag] || [];

    const duplicatesInTag = [];
    
    nicknames.forEach(nickname => {
      if (existingNicknames.includes(nickname)) {
        duplicatesInTag.push(nickname);
      }
    });

    if (duplicatesInTag.length > 0) {
      return message.reply(`Players \`${duplicatesInTag.join(', ')}\` are already in tag \`${tag}\` and cannot be added again.`);
    }

    existingNicknames = [...new Set([...existingNicknames, ...nicknames])];

    await db.set(`tags.${tag}`, existingNicknames);

    message.reply(`Players \`${nicknames.join(', ')}\` added to tag \`${tag}\`.`);
  },
};
