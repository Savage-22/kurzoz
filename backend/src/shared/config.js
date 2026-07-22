import 'dotenv/config'

export const config = {
    port: Number(process.env.PORT) || 4000,
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'kurzoz',
    },
    deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    },
}
