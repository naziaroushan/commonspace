import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { UNIQUE_VIOLATION } from 'pg-error-constants';
import * as passport from 'passport';
import * as passportGoogle from 'passport-google-oauth20';
import * as passportJWT from 'passport-jwt';
import * as passportLocal from 'passport-local';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import GoogleTokenStrategy from './passport_strategies/GoogleTokenStrategy';
import path from 'path';
import * as uuid from 'uuid';

import {
    authenticateOAuthUser,
    createUserWithPassword,
    findUserWithPassword,
    findUserById,
    User,
    changeUserPassword,
    UnverifiedUserError
} from './datastore/user';
import DbPool from './database';

import dotenv from 'dotenv';
import { EntityAlreadyExists } from './datastore/utils';
dotenv.config({
    path: process.env.DOTENV_CONFIG_DIR ? path.join(process.env.DOTENV_CONFIG_DIR, '.env') : ''
});

const FROM_STRING = 'CommonSpace <commonspace@sidewalklabs.com>';

const LocalStrategy = passportLocal.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;
const GoogleStrategy = passportGoogle.Strategy;
const JwtStrategy = passportJWT.Strategy;
const MAX_PASSWORD_LENGTH = 1000;
const MIN_PASSWORD_LENGTH = 7;
const SPECIAL_CHARACTERS = ['!', '@', '#', '$', '%', '^', '&', '*', '?'];

const SMTP_TRANSPORT = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
    }
});

export async function saveTokenForEmailVerification(
    pool: Pool,
    email: string,
    token: string
): Promise<void> {
    const query = `INSERT INTO account_verification (user_id, token)
                   SELECT user_id, $1
                   FROM users WHERE email = $2
                   ON CONFLICT (user_id)
                   DO
                     UPDATE
                     SET token = $3
                   RETURNING token`;
    const values = [token, email, token];
    try {
        await pool.query(query, values);
    } catch (error) {
        console.error(`[query ${query}][values ${values}] ${error}`);
        throw error;
    }
}

export async function saveTokenForPasswordReset(
    pool: Pool,
    email: string,
    token: string
): Promise<void> {
    const query = `INSERT INTO password_reset (email, token)
                   VALUES ($1, $2)
                   ON CONFLICT (email)
                   DO
                     UPDATE
                     SET token = $3`;
    const values = [email, token, token];
    try {
        await pool.query(query, values);
    } catch (error) {
        console.error(`[query ${query}][values ${values}] ${error}`);
        throw error;
    }
}

async function removePasswordResetToken(pool: Pool, token: string): Promise<void> {
    const query = `DELETE FROM password_reset
                   WHERE token = $1`;
    const values = [token];
    try {
        await pool.query(query, values);
    } catch (error) {
        console.error(`[query ${query}][values ${values}] ${error}`);
        throw error;
    }
}

export async function emailForResetToken(pool: Pool, token: string): Promise<string> {
    const query = `SELECT email from password_reset
                   WHERE token = $1`;
    const values = [token];
    try {
        const { rowCount, rows } = await pool.query(query, values);
        if (rowCount !== 1) {
            throw new Error(`Invalid token`);
        }
        const { email } = rows[0];
        return email;
    } catch (error) {
        console.error(`[query ${query}][values ${values}] ${error}`);
        throw error;
    }
}

export async function accountIsVerified(pool: Pool, userId: string): Promise<boolean> {
    const query = `SELECT is_verified
                   FROM users urs
                   WHERE urs.user_id = $1`;
    const values = [userId];
    try {
        const { rowCount, rows } = await pool.query(query, values);
        if (rowCount !== 1) {
            return false;
        }
        return rows[0].verified;
    } catch (error) {
        console.error(`[query ${query}][values ${values}] ${error}`);
        throw error;
    }
}

