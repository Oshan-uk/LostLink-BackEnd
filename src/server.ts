import dotenv from 'dotenv'
import app from './app'

dotenv.config()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`LostLink API running on port ${PORT}`)
})