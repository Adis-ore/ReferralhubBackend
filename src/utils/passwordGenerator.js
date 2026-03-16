const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const numbers   = '0123456789';
const symbols   = '!@#$%^&*';
const all       = uppercase + lowercase + numbers + symbols;

export const generateRandomPassword = (length = 10) => {
  // Guarantee at least one of each character class
  let password = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = 4; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }
  // Shuffle
  return password.sort(() => Math.random() - 0.5).join('');
};

export const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'REF';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};
