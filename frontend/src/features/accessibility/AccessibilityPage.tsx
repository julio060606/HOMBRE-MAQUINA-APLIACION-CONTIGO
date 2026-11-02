import { Link } from 'react-router-dom';

export function AccessibilityPage() {
  return <main className="max-w-3xl mx-auto p-5 sm:p-8 space-y-6">
    <h1 className="text-3xl font-heading font-bold">Accesibilidad y ayuda de CONTIGO</h1>
    <p>Queremos que puedas registrar tus respuestas y consultar tu seguimiento con claridad. CONTIGO es un prototipo académico de teleasistencia. Los datos del modo demostración son ficticios.</p>
    <section className="space-y-3"><h2 className="section-title">Cómo usar la aplicación</h2>
      <ul className="list-disc pl-6 space-y-2"><li>Abre «Opciones de lectura» para ampliar el texto hasta el 200 % o activar alto contraste.</li><li>Usa Tab y Mayús + Tab para recorrer los controles, y Enter o espacio para activarlos. El borde de foco indica dónde estás.</li><li>El enlace «Saltar al contenido principal» permite omitir la navegación repetida.</li><li>En la app paciente, abre «Tomas registradas hoy» para revisar o corregir una respuesta. Las instrucciones clínicas solo las modifica la clínica.</li><li>Las confirmaciones y los errores aparecen por escrito. La lectura por voz es opcional.</li></ul>
    </section>
    <section className="space-y-3"><h2 className="section-title">Ayuda y SOS de demostración</h2><p>El SOS del prototipo registra una petición de prueba. No llama a una ambulancia, no contacta servicios de emergencia ni garantiza la recepción por otra persona. Antes de registrar puedes cancelar.</p></section>
    <section className="space-y-3"><h2 className="section-title">Estado de accesibilidad</h2>
      <p><strong>Objetivo:</strong> WCAG 2.1 nivel AA en los flujos de paciente y cuidador de la versión académica v3.0.</p>
      <p><strong>Estado:</strong> parcialmente conforme y en evaluación. No se declara conformidad AA. Las comprobaciones automáticas y técnicas no sustituyen la revisión de todos los criterios aplicables ni las sesiones con personas que utilizan tecnologías de apoyo.</p>
      <p><strong>Comprobaciones documentadas:</strong> se registraron las cuatro tareas con teclado y zoom nativo del navegador al 200 %. Con NVDA 2026.3 se registraron toma, SOS, recuperación de errores y navegación del cuidador; la lectura completa de sus valores sigue pendiente. Son pruebas técnicas con datos sintéticos; no representan sesiones con participantes.</p>
      <p><strong>Limitaciones conocidas:</strong> las voces dependen del navegador; algunas fotografías de medicamentos no están disponibles; las gráficas disponen de valores en texto; faltan la validación con participantes y la revisión completa de los criterios aplicables.</p>
      <p>El alcance y los resultados técnicos se conservan en el paquete APF3 del proyecto. Última revisión de esta declaración: 2 de noviembre de 2026.</p>
      <p><strong>Plan de mejora:</strong> cerrar la revisión manual de los criterios aplicables, completar Figma y Stark y validar las tareas con personas diversas que usen sus tecnologías de apoyo. El equipo actualizará esta declaración con las barreras que permanezcan después de esas pruebas.</p>
    </section>
    <section className="space-y-3"><h2 className="section-title">Reportar una barrera</h2><p>Puedes <a className="underline font-semibold" href="https://github.com/julio060606/HOMBRE-MAQUINA-APLIACION-CONTIGO/issues/new" target="_blank" rel="noopener noreferrer">abrir una incidencia en el repositorio del equipo (se abre en otra pestaña)</a>. Indica la pantalla, qué intentabas hacer y qué ocurrió. Evita incluir información médica, contraseñas o datos personales. GitHub puede pedir una cuenta.</p></section>
    <Link to="/login" className="btn-primary">Ir al acceso de CONTIGO</Link>
  </main>;
}
