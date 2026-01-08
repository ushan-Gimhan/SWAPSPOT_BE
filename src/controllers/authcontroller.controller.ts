import {Request, Response} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IUser, Role, Status, User } from '../models/user.model'
import { signAccessToken } from '../utils/tokens'
import { AuthRequest } from "../middlewares/auth.middlewares";
import PDFDocument from 'pdfkit';

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

    if (!existingUser.password) {
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
  try {
    // req.user is populated by your middleware
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    // Handle both 'sub' (standard JWT) or 'id' (custom) property
    const userId = req.user.sub || req.user.id || req.user._id;

    const user = await User.findById(userId).select("-password") as IUser | null;

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const { fullName, email, roles, approved } = user

    res.status(200).json({
      message: "Ok",
      data: { 
        id: user._id, // It's good practice to return ID here
        fullName, 
        email, 
        roles, 
        approved 
      }
    })
  } catch (error: any) {
    res.status(500).json({ message: "Server Error" })
  }
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

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    // 1. Validate Input Status
    const validStatuses = ["APPROVED", "PENDING", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
      });
    }

    // 2. Find User
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Robust Admin Check
    // We check if any role matches 'ADMIN', case-insensitive
    const isAdmin = userToUpdate.roles?.some((role: any) => {
      const roleName = typeof role === 'string' ? role : role.name;
      return roleName?.toUpperCase() === 'ADMIN';
    });

    if (isAdmin) {
      return res.status(403).json({ message: "Security Restriction: Admin status cannot be modified." });
    }

    // 4. Perform Update
    userToUpdate.approved = status;
    await userToUpdate.save();

    res.status(200).json({ 
      message: "User approval status updated successfully", 
      data: userToUpdate 
    });

  } catch (err: any) {
    console.error("Update Status Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const createUserReports = async (req: Request, res: Response) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ message: "User data is required" });
    }

    // Initialize the document with proper typing
    const doc: PDFKit.PDFDocument = new PDFDocument({ 
      margin: 50, 
      size: 'A4' 
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=User_Report.pdf');

    doc.pipe(res);

    // --- Header ---
    doc.fillColor('#0f172a').fontSize(22).text('User Directory Report');
    doc.fontSize(10).fillColor('#64748b').text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);

    // --- Table Configuration ---
    const tableTop = 150;
    const columns = {
      name: 50,
      email: 200,
      role: 380,
      status: 480
    };

    // Header Row
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10);
    doc.text('IDENTITY', columns.name, tableTop);
    doc.text('EMAIL', columns.email, tableTop);
    doc.text('ROLE', columns.role, tableTop);
    doc.text('STATUS', columns.status, tableTop);
    
    // Line underneath header
    // FIX: Use lineWidth instead of strokeWidth
    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .lineWidth(1) 
       .strokeColor('#cbd5e1')
       .stroke();

    // --- Data Rows ---
    let currentY = tableTop + 30;
    doc.font('Helvetica').fontSize(10).fillColor('#1e293b');

    users.forEach((user: any) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }

      doc.font('Helvetica-Bold').text(user.fullName || '', columns.name, currentY);
      doc.font('Helvetica').text(user.email || '', columns.email, currentY);
      doc.text(user.roles?.[0] || 'USER', columns.role, currentY);
      
      const status = user.approved || 'PENDING';
      const color = status === 'APPROVED' ? '#10b981' : status === 'REJECTED' ? '#f43f5e' : '#f59e0b';

      doc.fillColor(color).font('Helvetica-Bold').text(status, columns.status, currentY);
      doc.fillColor('#1e293b').font('Helvetica'); // Reset colors

      currentY += 25;
    });

    doc.end();

  } catch (err: any) {
    console.error("PDF Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: err?.message || "Internal Server Error" });
    }
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Find the user first
    const userToDelete = await User.findById(id);
    
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Robust Admin Check
    // This handles both string arrays ["ADMIN"] and populated object arrays [{name: "ADMIN"}]
    const isAdmin = userToDelete.roles?.some((role: any) => {
      const roleName = typeof role === 'string' ? role : role.name;
      return roleName?.toUpperCase() === 'ADMIN';
    });

    if (isAdmin) {
      return res.status(403).json({ 
        message: "Security Protocol: Users with ADMIN roles cannot be deleted from the dashboard." 
      });
    }

    // 3. Final Deletion
    await User.findByIdAndDelete(id);

    res.status(200).json({ 
      message: `User ${userToDelete.fullName} deleted successfully.` 
    });
    
  } catch (err: any) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};