import bcrypt from 'bcrypt'

export async function hashTransaction(value:string) {
	return await bcrypt.hash(value, 10);
}

export async function checkHash(value : string | undefined, hashValue: string){
	return await bcrypt.compare(value as string, hashValue);
}