import { MovementType } from "../utils/enums.js";

export class EntidadesFinancierasService {
  constructor({ entidadesFinancierasRepository, gastosRepository, movementsRepository }) {
    this.entidadesFinancierasRepository = entidadesFinancierasRepository;
    this.gastosRepository = gastosRepository;
    this.movementsRepository = movementsRepository;
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

    const movements = await this.movementsRepository.getMovementsByEntidad(id);

    return {
      id: entity.id,
      name: entity.name,
      created_at: entity.created_at,
      gastos_activos: gastosActivos,
      gastos_inactivos: gastosFinalizados,
      movements,
    };
  }

  async crear(name, userId) {
    const [row] = await this.entidadesFinancierasRepository.create(name, userId);

    await this.movementsRepository.createEntidadLog(row.id, MovementType.CREATION);

    return row;
  }

  async actualizar(id, name, userId) {
    const currentRows = await this.entidadesFinancierasRepository.getById(id, userId);
    if (currentRows.length === 0) throw new Error("Entidad no encontrada");

    const [row] = await this.entidadesFinancierasRepository.update(id, name, userId);


    return row;
  }

  async eliminar(id, userId) {
    const deletedRows = await this.entidadesFinancierasRepository.delete(id, userId);

    if (deletedRows.length === 0) {
      throw new Error("Entidad no encontrada");
    }

    return deletedRows[0];
  }

  async obtenerMovements(id) {
    return await this.movementsRepository.getMovementsByEntidad(id);
  }
}
