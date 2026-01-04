import { Request, Response } from 'express';
import User from '../models/user.model'; // Assuming you have a User model
import bcrypt from 'bcryptjs';

// --- GET PROFILE ---
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    
    // ✅ FIX: Check for 'sub' (where your token actually stores the ID)
    const userId = userPayload.sub || userPayload.id || userPayload._id;

    if (!userId) {
       console.error("Profile Error: Token exists but has no ID.", userPayload);
       return res.status(401).json({ message: 'Invalid Token Data' });
    }

    const user = await User.findById(userId).select('-password'); 

    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching profile' });
  }
};
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.sub || userPayload.id || userPayload._id;

    if (!userId) {
        return res.status(401).json({ message: 'Invalid Token: No User ID' });
    }

    // 👇 CHANGED: Extract 'avatar' directly from body (matches frontend)
    const { name, bio, location, avatar } = req.body;

    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.fullName = name;
    if (bio !== undefined) (user as any).bio = bio; 
    if (location !== undefined) (user as any).location = location; 
    
    // 👇 CHANGED: Assign avatar directly
    if (avatar !== undefined) (user as any).avatar = avatar; 

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        bio: (user as any).bio,
        location: (user as any).location,
        avatar: (user as any).avatar // Return the updated avatar
      }
    });

  } catch (error: any) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: 'Server Error updating profile' });
  }
};

// --- DELETE ACCOUNT ---
export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const userPayload = (req as any).user;
        const userId = userPayload.sub || userPayload.id || userPayload._id;

        if (!userId) {
            return res.status(401).json({ message: 'Invalid Token' });
        }

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found to delete' });
        }

        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error("Delete Account Error:", error);
        res.status(500).json({ message: 'Server Error deleting account' });
    }
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    // robust ID extraction
    const userId = userPayload.sub || userPayload.id || userPayload._id;

    const { currentPassword, newPassword } = req.body;

    // 1. Basic Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide both current and new passwords" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // 2. Find User (Explicitly select password since it's usually hidden)
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Verify Current Password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // 4. Hash New Password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 5. Save
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Password updated successfully" 
    });

  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server Error while updating password" });
  }
};