export async function validateEmail(pool: Pool, token: string): Promise<string | null> {
    // TODO: start here tuesday morning
    const query = `UPDATE users
                   SET is_verified = TRUE
                   WHERE user_id IN (
                           SELECT user_id
                           FROM account_verification
                           WHERE token = $1
                       )
                   RETURNING user_id`;
    const values = [token];
    try {
        const { rows, rowCount } = await pool.query(query, values);
        if (rowCount === 1) {
            return rows[0].user_id;
        }
        return null;
    } catch (error) {
        console.error(`[query ${query}][values ${values}] ${error}`);
        throw error;
    }
}

export async function resetPassword(pool: Pool, password: string, token: string): Promise<void> {
    const email = await emailForResetToken(DbPool, token);
    if (email) {
        checkPasswordRequirements(password);
        await changeUserPassword(DbPool, email, password);
        await removePasswordResetToken(pool, token);
    }
    return;
}

const httpRegex = /^http:/;
export async function sendEmailResetLink(host: string, email: string, token: string) {
    if (!httpRegex.exec(host)) {
        host = process.env.NODE_ENV === 'development' ? 'http://' + host : 'https://' + host;
    }
    const link = `${host}/reset_password?token=${token}`;
    const html = `Hello ${email},<br><hr>Please click on the link below to reset your CommonSpace password.<br><hr><a href="${link}">Click Here To Reset</a>`;
    const mailOptions: nodemailer.SendMailOptions = {
        from: FROM_STRING,
        to: email,
        subject: 'Password reset for CommonSpace',
        html
    };
    try {
        await SMTP_TRANSPORT.sendMail(mailOptions);
    } catch (error) {
        console.error(`[mailOptions ${JSON.stringify(mailOptions)}] [mailUrl ${link}] ${error}`);
        throw error;
    }
}

export async function sendSignupVerificationEmail(host: string, email: string, token: string) {
    if (!httpRegex.exec(host)) {
        host = process.env.NODE_ENV === 'development' ? 'http://' + host : 'https://' + host;
    }
    const link = encodeURI(`${host}/verify?token=${token}`);
    const html = `Hello ${email},<br><br>Please click on the link below to validate your email for CommonSpace.<br><br><a href=${link}>Click here</a>`;
    const mailOptions: nodemailer.SendMailOptions = {
        from: FROM_STRING,
        to: email,
        subject: 'Validate your email with CommonSpace',
        html
    };
    try {
        await SMTP_TRANSPORT.sendMail(mailOptions);
    } catch (error) {
        console.error(`[mailOptions ${JSON.stringify(mailOptions)}] [mailUrl ${link}] ${error}`);
        throw error;
    }
}

export class PasswordValidationError extends Error {}

export function checkPasswordRequirements(password: string): string {
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new PasswordValidationError(
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
        );
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        throw new PasswordValidationError(
            `Password must be less than ${MAX_PASSWORD_LENGTH} characters long`
        );
    }
    const specialCharacterPresent = SPECIAL_CHARACTERS.reduce((acc, curr) => {
        if (acc) {
            return acc;
        }
        return password.indexOf(curr) !== -1;
    }, false);
    if (!specialCharacterPresent) {
        throw new PasswordValidationError(
            `Password must contain one special character from: ${JSON.stringify(
                SPECIAL_CHARACTERS
            )}`
        );
    }
    return password;
}

const signupStrategy = new LocalStrategy(
    { passReqToCallback: true, usernameField: 'email' },
    async (req, email, password, done) => {
        try {
            const user = {
                email,
                password: checkPasswordRequirements(password),
                userId: uuid.v4(),
                name: ''
            };
            const userId = await createUserWithPassword(DbPool, user);
            return done(null, { user_id: userId, email });
        } catch (error) {
            if (error instanceof EntityAlreadyExists) {
                return done(new Error(`Account already exists for ${email}`));
            }
            console.error(
                `[body ${JSON.stringify(req.body)}][params: ${JSON.stringify(req.params)}] ${error}`
            );
            return done(error, null);
        }
    }
);

