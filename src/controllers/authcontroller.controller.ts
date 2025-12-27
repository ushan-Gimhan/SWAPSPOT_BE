import {Request, Response} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IUser, Role, Status, User } from '../models/user.model'
import { signAccessToken } from '../utils/tokens'
import { AuthRequest } from "../middlewares/auth.middlewares";

const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || '';

/// /api/v1/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, role } = req.body

    console.log(fullName, email, password, role)

    //Validation
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" })
    }

    //Role validation (ONLY USER & ADMIN)
    if (role !== Role.USER && role !== Role.ADMIN) {
      return res.status(400).json({ message: "Invalid role" })
    }

    //Check existing user
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" })
    }

    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    //Approval logic
    // USER → approved
    // ADMIN → approved (or change if you want manual approval)
    const approvalStatus = Status.APPROVED

    // Save user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      roles: [role],
      approved: approvalStatus
    })

    await newUser.save()

    //Response
    return res.status(201).json({
      message:
        role === Role.ADMIN
          ? "Admin registered successfully"
          : "User registered successfully",
      data: {
        id: newUser._id,
        email: newUser.email,
        roles: newUser.roles,
        approved: newUser.approved
      }
    })

  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Server error"
    })
  }
}

// /api/v1/auth/login
export const login = async (req: Request, res: Response) => {
    // res.status(200).json({ message: 'User logged in successfully' })

    try {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, existingUser.password)
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const accessToken = signAccessToken(existingUser)
    const refreshToken = signAccessToken(existingUser)

    res.status(200).json({
      message: "success",
      data: {
        email: existingUser.email,
        roles: existingUser.roles,
        accessToken : accessToken,
        refreshToken: refreshToken
      }
    })
  } catch (err: any) {
    res.status(500).json({ message: err?.message })
  }
}

// /api/v1/auth/me
export const getMe = async (req: AuthRequest, res: Response) => {
     // const roles = req.user.roles
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  const userId = req.user.sub
  const user =
    ((await User.findById(userId).select("-password")) as IUser) || null

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    })
  }

  const { fullName, email, roles, approved } = user

  res.status(200).json({
    message: "Ok",
    data: { fullName, email, roles, approved }
  })
}

// /api/v1/auth/admin/register
export const registerAdmin = async (req: Request, res: Response) => {
    // res.status(201).json({ message: 'Admin registered successfully' })

    try {
    const { fullName, email, password} = req.body

    // data validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email alrady registered" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new User({
      fullName, // fullName: fullName
      email,
      password: hashedPassword,
      roles: [Role.ADMIN],
      approved: Status.APPROVED
    })

    await newUser.save()

    res.status(201).json({
      message: "Admin registered successfully",
      data: {
        id: newUser._id,
        email: newUser.email,
        roles: newUser.roles,
        approved: newUser.approved
      }
    })
  } catch (err: any) {
    res.status(500).json({ message: err?.message })
  }
}
export const handleRefreshToken = async (req: Request, res: Response) => {
  try{
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ message: 'Token is required' })
    }
    const payload = jwt.verify(token, JWT_REFRESH_SECRET)
    // payload.sub - user id

    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' })
    }
    const accessToken = signAccessToken(user)
    res.status(200).json({ accessToken })
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired refresh token' })
  }
}