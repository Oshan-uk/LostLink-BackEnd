import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

interface TokenPayload {
  userId: string
}

const protect = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      })
      return
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token"
      })
      return
    }

    const secret = process.env.JWT_SECRET

    if (!secret) {
      res.status(500).json({
        success: false,
        message: "Authentication configuration error"
      })
      return
    }

    const decoded = jwt.verify(token, secret) as TokenPayload

    req.userId = decoded.userId

    next()
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    })
  }
}

export default protect