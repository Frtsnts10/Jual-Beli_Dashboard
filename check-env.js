const key = process.env.FIREBASE_PRIVATE_KEY || '';
console.log("Key length:", key.length);
console.log("Starts with JSON?", key.trim().startsWith('{'));
