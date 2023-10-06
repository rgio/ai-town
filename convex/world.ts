import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import {
  internalMutation,
} from './_generated/server';
import { makeWorld } from './init';


export const createWorld = internalMutation({
    args: { mapId: v.string(), characterIds: v.array(v.string()) },
    handler: async (ctx: any, { mapId, characterIds }) => {
        console.log("createWorld");
        console.log(`ctx: ${JSON.stringify(ctx)}`);
        const worldId = await makeWorld(ctx.db, false);
        const characters = await Promise.all(characterIds.map((id) => ctx.db.get(id)));
        console.log(`characters: ${JSON.stringify(characters)}`);

        const playersByName: Record<string, Id<'players'>> = {};
        for (const character of characters) {
            const name = character.name; // TODO: this is wrong, should be player.name (from characterData) but we don't have access to that here
            const position = { x: 10, y: 10 } // TODO: also from characterData;
            const characterId = character._id;
            const playerId = await ctx.db.insert('players', {
                name,
                worldId,
                characterId,
            });
            const agentId = await ctx.db.insert('agents', {
                playerId,
                scheduled: false,
                thinking: false,
                worldId,
                nextWakeTs: Date.now(),
                lastWakeTs: Date.now(),
            });
            await ctx.db.patch(playerId, { agentId });
            await ctx.db.insert('journal', {
                playerId,
                data: {
                type: 'stopped',
                reason: 'idle',
                pose: {
                    orientation: 0,
                    position: position ?? { x: 1, y: 1 + playersByName.length },
                },
                },
            });
            playersByName[name] = playerId;
        }

    },
});

export default createWorld;