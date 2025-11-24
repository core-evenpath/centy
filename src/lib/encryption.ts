import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_SECRET_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_SECRET_KEY environment variable is not set');
    }
    if (key.length < 32) {
        throw new Error('ENCRYPTION_SECRET_KEY must be at least 32 characters');
    }
    return key;
}

function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

export function encrypt(plaintext: string): string {
    try {
        const masterKey = getEncryptionKey();
        const salt = crypto.randomBytes(SALT_LENGTH);
        const key = deriveKey(masterKey, salt);
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        const combined = Buffer.concat([
            salt,
            iv,
            authTag,
            Buffer.from(encrypted, 'hex')
        ]);

        return combined.toString('base64');
    } catch (error: any) {
        console.error('Encryption error:', error.message);
        throw new Error('Failed to encrypt data');
    }
}

export function decrypt(encryptedData: string): string {
    try {
        const masterKey = getEncryptionKey();
        const combined = Buffer.from(encryptedData, 'base64');

        const salt = combined.subarray(0, SALT_LENGTH);
        const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

        const key = deriveKey(masterKey, salt);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error: any) {
        console.error('Decryption error:', error.message);
        throw new Error('Failed to decrypt data - the data may be corrupted or the encryption key may have changed');
    }
}

export function hashForComparison(value: string): string {
    return crypto
        .createHash('sha256')
        .update(value)
        .digest('hex');
}

export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

export function generateVerifyToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(32);
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(randomBytes[i] % chars.length);
    }
    return result;
}

export function isEncrypted(data: string): boolean {
    try {
        const buffer = Buffer.from(data, 'base64');
        return buffer.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1;
    } catch {
        return false;
    }
}
