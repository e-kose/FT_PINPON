export const deleteUserSchema = {
	security : [{ bearerAuth: [] }],
	headers: {
		type: "object",
		properties: {
			"x-user-id": { type: "string" },
		},
		required: ["x-user-id"],
	},
	response: {
		200: {
			description: "User deleted successfully",
			type: "object",
			properties: {
				success: { type: "boolean", example: true },
				message: { type: "string", example: "User successfully deleted" },
			},
		},
		401: {
			description: "Unauthorized",
			type: "object",
			properties: {
				success: { type: "boolean", example: false },
				message: { type: "string", example: "Unauthorized" },
			},
		},
		403: {
			description: "Forbidden",
			type: "object",
			properties: {
				success: { type: "boolean", example: false },
				message: { type: "string", example: "Forbidden" },
			},
		},
		404: {
			description: "User not found",
			type: "object",
			properties: {
				success: { type: "boolean", example: false },
				message: { type: "string", example: "User not found" },
			},
		},
		500: {
			description: "Internal server error",
			type: "object",
			properties: {
				success: { type: "boolean", example: false },
				message: { type: "string", example: "Internal server error" },
			},
		},
	},
};
