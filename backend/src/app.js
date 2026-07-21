import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { registerModules } from './modules/index.js'
import { globalErrorHandler } from './shared/middlewares/globalErrorHandler.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

registerModules(app)

app.use(globalErrorHandler)

export default app
