export class DashboardService {
    constructor({ dashboardRepository }) {
        this.dashboardRepository = dashboardRepository;
    }

    async getHomeData(userId) {
        return await this.dashboardRepository.getHomeData(userId);
    }
}