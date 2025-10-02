import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const localRegister = async (req, res) => {
  let { email, username, password } = req.body
  const provider = 'local'

  // 1. Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' })
  }

  // 2. Check for unique username and email
  const existingUser = await prisma.account.findFirst({
    where: {
      OR: [
        { username },
        { email },
      ],
    },
  })
  if (existingUser) {
    if (existingUser.username === username) {
      return res.status(400).json({ error: 'Username already exists.' })
    }
    if (existingUser.email === email) {
      return res.status(400).json({ error: 'Email already exists.' })
    }
  }

  // 3. Create and save account
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.account.create({
      data: {
        id: uuidv7(),
        username,
        email,
        password: hashedPassword,
        provider,
      },
    })
    res.status(201).json({ success: 'Account created.' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const localLogin = async (req, res) => {
  let { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'All fields are required.' })
  }

  const account = await prisma.account.findUnique({ where: { username } })
  if (!account) {
    return res.status(400).json({ error: 'Invalid username or password' })
  }

  const isMatch = await bcrypt.compare(password, account.password)
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid username or password' })
  }


  const user = {
    userId: account.id,
    username: account.username,
    email: account.email,
  }

  req.body.user = user

  return res.status(200).json({
    success: 'User is authorized',
    user,
  })
}

export { localRegister, localLogin }
