export class GastosService {
    constructor(gastosRepository) {
        this.gastosRepository = gastosRepository;
    }

    async getById(id) {
        const rows = await this.gastosRepository.getById(id);

        if (rows.length === 0) {
            throw new Error("Gasto no encontrado");
        }
        return rows[0];
    }

    async update(id, name, amount, image, fixed_expense) {
        const updatedRows = await this.gastosRepository.update(id, name, amount, image, fixed_expense);

        if (updatedRows.length === 0) {
            throw new Error("No se pudo actualizar (Gasto no existe)");
        }
        return updatedRows[0];
    }

    async delete(id) {
        const deletedRows = await this.gastosService.delete(id);

        if (deletedRows.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        return deletedRows;
    }
}