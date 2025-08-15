
export const updateUserSchema = {
	security : [{ bearerAuth: [] }],
	headers: {
		type: "object",
		properties: {
			"x-user-id": { type: "string" },
		},
		required: ["x-user-id"],
	},
	body: {
		type: "object",
		properties: {
			email: { type: "string", format: "email" },
			name: { type: "string" },
			profile : {
				type: "object",
				properties: {
					full_name: { type: "string" },
					avatar_url: { type: "string", format: "uri" },
					bio: { type: "string" },
				},
			},
		},
	},
	response: {
		200: {
			description: "User updated successfully",
			type: "object",
			properties: {
				success: { type: "boolean", example: true },
				message: { type: "string", example: "User successfully updated" },
			},
		},
		400: {
			description: "Bad request",
			type: "object",
			properties: {
				success: { type: "boolean", example: false },
				message: { type: "string", example: "Bad request" },
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
