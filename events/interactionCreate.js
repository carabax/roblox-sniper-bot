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

import fetch from 'node-fetch';
import { MessageActionRow } from 'discord.js';

import config from '../config.json' assert { type: 'json' };
const { developerId } = config;

import { QuickDB } from 'quick.db';
const db = new QuickDB();

export default {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    const whitelist = await db.get('config.whitelist') || [];

    if (!whitelist.includes(interaction.user.id) && interaction.user.id !== developerId ) {
      console.log(`\💢 > The user [${interaction.user.username}] is not on the whitelist. Ignore the command. <${Date.now()}>`);
      return interaction.reply({ content: '\🤨 Who are you? DM to the developer (\`@one.carabax\`) to add you to the whitelist.', ephemeral: true });
    }

    if (interaction.isSelectMenu()) {
        if (interaction.customId === 'select_player') {
            const msgAuthor = interaction.message.mentions.users.first();

            if (interaction.user.id !== msgAuthor.id) {
                return await interaction.reply({ content: 'You are not authorized to use this interaction.', ephemeral: true });
            }

            const selectedUsername = interaction.values[0];
            const username = selectedUsername.split('] ')[1];
            const playerDescription = await db.get(`players.${username}.description`);

            try {
                const userResponse = await fetch('https://users.roblox.com/v1/usernames/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usernames: [username] }),
                });
                const userData = await userResponse.json();

                if (userData.errors || userData.errorMessage) {
                    return interaction.reply({ content: 'User not found on Roblox!', ephemeral: true });
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

                const disabledMenu = interaction.message.components[0].components[0].setDisabled(true);
                await interaction.update({ components: [new MessageActionRow().addComponents(disabledMenu)] });
                
                await interaction.followUp({ embeds: [embed], ephemeral: false });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: 'An error occurred while fetching the user data.', ephemeral: true });
            }
        }
    } else {
        return;
    }
  },
};
