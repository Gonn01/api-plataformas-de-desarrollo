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
        // 1. Obtener entidad
        const entidad = await this.entidadesFinancierasRepository.getById(id, userId);

        if (!entidad.length) {
            throw new Error("Entidad no encontrada");
        }

        const entity = entidad[0];

        // 2. Gastos de la entidad
        const gastos = await this.gastosRepository.getGastosByEntidad(id);

        // 3. Separar
        const gastosActivos = gastos.filter(
            g => Number(g.payed_quotas) < Number(g.number_of_quotas)
        );

        const gastosFinalizados = gastos.filter(
            g => Number(g.payed_quotas) >= Number(g.number_of_quotas)
        );

        // 4. Logs
        const logs = await this.logsRepository.getLogsByEntidad(id);

        return {
            id: entity.id,
            name: entity.name,
            created_at: entity.created_at,
            gastos_activos: gastosActivos,
            gastos_inactivos: gastosFinalizados,
            logs,
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
<<<<<<< HEAD
        const deletedRows = await this.entidadesFinancierasRepository.delete(id, userId);
=======

        const [row] = await this.entidadesFinancierasRepository.delete(id, userId);
>>>>>>> d1e08e9458b7f0621dca7b6da6d0f9de9f5eb278

        if (row.length === 0) {
            throw new Error("Entidad no encontrada");
        }
        await this.logsRepository.createEntidadLog(id, "Entidad financiera eliminada")
        return row;
    }
}
