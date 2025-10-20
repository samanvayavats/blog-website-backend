import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();

userRouter.post('/sign-up', async (c) => {

    try {
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate());

        const body = await c.req.json()

        const { username, email, password } = body

        if (!username || !password) {
            c.status(403)
            return c.json({ message: 'all the fields are required' })
        }

        const user = await prisma.user.create({
            data: {
                username: username,
                password: password,
                email: email || ''
            }
        })

        const token = await sign({ id: user.id, username: user.username }, c.env.JWT_SECRET)

        c.status(200)
        return c.json({
            username: username,
            jwt: token
        })

    } catch (error) {
        console.log('error : ', error)
        c.status(500)
        return c.json({ message: 'something went wrong at the sign-up', error: error })

    }
})


userRouter.post('/sign-in', async (c) => {

    try {
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate());

        const body = await c.req.json()

        const { username, password } = body

        if (!username || !password) {
            c.status(403)
            return c.json({ message: 'all the fields are required' })
        }

        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        })

        if (!user) {
            c.status(403)
            return c.json({
                message: "invlaid user"
            })
        }

        const token = await sign({ id: user.id, username: user.username }, c.env.JWT_SECRET)

        c.status(200)
        return c.json({
            username: username,
            jwt: token
        })

    } catch (error) {
        console.log('error : ', error)
        c.status(500)
        return c.json({ message: 'something went wrong at the sign-up', error: error })
    }
})