const loginStrategy = new LocalStrategy(
    { passReqToCallback: true, usernameField: 'email' },
    async (req, email, password, done) => {
        try {
            const { user_id } = await findUserWithPassword(DbPool, email, password);
            return done(null, { user_id });
        } catch (err) {
            console.error(
                `[body ${JSON.stringify(req.body)}][params: ${JSON.stringify(req.params)}] ${err}`
            );
            return done(err, null);
        }
    }
);

const extractAuthBearer = ExtractJwt.fromAuthHeaderAsBearerToken();

function jwtFromRequest(req: Request) {
    if (req.cookies && req.cookies.commonspacejwt) {
        return req.cookies.commonspacejwt;
    } else {
        return extractAuthBearer(req);
    }
}

const jwtOptions: passportJWT.StrategyOptions = {
    jwtFromRequest,
    secretOrKey: process.env.JWT_SECRET
};

const jwtStrategy = new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    const { user_id: userId } = jwt_payload;
    try {
        const user = await findUserById(DbPool, userId);
        return done(null, { user_id: userId });
    } catch (error) {
        return done(error, null);
    }
});

export async function addToBlackList(pool: Pool, userId: string, req: Request): Promise<void> {
    const token = jwtFromRequest(req);
    const query = `INSERT INTO public.token_blacklist (user_id, token)
                   VALUES ($1, $2)`;
    const values = [userId, token];
    try {
        await pool.query(query, values);
    } catch (error) {
        // by swallowing this error, we make the method idempotent
        if (error.code === UNIQUE_VIOLATION && error.constraint === 'token_blacklist_pkey') {
            return;
        }
        console.error(`[sql ${query}] [values ${JSON.stringify(values)}] ${error}`);
        throw error;
    }
}

export async function tokenIsBlacklisted(pool: Pool, req: Request): Promise<boolean> {
    const token = jwtFromRequest(req);
    const date = await tokenBlacklistDate(pool, token);
    return date !== null;
}

export async function tokenBlacklistDate(pool: Pool, token: string): Promise<string | null> {
    const query = `SELECT blacklisted_at
                   FROM public.token_blacklist
                   WHERE token = $1`;
    const values = [token];
    try {
        const { rows, rowCount } = await pool.query(query, values);
        if (rowCount === 1) {
            const { blacklisted_at } = rows[0];
            return blacklisted_at;
        }
        return null;
    } catch (error) {
        console.error(`[sql ${query}] [values ${JSON.stringify(values)}] ${error}`);
        throw error;
    }
}

const init = (mode: string) => {
    return (passport: any) => {
        if (mode === 'staging' || mode === 'production') {
            const clientID = process.env.GOOGLE_AUTH_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET;
            const host = process.env.SERVER_HOSTNAME;
            const callbackURL = `${host}/auth/google/callback`;
            const googleOAuthStrategy = new GoogleStrategy(
                {
                    clientID,
                    clientSecret,
                    callbackURL,
                    passReqToCallback: true
                },
                async function(request, accessToken, refreshToken, profile, done) {
                    const email = profile.emails[0].value;
                    try {
                        const userId = await authenticateOAuthUser(DbPool, email);
                        request.user = { email, user_id: userId };
                        return done(null, request.user);
                    } catch (error) {
                        return done(error, null);
                    }
                }
            );

            passport.use('google-oauth', googleOAuthStrategy);
            const googleTokenStrategy = new GoogleTokenStrategy(
                { tokenFromRequest: 'header', passReqToCallback: true },
                async (request, email, done) => {
                    try {
                        const userId = await authenticateOAuthUser(DbPool, email);
                        request.user = { email, user_id: userId };
                        return done(null, request.user, request);
                    } catch (error) {
                        return done(error, null, request);
                    }
                }
            );
            passport.use('google-token', googleTokenStrategy);
        }
        passport.use('signup', signupStrategy);
        passport.use('login', loginStrategy);
        passport.use('jwt', jwtStrategy);
    };
};

export default init(process.env.NODE_ENV);
