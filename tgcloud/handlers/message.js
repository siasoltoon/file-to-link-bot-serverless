import { api, db } from 'sdk';
import { users, fileRecords, fileRequests } from '../schema.js';

function getIncomingFile(message) {
  if (message.document) return { file: message.document, kind: 'document' };
  if (message.video) return { file: message.video, kind: 'video' };
  if (message.audio) return { file: message.audio, kind: 'audio' };
  if (message.animation) return { file: message.animation, kind: 'animation' };
  if (message.voice) return { file: message.voice, kind: 'voice' };
  if (message.photo?.length) return { file: message.photo[message.photo.length - 1], kind: 'photo' };
  return null;
}

export default async function (message) {
  if (!message?.chat?.id || !message.from?.id) return;
  const chatId = message.chat.id;
  const userId = message.from.id;
  if (message.chat.type === 'group' || message.chat.type === 'supergroup') return;

  await db.insert(users).values({ userId, lastSeenAt: new Date() })
    .onConflictDoUpdate({ target: users.userId, set: { lastSeenAt: new Date() } }).run();

  const text = (message.text ?? '').trim();
  if (text === '/start') {
    await api.sendMessage({
      chat_id: chatId,
      text: 'File-to-Link Serverless is initialized. Send a file to record its Telegram metadata. Upload to object storage and public download links are not connected yet.'
    });
    return;
  }

  const incoming = getIncomingFile(message);
  if (incoming) {
    const [record] = await db.insert(fileRecords).values({
      ownerUserId: userId,
      telegramFileId: incoming.file.file_id,
      fileName: incoming.file.file_name ?? null,
      mimeType: incoming.file.mime_type ?? null,
      fileSize: incoming.file.file_size ?? null,
      status: 'metadata_only',
    }).returning().run();

    await api.sendMessage({
      chat_id: chatId,
      text: `File metadata recorded as #${record.id} (${incoming.kind}). No bytes were transferred and no public link was created; an external storage worker is still required.`
    });
    return;
  }

  await db.insert(fileRequests).values({ userId, requestType: 'message', status: 'received' }).run();
  await api.sendMessage({ chat_id: chatId, text: 'Message recorded. Send a document, photo, video, audio, animation, or voice message to record its metadata.' });
}
