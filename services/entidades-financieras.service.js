import { MovementType } from "../utils/enums.js";

export class EntidadesFinancierasService {
  constructor({ entidadesFinancierasRepository, gastosRepository, movementsRepository, authRepository }) {
    this.entidadesFinancierasRepository = entidadesFinancierasRepository;
    this.gastosRepository = gastosRepository;
    this.movementsRepository = movementsRepository;
    this.authRepository = authRepository;
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
      linked_user_id: entity.linked_user_id,
      linked_user_name: entity.linked_user_name ?? null,
      linked_user_email: entity.linked_user_email ?? null,
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

  async vincularUsuario(entityId, userId, email) {
    const entidad = await this.entidadesFinancierasRepository.getById(entityId, userId);
    if (!entidad.length) throw new Error("Entidad no encontrada");

    const users = await this.authRepository.findUserByEmail(email);
    if (!users.length) throw new Error("No existe un usuario registrado con ese email");

    const linkedUser = users[0];
    if (linkedUser.id === parseInt(userId)) throw new Error("No podés vincular tu propia cuenta");

    const updated = await this.entidadesFinancierasRepository.vincularUsuario(entityId, userId, linkedUser.id);
    return { ...updated[0], linked_user_name: linkedUser.name, linked_user_email: linkedUser.email };
  }

  async desvincularUsuario(entityId, userId) {
    const entidad = await this.entidadesFinancierasRepository.getById(entityId, userId);
    if (!entidad.length) throw new Error("Entidad no encontrada");

    const updated = await this.entidadesFinancierasRepository.desvincularUsuario(entityId, userId);
    return updated[0];
  }
}
