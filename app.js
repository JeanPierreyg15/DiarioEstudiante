// Clave con la que guardamos las sesiones en localStorage.
const CLAVE_ALMACENAMIENTO = "diarioDeEstudio.sesiones";

const formulario = document.getElementById("formulario-sesion");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const rachaNumero = document.getElementById("racha-numero");
const rachaTexto = document.getElementById("racha-texto");
const listaSesiones = document.getElementById("lista-sesiones");
const sinSesiones = document.getElementById("sin-sesiones");

const formateadorFecha = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

// Guardamos las sesiones en memoria y las mostramos al cargar la página.
let sesiones = cargarSesiones();

// Devuelve una fecha local como texto "AAAA-MM-DD".
// Usamos getFullYear(), getMonth() y getDate() para trabajar siempre
// con la fecha local del usuario y nunca con UTC.
function fechaLocalAString(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Convierte "AAAA-MM-DD" en una fecha local.
function fechaDesdeString(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

// Resta días a una fecha construyendo otra fecha local.
function restarDias(fecha, cantidad) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - cantidad);
}

function cargarSesiones() {
  try {
    const datosGuardados = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (!datosGuardados) {
      return [];
    }

    const datos = JSON.parse(datosGuardados);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("No se pudieron cargar las sesiones:", error);
    return [];
  }
}

function guardarSesiones() {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(sesiones));
  } catch (error) {
    console.error("No se pudieron guardar las sesiones:", error);
  }
}

// Calcula los días consecutivos con al menos una sesión.
// La racha termina hoy; si hoy aún no hay sesión, puede terminar ayer.
function calcularRacha() {
  const diasConSesion = new Set(sesiones.map((sesion) => sesion.fecha));
  const hoy = new Date();

  let dia = null;

  if (diasConSesion.has(fechaLocalAString(hoy))) {
    dia = hoy;
  } else if (diasConSesion.has(fechaLocalAString(restarDias(hoy, 1)))) {
    dia = restarDias(hoy, 1);
  } else {
    return 0;
  }

  let racha = 0;

  while (diasConSesion.has(fechaLocalAString(dia))) {
    racha++;
    dia = restarDias(dia, 1);
  }

  return racha;
}

function renderizarRacha() {
  const racha = calcularRacha();
  rachaNumero.textContent = racha;
  rachaTexto.textContent = racha === 1 ? "día seguido" : "días seguidos";
}

function formatearFecha(textoFecha) {
  return formateadorFecha.format(fechaDesdeString(textoFecha));
}

function renderizarSesiones() {
  listaSesiones.innerHTML = "";

  const sesionesOrdenadas = [...sesiones].sort((a, b) => {
    if (a.fecha !== b.fecha) {
      return a.fecha > b.fecha ? -1 : 1;
    }
    return b.creadaEn - a.creadaEn;
  });

  sesionesOrdenadas.forEach((sesion) => {
    const elemento = document.createElement("li");
    elemento.className = "sesion";

    const cabecera = document.createElement("div");
    cabecera.className = "sesion-cabecera";

    const tema = document.createElement("span");
    tema.className = "sesion-tema";
    tema.textContent = sesion.tema;

    const minutos = document.createElement("span");
    minutos.className = "sesion-minutos";
    minutos.textContent = `${sesion.minutos} min`;

    const fecha = document.createElement("p");
    fecha.className = "sesion-fecha";
    fecha.textContent = formatearFecha(sesion.fecha);

    cabecera.appendChild(tema);
    cabecera.appendChild(minutos);
    elemento.appendChild(cabecera);
    elemento.appendChild(fecha);
    listaSesiones.appendChild(elemento);
  });

  const haySesiones = sesionesOrdenadas.length > 0;
  listaSesiones.hidden = !haySesiones;
  sinSesiones.hidden = haySesiones;
}

// Mostramos los mensajes de validación del navegador en español.
function configurarMensajesDeValidacion() {
  const campos = [
    { campo: campoFecha, mensaje: "Selecciona una fecha." },
    { campo: campoTema, mensaje: "Escribe el tema de la sesión." },
    { campo: campoMinutos, mensaje: "Los minutos deben ser un número mayor que 0." }
  ];

  campos.forEach(({ campo, mensaje }) => {
    campo.addEventListener("invalid", () => {
      campo.setCustomValidity(mensaje);
    });

    campo.addEventListener("input", () => {
      campo.setCustomValidity("");
    });
  });
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const tema = campoTema.value.trim();

  if (tema === "") {
    campoTema.setCustomValidity("Escribe el tema de la sesión.");
    campoTema.reportValidity();
    return;
  }

  const minutos = Number(campoMinutos.value);

  if (!Number.isFinite(minutos) || minutos <= 0) {
    campoMinutos.setCustomValidity("Los minutos deben ser un número mayor que 0.");
    campoMinutos.reportValidity();
    return;
  }

  sesiones.push({
    fecha: campoFecha.value,
    tema: tema,
    minutos: minutos,
    creadaEn: Date.now()
  });

  guardarSesiones();
  renderizarSesiones();
  renderizarRacha();

  formulario.reset();
  campoFecha.value = fechaLocalAString(new Date());
  campoTema.focus();
});

// Al abrir la página: fecha de hoy, mensajes en español y datos guardados.
campoFecha.value = fechaLocalAString(new Date());
configurarMensajesDeValidacion();
renderizarSesiones();
renderizarRacha();
