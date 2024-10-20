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
import { QuickDB } from 'quick.db';
import { MessageActionRow, MessageSelectMenu } from 'discord.js';

const db = new QuickDB();

export default {
    name: 'find',
    description: 'Finds Roblox users by tag, specific player name, or all users across different groups.',
    async execute(message, args) {
        if (args.length < 1) {
            return message.reply('Usage:\n`sudo find --tag <TagName> [PlaceId]`\n`sudo find --player <Nickname> [PlaceId]`\n`sudo find --all [PlaceId]`');
        }

        const option = args[0];
        let placeId = '2317712696';
        let usersToSearch = [];
        let usersWithTags = {};

        await message.react('⏳');

        try {
            if (option === '--tag') {
                const [tagName, _placeId] = args.slice(1);
                if (_placeId) placeId = _placeId;

                usersToSearch = await db.get(`tags.${tagName}`);
                if (!usersToSearch || usersToSearch.length === 0) {
                    await message.reactions.removeAll();
                    return message.reply('No users found with this tag!');
                }

            } else if (option === '--player') {
                const [playerName, _placeId] = args.slice(1);
                if (_placeId) placeId = _placeId;

                usersToSearch = [playerName];

            } else if (option === '--all') {
                if (args[1]) placeId = args[1];

                const allTags = await db.get('tags');
                if (!allTags) {
                    await message.reactions.removeAll();
                    return message.reply('No tags found in the database!');
                }

                Object.entries(allTags).forEach(([tag, tagUsers]) => {
                    tagUsers.forEach(user => {
                        usersToSearch.push(user);
                        usersWithTags[user] = tag;
                    });
                });

                if (usersToSearch.length === 0) {
                    await message.reactions.removeAll();
                    return message.reply('No users found with any tags!');
                }
            } else {
                await message.reactions.removeAll();
                return message.reply('Invalid option! Use `--tag`, `--player`, or `--all`.');
            }

            const usersResponse = await fetch('https://users.roblox.com/v1/usernames/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernames: usersToSearch }),
            });
            const usersData = await usersResponse.json();

            if (usersData.errors || usersData.errorMessage) {
                await message.reactions.removeAll();
                return message.reply('Error fetching users from Roblox API.');
            }

            const usersMap = usersData.data.reduce((map, user) => {
                map[user.id] = user.name;
                return map;
            }, {});

            const userIds = Object.keys(usersMap);
            const thumbnailResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(',')}&size=150x150&format=Png&isCircular=false`);
            const thumbnailData = await thumbnailResponse.json();

            const thumbnailsMap = thumbnailData.data.reduce((map, thumbnail) => {
                map[thumbnail.targetId] = thumbnail.imageUrl;
                return map;
            }, {});

            const servers = await findServers(placeId, thumbnailsMap);

            if (Object.keys(servers).length > 0) {
                Object.keys(servers).forEach(serverId => {
                    const usersInServer = servers[serverId].users;
                    let usernamesList = usersInServer.map(userId => {
                        const username = usersMap[userId];
                        if (option === '--all') {
                            const tag = usersWithTags[username];
                            return `[${tag}] ${username}`;
                        }
                        return username;
                    });

                    const playerCount = servers[serverId].playerCount;

                    const selectMenu = new MessageActionRow().addComponents(
                        new MessageSelectMenu()
                            .setCustomId(`select_player`)
                            .setPlaceholder('Select a player to view info')
                            .addOptions(usernamesList.map(username => ({
                                label: username,
                                value: username,
                            })))
                    );

                    const embed = {
                        title: `Player Count: ${playerCount}`,
                        description: `${usernamesList.join('\n')}\n\`\`\`Roblox.GameLauncher.joinGameInstance(${placeId}, "${serverId}")\`\`\``,
                    };

                    message.reply({ embeds: [embed], components: [selectMenu] });
                });
            } else {
                message.reply('No users found in any server.');
            }
        } catch (error) {
            console.error(error);
            message.reply('An error occurred while searching for the users.');
        } finally {
            await message.reactions.removeAll();
        }
    },
};

async function findServers(placeId, thumbnailsMap) {
    let allServers = [];
    let userToServerMap = {};
    let cursor = '';
    let foundAllServers = false;

    while (!foundAllServers) {
        const response = await fetch(`https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=100&cursor=${cursor}`);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            foundAllServers = true;
            break;
        }

        data.data.forEach(server => {
            const thumbnails = server.playerTokens.map(playerToken => ({
                token: playerToken,
                type: 'AvatarHeadshot',
                size: '150x150',
                requestId: server.id,
            }));
            allServers.push({ serverId: server.id, thumbnails, playerCount: `${server.playing}/${server.maxPlayers}` });
        });

        cursor = data.nextPageCursor;

        if (cursor) {
            console.log(`Next cursor: ${cursor}`);
        } else {
            console.log('No more pages.');
            foundAllServers = true;
        }
        
    }

    for (const server of allServers) {
        const thumbnailResponse = await fetch('https://thumbnails.roblox.com/v1/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(server.thumbnails),
        });
        const thumbnailData = await thumbnailResponse.json();

        thumbnailData.data.forEach(thumbnail => {
            const userId = Object.keys(thumbnailsMap).find(id => thumbnailsMap[id] === thumbnail.imageUrl);
            if (userId) {
                if (!userToServerMap[server.serverId]) {
                    userToServerMap[server.serverId] = { users: [], playerCount: server.playerCount };
                }
                userToServerMap[server.serverId].users.push(userId);
            }
        });
    }

    return userToServerMap;
}
