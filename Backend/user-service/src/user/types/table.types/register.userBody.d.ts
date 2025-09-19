export type registerUserBody = {
	username : string,
	password? : string,
	email : string,
	profile : {
		full_name : string,
		avatar_url : string,
		bio : string
	}
}