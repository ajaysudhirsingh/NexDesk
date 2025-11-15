/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             username: "admin"
 *             password: "admin123"
 *             client_code: "031210"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/setup-totp:
 *   post:
 *     summary: Setup TOTP (Google Authenticator) for superadmin
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TOTP setup initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 qr_code:
 *                   type: string
 *                   description: Base64 encoded QR code image
 *                 secret:
 *                   type: string
 *                   description: TOTP secret for manual entry
 *       403:
 *         description: Only superadmin users can setup TOTP
 *       400:
 *         description: TOTP is already enabled
 */

/**
 * @swagger
 * /api/auth/verify-totp-setup:
 *   post:
 *     summary: Verify and enable TOTP setup
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totp_code:
 *                 type: string
 *                 description: 6-digit TOTP code from authenticator app
 *             required:
 *               - totp_code
 *     responses:
 *       200:
 *         description: TOTP verification enabled successfully
 *       400:
 *         description: TOTP setup not initiated or missing code
 *       401:
 *         description: Invalid TOTP code
 *       403:
 *         description: Only superadmin users can setup TOTP
 */

/**
 * @swagger
 * /api/auth/totp-status:
 *   get:
 *     summary: Check TOTP status for current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TOTP status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totp_enabled:
 *                   type: boolean
 *                   description: Whether TOTP is enabled
 *                 totp_setup_required:
 *                   type: boolean
 *                   description: Whether TOTP setup is required
 *       403:
 *         description: Only superadmin users can check TOTP status
 */