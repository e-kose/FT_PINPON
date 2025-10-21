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
	if (!userId) return reply.code(400).send({ message: 'Missing user id header' });
	const res = app.friendshipService.acceptRequest(params.id, userId);
	return reply.send(res);
};

export const rejectFriendRequest = async (req: FastifyRequest, reply: FastifyReply) => {
	const app = req.server as any;
	const params = req.params as { id: number };
	const userId = (req.headers['x-user-id'] as string) ? parseInt(req.headers['x-user-id'] as string) : undefined;
	if (!userId) return reply.code(400).send({ message: 'Missing user id header' });
	const res = app.friendshipService.rejectRequest(params.id, userId);
	return reply.send(res);
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

export default {} as any;

