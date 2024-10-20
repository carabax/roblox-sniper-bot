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
  name: 'remove',
  description: 'Remove one or more nicknames from a specific tag',
  async execute(message, args) {
    const tag = args[0];
    const nicknamesInput = args.slice(1).join(' ');

    if (!tag || !nicknamesInput) {
      return message.reply('Usage: `sudo remove <Tag> <Nickname1, Nickname2, ...>`');
    }

    let nicknamesToRemove = nicknamesInput
      .split(',')
      .map(nickname => nickname.trim().replace(/ /g, '_'));

    if (nicknamesToRemove.length > 10) {
      return message.reply('You can remove a maximum of 10 nicknames at a time.');
    }

    let existingNicknames = await db.get(`tags.${tag}`) || [];

    const notFoundNicknames = nicknamesToRemove.filter(nickname => !existingNicknames.includes(nickname));
    if (notFoundNicknames.length > 0) {
      return message.reply(`Players \`${notFoundNicknames.join(', ')}\` are not in tag \`${tag}\`.`);
    }

    existingNicknames = existingNicknames.filter(n => !nicknamesToRemove.includes(n));

    await db.set(`tags.${tag}`, existingNicknames);

    message.reply(`Players \`${nicknamesToRemove.join(', ')}\` removed from tag \`${tag}\`.`);
  },
};
