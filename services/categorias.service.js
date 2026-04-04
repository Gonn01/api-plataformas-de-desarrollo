export class CategoriasService {
    constructor({ categoriasRepository }) {
        this.categoriasRepository = categoriasRepository;
    }

    async listar(userId) {
        return await this.categoriasRepository.listar(userId);
    }

    async crear(name, color, userId) {
        const [row] = await this.categoriasRepository.create(name, color, userId);
        return row;
    }

    async actualizar(id, name, color, userId) {
        const rows = await this.categoriasRepository.update(id, name, color, userId);
        if (!rows.length) throw new Error("Categoría no encontrada");
        return rows[0];
    }

    async eliminar(id, userId) {
        const rows = await this.categoriasRepository.delete(id, userId);
        if (!rows.length) throw new Error("Categoría no encontrada");
        return rows[0];
    }
}
