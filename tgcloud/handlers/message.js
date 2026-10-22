import { api, db } from 'sdk';
import { users, fileRequests } from '../schema.js';

export default async function (message, ctx) {
  if (!message?.chat?.id) return;
  const chatId = message.chat.id;
  const userId = message.from?.id;
  if (!userId || message.chat.type === 'group' || message.chat.type === 'supergroup') return;

  await db.insert(users).values({ userId, lastSeenAt: new Date() })
    .onConflictDoUpdate({ target: users.userId, set: { lastSeenAt: new Date() } }).run();

  const text = (message.text ?? '').trim();
  if (text === '/start') {
    await api.sendMessage({
      chat_id: chatId,
      text: 'File-to-Link Serverless is initialized for metadata only. Upload/transfer and download-link generation are not connected yet.'
    });
    return;
  }

  await db.insert(fileRequests).values({
    userId,
    requestType: message.document ? 'document' : (message.photo ? 'photo' : 'message'),
    status: 'received',
  }).run();

  await api.sendMessage({
    chat_id: chatId,
    text: 'Request recorded. File transfer, storage upload, and download-link creation are not enabled until a secure external worker/API is connected.'
  });
}
