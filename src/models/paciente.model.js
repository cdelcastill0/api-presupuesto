export default class Paciente {
    constructor(nombre, apellido, fecha_nac, direccion, correo, fechaRegistro = null, idPaciente = null) {
        this.idPaciente = idPaciente;  // Será asignado por MySQL
        this.nombre = nombre;
        this.apellido = apellido;
        this.fecha_nac = fecha_nac;
        this.direccion = direccion;
        this.correo = correo;
        this.fechaRegistro = fechaRegistro;
    }
}
