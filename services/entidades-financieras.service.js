export class EntidadesFinancierasService {
  constructor({ entidadesFinancierasRepository, gastosRepository, logsRepository }) {
    this.entidadesFinancierasRepository = entidadesFinancierasRepository;
    this.gastosRepository = gastosRepository;
    this.logsRepository = logsRepository;
  }

  async listar(userId) {
    const entidades = await this.entidadesFinancierasRepository.listar(userId);
    for (const entidad of entidades) {
      const gastos = await this.gastosRepository.getGastosByEntidad(entidad.id);
      const gastosActivos = gastos.filter(g => (Number(g.payed_quotas) < Number(g.number_of_quotas) || g.fixed_expense));
      entidad.cantidad = gastosActivos.length;
    }
    return entidades;
  }

  async obtenerPorId(id, userId) {
    const entidad = await this.entidadesFinancierasRepository.getById(id, userId);

    if (!entidad.length) throw new Error("Entidad no encontrada");

    const entity = entidad[0];
    const gastos = await this.gastosRepository.getGastosByEntidad(id);
    const gastosActivos = gastos.filter(g => Number(g.payed_quotas) < Number(g.number_of_quotas) || g.fixed_expense);
    const gastosFinalizados = gastos.filter(g => Number(g.payed_quotas) >= Number(g.number_of_quotas) && !g.fixed_expense);

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

    await this.logsRepository.createEntidadLog(
      row.id,
      `Entidad financiera "${name}" creada.`
    );

    return row;
  }

  async actualizar(id, name, userId) {
    const currentRows = await this.entidadesFinancierasRepository.getById(id, userId);
    if (currentRows.length === 0) throw new Error("Entidad no encontrada");

    const [row] = await this.entidadesFinancierasRepository.update(id, name, userId);

    await this.logsRepository.createEntidadLog(id, "Entidad financiera actualizada de '" + currentRows[0].name + "' a: '" + name + "'");

    return row;
  }

  async eliminar(id, userId) {
    const deletedRows = await this.entidadesFinancierasRepository.delete(id, userId);

    if (deletedRows.length === 0) {
      throw new Error("Entidad no encontrada");
    }

    await this.logsRepository.createEntidadLog(id, "Entidad financiera eliminada");

    return deletedRows[0];
  }

  async obtenerLogs(id) {
    return await this.logsRepository.getLogsByEntidad(id);
  }
}
