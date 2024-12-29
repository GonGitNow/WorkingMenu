const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const user = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            verificationToken,
            verificationExpires,
            isVerified: false
        });

        await user.save();

        // Send verification email with mobile deep link and HTML formatting
        await sendEmail({
            to: email,
            subject: 'Welcome to MenuScribe - Verify Your Email',
            text: `Welcome to MenuScribe! Please verify your email by copying and pasting this link in your browser: menuscribe://verify-email/${verificationToken}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #007AFF;">Welcome to MenuScribe!</h2>
                    <p>Hi ${firstName},</p>
                    <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
                    <div style="margin: 30px 0;">
                        <a href="menuscribe://verify-email/${verificationToken}" 
                           style="background-color: #007AFF; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                        menuscribe://verify-email/${verificationToken}
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                    </p>
                </div>
            `
        });

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Verify Email
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            verificationToken: token,
            verificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({ message: 'Email verification failed', error: error.message });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();

        // Send reset email with mobile deep link and HTML formatting
        await sendEmail({
            to: email,
            subject: 'Reset your MenuScribe password',
            text: `To reset your password, copy and paste this link in your browser: menuscribe://reset-password/${resetToken}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #007AFF;">Reset Your MenuScribe Password</h2>
                    <p>You requested to reset your password. Click the link below to proceed:</p>
                    <div style="margin: 30px 0;">
                        <a href="menuscribe://reset-password/${resetToken}" 
                           style="background-color: #007AFF; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
                        menuscribe://reset-password/${resetToken}
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
                    </p>
                </div>
            `
        });

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({ message: 'Failed to process password reset', error: error.message });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
});

// Update Profile
router.put('/profile', async (req, res) => {
    try {
        const { userId } = req.user; // From JWT middleware
        const { firstName, lastName, email } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email && email !== user.email) {
            // If email is being changed, require re-verification
            user.email = email;
            user.isVerified = false;
            user.verificationToken = crypto.randomBytes(32).toString('hex');
            user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            // Send new verification email with mobile deep link
            await sendEmail({
                to: email,
                subject: 'Verify your new email',
                text: `Please verify your new email by opening this link in your mobile app: menuscribe://verify-email/${user.verificationToken}`
            });
        }

        await user.save();

        res.json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        logger.error('Profile update error:', error);
        res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
});

module.exports = router; 