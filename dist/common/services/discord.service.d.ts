import type { APIEmbedField } from 'discord.js';
export declare class DiscordService {
    sendMessage(_message: {
        content?: string;
        fields?: APIEmbedField[];
    }): Promise<void>;
}
