import jwt from 'jsonwebtoken';
import { logRed } from './logs_custom.js';
import { JWT_SECRET } from '../config/env.js';

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];


  if (!token) {
    logRed('Token no proporcionado');
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logRed('Token inválido', token);
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.session = decoded;
    next();
  });
}

export default verifyToken;
