import bcrypt from 'bcrypt'

export async function hashPassword(password:string) {
	return await bcrypt.hash(password, 10);
}

export async function checkPass(password : string, hashPass: string){

	return await bcrypt.compare(password, hashPass);
}