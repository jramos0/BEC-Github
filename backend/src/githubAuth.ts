import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(session({ 
  secret: process.env.SESSION_SECRET as string, 
  resave: false, 
  saveUninitialized: true 
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`,
  },
  (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: Express.User | null) => void
  ) => {
    return done(null, profile);
  }
));

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback', passport.authenticate('github', {
  successRedirect: `${process.env.FRONTEND_URL}/`,
  failureRedirect: `${process.env.FRONTEND_URL}/login`,
}));

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ user: null });
  }
});

app.listen(4000, () => console.log('Servidor iniciado en puerto 4000'));
