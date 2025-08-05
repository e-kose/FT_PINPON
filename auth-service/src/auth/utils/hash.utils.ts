import bcrypt from 'bcrypt'

export async function hashTransaction(value:string) {
	return await bcrypt.hash(value, 10);
}

export async function checkPass(password : string, hashPass: string){

	return await bcrypt.compare(password, hashPass);
}