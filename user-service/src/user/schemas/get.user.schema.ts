export const getUserSchema = {
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
			description: "User found",
			type: "object",
			properties: {
				success: { type: "boolean", example: true },
				data: {
					type: "object",
					properties: {
						id: { type: "string" },
						email: { type: "string", format: "email" },
						name: { type: "string" },
						profile: {
							type: "object",
							properties: {
								full_name: { type: "string" },
								avatar_url: { type: "string", format: "uri" },
								bio: { type: "string" },
							},
						},
					},
				},
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
