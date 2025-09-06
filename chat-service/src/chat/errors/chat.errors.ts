import createError from "@fastify/error";

export const chatNotFound = createError(
	"CHAT_NOT_FOUND",
	"The requested message could not be found.",
	404
)