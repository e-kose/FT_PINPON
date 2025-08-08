export function parseDuration(str: string): number {
  const regex = /^(\d+)([smhd])$/;
  const match = str.match(regex);
  if (!match) throw new Error('Invalid duration format.');

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;               
    case 'm': return value * 60;          
    case 'h': return value * 60 * 60;     
    case 'd': return value * 24 * 60 * 60;
    default: throw new Error('Unknown time unit');
  }
}

export function generateRandom4Digit(): number {
  return Math.floor(1000 + Math.random() * 9000);
}