import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WebhookService {
  async sendAction(data: {
    keyName: string;
    ip: string;
    timestamp: number;
    username: string;
  }) {
    const webhook = process.env.DISCORD_WEBHOOK;

    const embed = {
      title: '🔔 Nova Ação Recebida',
      color: 0x5865f2,
      fields: [
        { name: '🔑 Key Usada', value: data.keyName, inline: true },
        { name: '📌 IP', value: data.ip, inline: true },
        {
          name: '⏱ Timestamp',
          value: `<t:${Math.floor(data.timestamp / 1000)}:F>`,
          inline: false,
        },
        { name: '👤 Usuário', value: data.username, inline: true },
      ],
      footer: {
        text: 'Roblox Secure API • NestJS',
      },
      timestamp: new Date().toISOString(),
    };

    if (!webhook) {
      throw new Error('DISCORD_WEBHOOK environment variable is not defined');
    }

    await axios.post(webhook, {
      username: 'Roblox API',
      embeds: [embed],
    });
  }
}
