export class EntidadesFinancierasService {
    constructor(entidadesFinancierasRepository) {
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
    }

    async listar(userId) {
        return await this.entidadesFinancierasRepository.listar(userId);
    }

    async obtenerPorId(id, userId) {
        const entidad = await this.entidadesFinancierasRepository.getById(id, userId);

        if (!entidad.length) {
            throw new Error("Entidad no encontrada");
        }

        const gastos = await this.gastosRepository.getGastosByEntidad(id);
        const logs = await this.logsRepository.getLogsByEntidad(id);
        return {
            entidad: entidad[0],
            gastos_activos: gastos.filter(g => g.deleted === false),
            gastos_inactivos: gastos.filter(g => g.deleted === true),
            logs
        };
    }

    async crear(name, userId) {
        return await this.entidadesFinancierasRepository.create(name, userId);
    }

    async actualizar(id, name, userId) {

        const currentRows = await this.entidadesFinancierasRepository.getById(id, userId);

        if (currentRows.length === 0) {
            throw new Error("Entidad no encontrada");
        }

        const updatedRows = await this.entidadesFinancierasRepository.update(id, name, userId);
        return updatedRows[0];
    }

    async eliminar(id, userId) {

        const deletedRows = await this.entidadesFinancierasRepository.delete(id, userId);

        if (deletedRows.length === 0) {
            throw new Error("Entidad no encontrada");
        }

        return deletedRows[0];
    }
}