const jwt = require('jsonwebtoken');
const db = require('../database');

async function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Pega o token do "Bearer TOKEN"

    if (token == null) {
        return res.sendStatus(401); // 401 Unauthorized: Não há token
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_secreto');
        
        // A VERIFICAÇÃO CRUCIAL: O usuário do token ainda existe no banco?
        const userResult = await db.query('SELECT id FROM users WHERE id = $1', [decoded.userId]);
        
        if (userResult.rows.length === 0) {
            // O usuário foi deletado! Retorna o erro 403 Forbidden.
            return res.status(403).json({ message: 'User not found' });
        }
        
        // Se o usuário existe, anexa o ID dele à requisição e continua
        req.userId = decoded.userId; 
        next(); 
    } catch (err) {
        // Se o token for inválido/expirado, também retorna 403 Forbidden
        return res.status(403).json({ message: 'Invalid token' });
    }
}

module.exports = verifyToken;