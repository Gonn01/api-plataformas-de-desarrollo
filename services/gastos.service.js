export class GastosService {
    constructor({ gastosRepository, logsRepository }) {
        this.gastosRepository = gastosRepository;
        this.logsRepository = logsRepository;
    }

    async getById(id) {
        const [row] = await this.gastosRepository.getById(id);

        if (row.length === 0) {
            throw new Error("Gasto no encontrado");
        }
        return row;
    }

    async update(id, name, amount, image, fixed_expense) {
        const [row] = await this.gastosRepository.update(id, name, amount, image, fixed_expense);

        if (row.length === 0) {
            throw new Error("No se pudo actualizar (Gasto no existe)");
        }
        await this.logsRepository.createGastoLog(id, "Gasto actualizado")
        return row;
    }

    async delete(id) {
        const [row] = await this.gastosService.delete(id);

        if (row.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        await this.logsRepository.createGastoLog(id, "Gasto eliminado")

        return row;
    }
}