export class DetallePresupuesto {
    constructor(idPresupuesto, idTratamiento, cantidad, precioUnitario, precioTotal) {
        this.idPresupuesto = idPresupuesto;
        this.idTratamiento = idTratamiento;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.precioTotal = precioTotal;
    }
}
