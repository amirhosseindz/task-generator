import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Service for managing Jira credentials encryption/decryption
 */
class MCPCredentialsService {
  constructor() {
    const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      throw new Error('CREDENTIAL_ENCRYPTION_KEY is not set in environment variables');
    }

    // Use a 32-byte key for AES-256
    this.algorithm = 'aes-256-gcm';
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }

  /**
   * Encrypt credentials
   * @param {Object} credentials - { email, apiToken, domain }
   * @returns {Object} Encrypted credentials with iv and authTag
   */
  encrypt(credentials) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    const plaintext = JSON.stringify(credentials);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt credentials
   * @param {Object} encryptedData - { encrypted, iv, authTag }
   * @returns {Object} Decrypted credentials { email, apiToken, domain }
   */
  decrypt(encryptedData) {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt credentials: ' + error.message);
    }
  }

  /**
   * Store credentials in session (encrypted)
   * @param {Object} session - Express session object
   * @param {Object} credentials - { email, apiToken, domain }
   */
  storeInSession(session, credentials) {
    const encrypted = this.encrypt(credentials);
    session.jiraCredentials = encrypted;
    session.jiraCredentialsTimestamp = Date.now();
  }

  /**
   * Retrieve credentials from session (decrypted)
   * @param {Object} session - Express session object
   * @returns {Object|null} Decrypted credentials or null if not found
   */
  getFromSession(session) {
    if (!session.jiraCredentials) {
      return null;
    }

    try {
      return this.decrypt(session.jiraCredentials);
    } catch (error) {
      // If decryption fails, clear invalid credentials
      delete session.jiraCredentials;
      delete session.jiraCredentialsTimestamp;
      return null;
    }
  }

  /**
   * Clear credentials from session
   * @param {Object} session - Express session object
   */
  clearFromSession(session) {
    delete session.jiraCredentials;
    delete session.jiraCredentialsTimestamp;
  }

  /**
   * Check if credentials exist and are valid
   * @param {Object} session - Express session object
   * @returns {boolean} True if credentials exist
   */
  hasCredentials(session) {
    return !!session.jiraCredentials;
  }
}

export default new MCPCredentialsService();
