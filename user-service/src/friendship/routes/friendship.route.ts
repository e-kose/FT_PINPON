import { FastifyInstance } from 'fastify';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  listFriendsHandler,
  listRequestsHandler,
} from '../controller/friendship.controller.js';
import { sendFriendSchema } from '../schemas/send.friend.schema.js';
import { requestParamsSchema } from '../schemas/request.params.schema.js';
import { listFriendsSchema, listRequestsSchema } from '../schemas/list.schemas.js';

export async function friendshipRoute(app: FastifyInstance) {
  app.post('/friend/request', { schema: sendFriendSchema }, sendFriendRequest);
  app.post('/friend/request/:id/accept', { schema: requestParamsSchema }, acceptFriendRequest);
  app.post('/friend/request/:id/reject', { schema: requestParamsSchema }, rejectFriendRequest);
  app.get('/friend/list', { schema: listFriendsSchema }, listFriendsHandler);
  app.get('/friend/requests', { schema: listRequestsSchema }, listRequestsHandler);
}

export default {} as any;
