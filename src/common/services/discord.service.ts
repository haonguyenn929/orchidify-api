import { Injectable } from '@nestjs/common'
import type { APIEmbedField } from 'discord.js'

@Injectable()
export class DiscordService {
  async sendMessage(_message: { content?: string; fields?: APIEmbedField[] }): Promise<void> {
    return
  }
}
