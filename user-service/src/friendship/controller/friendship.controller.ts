import { FastifyRequest, FastifyReply } from 'fastify';

export const sendFriendRequest = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const body = req.body as { toId?: number; toUsername?: string };
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ message: 'Missing user id header' });

	let targetId = body.toId;
	if (!targetId && body.toUsername) {
		const targetUser = app.userRepo.getUserByUsername(body.toUsername);
		if (!targetUser) return reply.code(404).send({ message: 'Target user not found' });
		targetId = targetUser.id;
	}
	if (!targetId) return reply.code(400).send({ message: 'Missing target identifier' });

	const res = app.friendshipService.sendRequest(userId, targetId);
	return reply.code(201).send({ id: res });
};

export const acceptFriendRequest = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const params = req.params as { id: number };
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ success: false, message: 'Missing user id header' });
	const res = app.friendshipService.acceptRequest(params.id, userId);
	return reply.code(200).send({ success: true, affected: res });
};

export const rejectFriendRequest = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const params = req.params as { id: number };
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ success: false, message: 'Missing user id header' });
	const res = app.friendshipService.rejectRequest(params.id, userId);
	return reply.code(200).send({ success: true, affected: res });
};

export const listFriendsHandler = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ message: 'Missing user id header' });
	const res = app.friendshipService.listFriends(userId);
	return reply.code(200).send({ success: true, friends: res });
};

export const listRequestsHandler = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ message: 'Missing user id header' });
	const res = app.friendshipService.listRequests(userId);
	return reply.code(200).send({ success: true, requests: res });
};

export const blockUserHandler = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ success: false, message: 'Missing user id header' });
	const body = req.body as { blocked_id: number };
	if (!body?.blocked_id) return reply.code(400).send({ success: false, message: 'Missing blocked_id' });
	const res = app.friendshipService.blockUser(userId, body.blocked_id);
	return reply.code(201).send({ success: true, id: res });
};

export const getBlockedHandler = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ success: false, message: 'Missing user id header' });
	const res = app.friendshipService.getBlockedList(userId);
	return reply.code(200).send({ success: true, blocked: res });
};

export const listSentRequestsHandler = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ success: false, message: 'Missing user id header' });
	const res = app.friendshipService.listSentRequests(userId);
	return reply.code(200).send({ success: true, sent: res });
};

export const cancelSentRequestHandler = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ success: false, message: 'Missing user id header' });
	const params = req.params as { id: number };
	if (!params?.id) return reply.code(400).send({ success: false, message: 'Missing request id' });
	const res = app.friendshipService.cancelSentRequest(userId, params.id);
	return reply.code(200).send({ success: true, affected: res });
};

export const unblockUserHandler = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ success: false, message: 'Missing user id header' });
	const params = req.params as { id: string };
	if (!params?.id) return reply.code(400).send({ success: false, message: 'Missing blocked_id' });
	const blockedId = parseInt(params.id);
	if (isNaN(blockedId)) return reply.code(400).send({ success: false, message: 'Invalid blocked_id' });
	const res = app.friendshipService.unblockUser(userId, blockedId);
	return reply.code(200).send({ success: true, affected: res });
};

export const removeFriendHandler = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ success: false, message: 'Missing user id header' });
	const params = req.params as { id: string };
	if (!params?.id) return reply.code(400).send({ success: false, message: 'Missing friend_id' });
	const friendId = parseInt(params.id);
	if (isNaN(friendId)) return reply.code(400).send({ success: false, message: 'Invalid friend_id' });
	const res = app.friendshipService.removeFriend(userId, friendId);
	return reply.code(200).send({ success: true, affected: res });
};

export default {} as any;

