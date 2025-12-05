export class Cobro {
    constructor(idCobro, idPresupuesto, idPaciente, total, metodoPago, fechaCobro) {
        this.idCobro = idCobro;              // PK autoincremental en la BD
        this.idPresupuesto = idPresupuesto;  // FK -> presupuesto.idPresupuesto
        this.idPaciente = idPaciente;        // FK -> paciente.idPaciente
        this.total = total;                  // Monto total cobrado
        this.metodoPago = metodoPago;        // Efectivo, tarjeta, transferencia
        this.fechaCobro = fechaCobro;        // Fecha del cobro
    }
}
