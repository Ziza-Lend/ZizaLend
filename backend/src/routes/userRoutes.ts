import { Router } from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { requireJwtAuth } from '../middleware/jwtAuth.js';
import { validateBody } from '../middleware/validation.js';
import { updateUserProfileSchema } from '../schemas/userSchemas.js';

const router = Router();

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned, creating an empty profile on first access.
 *       401:
 *         description: Missing or invalid JWT
 */
router.get('/profile', requireJwtAuth, getUserProfile);

/**
 * @swagger
 * /user/profile:
 *   patch:
 *     summary: Update the authenticated user's profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               displayName:
 *                 type: string
 *                 nullable: true
 *               email:
 *                 type: string
 *                 format: email
 *                 nullable: true
 *               phone:
 *                 type: string
 *                 nullable: true
 *               locale:
 *                 type: string
 *                 nullable: true
 *                 example: en-US
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Updated user profile
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid JWT
 */
router.patch('/profile', requireJwtAuth, validateBody(updateUserProfileSchema), updateUserProfile);

export default router;
