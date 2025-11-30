import { FastifyInstance } from 'fastify';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  listFriendsHandler,
  listRequestsHandler,
  blockUserHandler,
  getBlockedHandler,
  unblockUserHandler,
  removeFriendHandler,
  listSentRequestsHandler,
  cancelSentRequestHandler,
} from '../controller/friendship.controller.js';
import { sendFriendSchema } from '../schemas/send.friend.schema.js';
import { requestParamsSchema } from '../schemas/request.params.schema.js';
import { listFriendsSchema, listRequestsSchema } from '../schemas/list.schemas.js';
import { blockSchema, unblockSchema, removeFriendSchema, getBlockedSchema } from '../schemas/block.schemas.js';
import { sentRequestsSchema } from '../schemas/sentRequests.schema.js';

export async function friendshipRoute(app: FastifyInstance) {
  app.post('/friend/request', { schema: sendFriendSchema }, sendFriendRequest);
  app.post('/friend/request/:id/accept', { schema: requestParamsSchema }, acceptFriendRequest);
  app.post('/friend/request/:id/reject', { schema: requestParamsSchema }, rejectFriendRequest);
  app.get('/friend/list', { schema: listFriendsSchema }, listFriendsHandler);
  app.get('/friend/requests', { schema: listRequestsSchema }, listRequestsHandler);
  app.post('/friend/block', { schema: blockSchema }, blockUserHandler);
  app.get('/friend/blocked', { schema: getBlockedSchema }, getBlockedHandler);
  app.delete('/friend/block/:id', { schema: requestParamsSchema }, unblockUserHandler);
  app.delete('/friend/remove/:id', { schema: requestParamsSchema }, removeFriendHandler);
  app.get('/friend/requests/sent', { schema: sentRequestsSchema }, listSentRequestsHandler);
  app.delete('/friend/request/:id', { schema: requestParamsSchema }, cancelSentRequestHandler);
}

export default {} as any;
