import { Router, Request, Response } from 'express'
import { register, login, getMe, registerAdmin, handleRefreshToken ,deleteUser,updateUserStatus} from '../controllers/authcontroller.controller'
import { authenticate } from '../middlewares/auth.middlewares'
import { isAdmin } from '../middlewares/isAdmin.middlewares'
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router()

// /api/v1/auth/register
// public route
router.post('/register', register)

// /api/v1/auth/login
// public route
router.post('/login', login)

// /api/v1/auth/me
// protected route (USER, AUTHOR, ADMIN)
router.get('/me', authenticate, getMe)

router.put('/profileUpdate', authenticate, updateUserStatus);

// /api/v1/auth/admin/register
// protected route (ADMIN)
router.post('/admin/register', authenticate, isAdmin, registerAdmin)

router.post('/auth/refreshtoken',handleRefreshToken)

router.delete('/:id', authenticate, isAdmin, deleteUser);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));
// Route to start Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/login",
  }),
  (req: any, res) => {
    try {
      const accessToken = jwt.sign(
        { id: req.user._id, role: req.user.roles },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" }
      );

      const refreshToken = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      res.redirect(
        `http://localhost:5173/login-success?token=${accessToken}&refreshToken=${refreshToken}`
      );
    } catch {
      res.redirect("http://localhost:5173/login?error=auth_failed");
    }
  }
);
export default router
