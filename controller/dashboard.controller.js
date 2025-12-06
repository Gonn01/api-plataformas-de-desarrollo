import { logRed } from "../utils/logs_custom.js";

export class DashboardController {
  constructor(dashboardService) {
    this.dashboardService = dashboardService;
  }

  home = async (req, res) => {
    try {
      const { userId } = req.session;

      const response = await this.dashboardService.getHomeData(userId);

      res.json({
        message: "Datos del dashboard obtenidos con éxito",
        data: response
      });
    } catch (err) {
      logRed(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }

}

