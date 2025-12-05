import {Request, Response} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IUser, Role, Status, User } from '../models/user.model'
import { signAccessToken } from '../utils/tokens'
import { AuthRequest } from "../middlewares/auth.middlewares";

const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || '';

// /api/v1/auth/register
export const register = async(req: Request, res: Response) => {
    // res.status(201).json({ message: 'User registered successfully' })

    try {
    const { firstName, lastName, email, password, role } = req.body

    console.log(firstName)
    console.log(lastName)
    console.log(email)
    console.log(password)
    console.log(role)

    // data validation
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (role !== Role.USER && role !== Role.AUTHOR) {
      return res.status(400).json({ message: "Invalid role" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email alrady registered" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const approvalStatus =
      role === Role.AUTHOR ? Status.PENDING : Status.APPROVED

    const newUser = new User({
      firstName, // firstname: firstname
      lastName,
      email,
      password: hashedPassword,
      roles: [role],
      approved: approvalStatus
    })

    await newUser.save()

    res.status(201).json({
      message:
        role === role.AUTHOR
          ? "Author registered successfully. waiting for approvel"
          : "User registered successfully",
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

  const { firstName, lastName, email, roles, approved } = user

  res.status(200).json({
    message: "Ok",
    data: { firstName, lastName, email, roles, approved }
  })
}

// /api/v1/auth/admin/register
export const registerAdmin = async (req: Request, res: Response) => {
    // res.status(201).json({ message: 'Admin registered successfully' })

    try {
    const { firstname, lastname, email, password} = req.body

    // data validation
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email alrady registered" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new User({
      firstname, // firstname: firstname
      lastname,
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