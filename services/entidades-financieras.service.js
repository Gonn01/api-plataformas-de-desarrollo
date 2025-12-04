export class EntidadesFinancierasService {
    constructor({
        entidadesFinancierasRepository,
        gastosRepository,
        logsRepository
    }) {
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
        this.gastosRepository = gastosRepository;
        this.logsRepository = logsRepository;
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
            ...entidad[0],
            gastos_activos: gastos.filter(g => g.deleted === false),
            gastos_inactivos: gastos.filter(g => g.deleted === true),
            logs
        };
    }

    async crear(name, userId) {
        const [row] = await this.entidadesFinancierasRepository.create(name, userId);
        await this.logsRepository.createEntidadLog(row.insertedId, `Entidad financiera "${name}" creada.`);

    }

    async actualizar(id, name, userId) {

        const currentRows = await this.entidadesFinancierasRepository.getById(id, userId);

        if (currentRows.length === 0) {
            throw new Error("Entidad no encontrada");
        }

        const [row] = await this.entidadesFinancierasRepository.update(id, name, userId);

        await this.logsRepository.createEntidadLog(id, "Entidad financiera actualizada")
        return row;
    }

    async eliminar(id, userId) {

        const [row] = await this.entidadesFinancierasRepository.delete(id, userId);

        if (row.length === 0) {
            throw new Error("Entidad no encontrada");
        }
        await this.logsRepository.createEntidadLog(id, "Entidad financiera eliminada")
        return row;
    }
}