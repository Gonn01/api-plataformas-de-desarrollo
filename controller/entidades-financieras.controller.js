export class EntidadesFinancierasController {
    constructor(entidadesFinancierasRepository) {
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
    }

    listar = async (req, res) => {
        try {
            const user = req.user;

            const rows = await this.entidadesFinancierasRepository.listar(user.id);

            res.json(rows);
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    obtenerPorId = async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.user;

            const rows = await this.entidadesFinancierasRepository.getById(id, userId);

            if (rows.length === 0) {
                return res.status(404).json({ error: "Entidad no encontrada" });
            }

            res.json(rows[0]);
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    crear = async (req, res) => {
        try {
            const { name } = req.body;
            const { userId } = req.user;

            if (!name) {
                return res.status(400).json({ error: "Falta el campo 'name'" });
            }

            const inserted = await this.entidadesFinancierasRepository.create(name, userId);

            res.status(201).json(inserted[0]);
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    actualizar = async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const { userId } = req.user;

            const currentRows = await this.entidadesFinancierasRepository.getById(id, userId);

            if (currentRows.length === 0) {
                return res.status(404).json({ error: "Entidad no encontrada" });
            }

            const updatedRows = await this.entidadesFinancierasRepository.update(id, name, userId);

            res.json(updatedRows[0]);
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    eliminar = async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.user;

            const deletedRows = await this.entidadesFinancierasRepository.delete(id, userId);

            if (deletedRows.length === 0) {
                return res.status(404).json({ error: "Entidad no encontrada" });
            }

            res.json({ message: "Entidad financiera eliminada con éxito", id });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}

