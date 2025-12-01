export class Presupuesto {
    constructor(idPaciente, fechaEmision, fechaVigencia, total, estadoPresupuesto) {
        this.idPaciente = idPaciente;
        this.fechaEmision = fechaEmision;
        this.fechaVigencia = fechaVigencia;
        this.total = total;
        this.estadoPresupuesto = estadoPresupuesto;
    }
}
