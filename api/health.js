// api/health.js — Zero dependency test function
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({
    status: 'ok',
    server: 'NutriFlow Vercel Serverless API',
    time: new Date().toISOString(),
  })
}
