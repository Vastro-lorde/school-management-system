/**
 * Abstract base class for email providers.
 * @abstract
 */
class EmailProvider {
    /**
     * Sends a password reset email.
     * @param {string} to - The recipient's email address.
     * @param {string} token - The password reset token.
     * @returns {Promise<void>}
     */
    async sendPasswordResetEmail(to, token) {
        throw new Error('Method "sendPasswordResetEmail" must be implemented.');
    }

    /**
     * Sends a registration invitation email.
     * @param {string} to - The recipient's email address.
     * @param {string} token - The registration token.
     * @returns {Promise<void>}
     */
    async sendRegistrationEmail(to, token) {
        throw new Error('Method "sendRegistrationEmail" must be implemented.');
    }

    /**
     * Sends an invite email.
     * @param {string} to - The recipient's email address.
     * @param {string} token - The invite token.
     * @returns {Promise<void>}
     */
    async sendInviteEmail(to, token) {
        throw new Error('Method "sendInviteEmail" must be implemented.');
    }
}

export default EmailProvider;
