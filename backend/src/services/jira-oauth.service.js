import crypto from 'crypto';
import dotenv from 'dotenv';
import { validateOAuthTokens, isTokenExpired, generateOAuthState } from '../utils/jira.utils.js';

dotenv.config();

/**
 * Jira OAuth 2.1 service for Atlassian authentication
 */
class JiraOAuthService {
  constructor() {
    this.clientId = process.env.ATLASSIAN_CLIENT_ID;
    this.clientSecret = process.env.ATLASSIAN_CLIENT_SECRET;
    this.redirectUri = process.env.OAUTH_REDIRECT_URI || 'http://localhost:5000/api/jira/oauth/callback';
    this.encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.SESSION_SECRET || 'default-encryption-key';
    
    // Atlassian OAuth endpoints
    this.authorizationUrl = 'https://auth.atlassian.com/authorize';
    this.tokenUrl = 'https://auth.atlassian.com/oauth/token';
  }

  /**
   * Encrypt sensitive data
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text
   */
  encrypt(text) {
    if (!text) return null;
    
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedText - Encrypted text
   * @returns {string} Decrypted text
   */
  decrypt(encryptedText) {
    if (!encryptedText) return null;
    
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Store encrypted OAuth tokens in session
   * @param {Object} session - Express session object
   * @param {Object} tokens - OAuth tokens
   */
  storeTokens(session, tokens) {
    if (!session) {
      throw new Error('Session is required');
    }

    if (!validateOAuthTokens(tokens)) {
      throw new Error('Invalid token structure');
    }

    // Encrypt tokens before storing
    session.jiraOAuth = {
      access_token: this.encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? this.encrypt(tokens.refresh_token) : null,
      expires_at: tokens.expires_at || Date.now() + (3600 * 1000), // Default 1 hour
      scope: tokens.scope || '',
      token_type: tokens.token_type || 'Bearer',
    };
  }

  /**
   * Get decrypted OAuth tokens from session
   * @param {Object} session - Express session object
   * @returns {Object|null} Decrypted tokens or null
   */
  getTokens(session) {
    if (!session || !session.jiraOAuth) {
      return null;
    }

    const encrypted = session.jiraOAuth;
    const accessToken = this.decrypt(encrypted.access_token);
    
    if (!accessToken) {
      return null;
    }

    return {
      access_token: accessToken,
      refresh_token: encrypted.refresh_token ? this.decrypt(encrypted.refresh_token) : null,
      expires_at: encrypted.expires_at,
      scope: encrypted.scope,
      token_type: encrypted.token_type,
    };
  }

  /**
   * Clear OAuth tokens from session
   * @param {Object} session - Express session object
   */
  clearTokens(session) {
    if (session) {
      delete session.jiraOAuth;
    }
  }

  /**
   * Initiate OAuth flow - generate authorization URL
   * @param {string} state - CSRF state parameter
   * @param {string} scope - OAuth scopes (default: read and write Jira)
   * @returns {string} Authorization URL
   */
  initiateOAuthFlow(state, scope = 'read:jira-work write:jira-work manage:jira-project') {
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: this.clientId || '',
      scope: scope,
      redirect_uri: this.redirectUri,
      state: state,
      response_type: 'code',
      prompt: 'consent',
    });

    return `${this.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback - exchange authorization code for tokens
   * @param {string} code - Authorization code from callback
   * @returns {Promise<Object>} OAuth tokens
   */
  async handleOAuthCallback(code) {
    if (!code) {
      throw new Error('Authorization code is required');
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('OAuth client credentials not configured');
    }

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OAuth token exchange failed: ${error.error || response.statusText}`);
      }

      const tokens = await response.json();

      // Calculate expiration time
      const expiresAt = Date.now() + (tokens.expires_in * 1000);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope,
        token_type: tokens.token_type || 'Bearer',
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Refresh expired access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New OAuth tokens
   */
  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('OAuth client credentials not configured');
    }

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Token refresh failed: ${error.error || response.statusText}`);
      }

      const tokens = await response.json();

      // Calculate expiration time
      const expiresAt = Date.now() + (tokens.expires_in * 1000);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken, // Use new refresh token if provided
        expires_at: expiresAt,
        scope: tokens.scope,
        token_type: tokens.token_type || 'Bearer',
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   * @param {Object} session - Express session object
   * @returns {Promise<string|null>} Valid access token or null
   */
  async getValidAccessToken(session) {
    const tokens = this.getTokens(session);
    
    if (!tokens) {
      return null;
    }

    // Check if token is expired
    if (isTokenExpired(tokens)) {
      // Try to refresh if we have a refresh token
      if (tokens.refresh_token) {
        try {
          const newTokens = await this.refreshAccessToken(tokens.refresh_token);
          this.storeTokens(session, newTokens);
          return newTokens.access_token;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          this.clearTokens(session);
          return null;
        }
      } else {
        // No refresh token, clear session
        this.clearTokens(session);
        return null;
      }
    }

    return tokens.access_token;
  }
}

export default new JiraOAuthService();
