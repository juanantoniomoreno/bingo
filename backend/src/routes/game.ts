import { Router, type Request, type Response } from 'express';
import type { GameManager } from '../game/GameManager';
import { ErrorCode } from 'shared';

/**
 * Create REST API routes for game management.
 */
export function createGameRoutes(gameManager: GameManager): Router {
  const router = Router();

  // POST /api/game — Create a new game
  router.post('/game', (req: Request, res: Response) => {
    const { playerName } = req.body;

    if (!playerName || typeof playerName !== 'string') {
      res.status(400).json({
        error: ErrorCode.INVALID_NAME,
        message: 'El nombre es obligatorio',
      });
      return;
    }

    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]{1,20}$/.test(playerName)) {
      res.status(400).json({
        error: ErrorCode.INVALID_NAME,
        message: 'El nombre debe tener entre 1 y 20 caracteres (letras, números, espacios)',
      });
      return;
    }

    const result = gameManager.createGame(playerName);

    res.status(201).json(result);
  });

  // GET /api/game/:id — Get game state (polling fallback)
  router.get('/game/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await gameManager.getGameStateResponse(id);

    if (typeof result === 'string') {
      // It's an error code
      if (result === ErrorCode.GAME_NOT_FOUND) {
        res.status(404).json({
          error: result,
          message: 'Partida no encontrada',
        });
        return;
      }
      res.status(400).json({
        error: result,
        message: 'Error',
      });
      return;
    }

    res.json(result);
  });

  return router;
}