import * as Notifications from 'expo-notifications';
import { Cita } from '../context/CitasContext';
import { Paciente } from '../context/PacientesContext';

const PREFIJO = 'agenda-cribe:';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (Notifications.getPermissionsAsync) {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
  }
  const solicitado = await Notifications.requestPermissionsAsync();
  return solicitado.granted;
}

function fechaYHora(fecha: string, hora: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  const horaMatch = /^(\d{1,2}):(\d{2})$/.exec(hora);
  if (!match || !horaMatch) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(horaMatch[1]), Number(horaMatch[2]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function fechaNacimiento(fecha: string): { mes: number; dia: number } | null {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(fecha);
  if (!match) return null;
  const mes = Number(match[1]);
  const dia = Number(match[2]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { mes, dia };
}

export async function sincronizarNotificaciones(citas: Cita[], pacientes: Paciente[]) {
  const permiso = await Notifications.getPermissionsAsync();
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  const propias = programadas.filter(item => String(item.content.data?.agendaKey ?? '').startsWith(PREFIJO));
  await Promise.all(propias.map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  if (!permiso.granted) return;

  const ahora = Date.now();
  const tareas: { fecha: Date; titulo: string; cuerpo: string; clave: string; trigger: Notifications.NotificationTriggerInput }[] = [];
  for (const cita of citas) {
    const inicio = fechaYHora(cita.fecha, cita.hora);
    if (!inicio) continue;
    for (const [ms, clave, etiqueta] of [
      [24 * 60 * 60 * 1000, '24h', 'mañana'],
      [60 * 60 * 1000, '1h', 'en una hora'],
    ] as const) {
      const fecha = new Date(inicio.getTime() - ms);
      if (fecha.getTime() <= ahora) continue;
      tareas.push({ fecha, titulo: 'Próxima cita', cuerpo: `Tienes una cita con ${cita.paciente} ${etiqueta}.`, clave: `${PREFIJO}cita:${cita.id}:${clave}`, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fecha } });
    }
  }

  for (const paciente of pacientes) {
    const nacimiento = fechaNacimiento(paciente.fechaNacimiento);
    if (!nacimiento) continue;
    let mesRecordatorio = nacimiento.mes - 1;
    let diaRecordatorio = nacimiento.dia - 1;
    if (diaRecordatorio === 0) {
      const mesAnterior = new Date(2024, mesRecordatorio, 0);
      mesRecordatorio = mesAnterior.getMonth();
      diaRecordatorio = mesAnterior.getDate();
    }
    const prox = new Date();
    prox.setHours(9, 0, 0, 0);
    const proximaCelebracion = new Date(prox.getFullYear(), nacimiento.mes - 1, nacimiento.dia, 9, 0, 0, 0);
    if (proximaCelebracion.getTime() <= ahora) proximaCelebracion.setFullYear(proximaCelebracion.getFullYear() + 1);
    tareas.push({ fecha: proximaCelebracion, titulo: 'Cumpleaños próximo', cuerpo: `Mañana cumple años ${paciente.nombre}.`, clave: `${PREFIJO}cumple:${paciente.id}`, trigger: { type: Notifications.SchedulableTriggerInputTypes.YEARLY, month: mesRecordatorio, day: diaRecordatorio, hour: 9, minute: 0 } });
  }

  tareas.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  for (const tarea of tareas.slice(0, 60)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: tarea.titulo, body: tarea.cuerpo, data: { agendaKey: tarea.clave } },
      trigger: tarea.trigger,
    });
  }
}

export async function cancelarNotificacionesAgenda() {
  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  const propias = programadas.filter(item => String(item.content.data?.agendaKey ?? '').startsWith(PREFIJO));
  await Promise.all(propias.map(item => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}
