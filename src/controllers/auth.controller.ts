import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt, { SignOptions } from "jsonwebtoken"
import User from "../models/User.js"

const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET is not defined")
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"]

  return jwt.sign({ userId }, secret, { expiresIn })
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      })
      return
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid input data"
      })
      return
    }

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedName.length < 2) {
      res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters"
      })
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      })
      return
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      })
      return
    }

    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email is already registered"
      })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword
    })

    const token = generateToken(user._id.toString())

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "Email is already registered"
      })
      return
    }

    console.error("Registration error:", error)

    res.status(500).json({
      success: false,
      message: "Registration failed"
    })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required"
      })
      return
    }

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid input data"
      })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    const user = await User.findOne({ email: normalizedEmail }).select("+password")

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      })
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      })
      return
    }

    const token = generateToken(user._id.toString())

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    })
  } catch (error) {
    console.error("Login error:", error)

    res.status(500).json({
      success: false,
      message: "Login failed"
    })
  }
}
