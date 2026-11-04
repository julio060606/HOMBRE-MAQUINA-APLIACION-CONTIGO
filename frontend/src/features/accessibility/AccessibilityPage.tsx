import { Link } from 'react-router-dom';

export function AccessibilityPage() {
  return <main data-page-path="/accessibility" className="max-w-3xl mx-auto p-5 sm:p-8 space-y-6">
    <h1 className="text-3xl font-heading font-bold">Accesibilidad y ayuda de CONTIGO</h1>
    <p>Queremos que puedas registrar tus respuestas y consultar tu seguimiento con claridad. CONTIGO es un prototipo académico de teleasistencia. Los datos del modo demostración son ficticios.</p>
    <section className="space-y-3"><h2 className="section-title">Cómo usar la aplicación</h2>
      <ul className="list-disc pl-6 space-y-2"><li>Abre «Opciones de lectura» para ampliar el texto hasta el 200 % o activar alto contraste.</li><li>Usa Tab y Mayús + Tab para recorrer los controles, y Enter o espacio para activarlos. El borde de foco indica dónde estás.</li><li>El enlace «Saltar al contenido principal» permite omitir la navegación repetida.</li><li>En la app paciente, abre «Tomas registradas hoy» para revisar o corregir una respuesta. Las instrucciones clínicas solo las modifica la clínica.</li><li>Las confirmaciones y los errores aparecen por escrito. La lectura por voz es opcional.</li></ul>
    </section>
    <section className="space-y-3"><h2 className="section-title">Escuchar, hablar y comunicarse</h2>
      <ul className="list-disc pl-6 space-y-3">
        <li><strong>Si no escuchas o prefieres leer:</strong> activa «Modo sin sonido» en «Opciones de lectura». Las instrucciones, confirmaciones y errores se muestran por escrito. Puedes activar vibración opcional si tu dispositivo la admite.</li>
        <li><strong>Si tienes dificultades para hablar:</strong> abre «Comunicarme», elige una frase o escribe un mensaje y muéstralo en grande. La persona que está contigo puede responder en el mismo dispositivo. También puedes pedir que se lea tu mensaje en voz alta cuando el sonido esté activado.</li>
        <li><strong>Para pedir ayuda a distancia:</strong> al pulsar «SOS · Pedir ayuda» se envía una solicitud al dashboard. Puedes escribir mientras esperas. Cuando una persona acepta atender, pueden intercambiar mensajes o activar ambos micrófonos para hablar. La clínica es de demostración.</li>
        <li><strong>Si necesitas mayor precisión:</strong> activa «Controles más grandes». «Reducir animaciones» limita el movimiento de la interfaz. También puedes ampliar el texto, activar alto contraste y usar el teclado.</li>
      </ul>
      <p>El tablero «Comunicarme» es una conversación cercana: no envía sus textos ni los guarda al cerrarlo. El SOS conectado guarda la solicitud y los mensajes en el servidor. No se graba el audio. La vibración y las voces dependen del dispositivo; siempre puedes usar el texto.</p>
    </section>
    <section className="space-y-3"><h2 className="section-title">Ayuda y SOS de demostración</h2><p>El primer toque envía la solicitud. «Esperando respuesta» indica que todavía nadie la ha aceptado. Para volver, elige «Finalizar y volver»: se apaga el micrófono y se cierra la conversación. El aviso permanece en el historial.</p><p>Para practicar, abre una cuenta paciente y una cuenta autorizada del dashboard en sesiones de navegador diferentes. El audio necesita permisos de micrófono y HTTPS o localhost. Esta versión permite probar audio en la misma red; no incorpora un servicio de llamadas telefónicas ni garantiza conexión entre redes distintas.</p><p>En modo sin conexión, el SOS solo registra un aviso local de prueba. Este prototipo no contacta servicios de emergencia.</p></section>
    <section className="space-y-3"><h2 className="section-title">Estado de accesibilidad</h2>
      <p><strong>Objetivo:</strong> WCAG 2.1 nivel AA en los flujos de paciente y cuidador de la versión académica v3.0.</p>
      <p><strong>Estado:</strong> parcialmente conforme y en evaluación. No se declara conformidad AA. Las comprobaciones automáticas y técnicas no sustituyen la revisión de todos los criterios aplicables ni las sesiones con personas que utilizan tecnologías de apoyo.</p>
      <p><strong>Comprobaciones documentadas:</strong> se conservan revisiones técnicas de las pantallas de paciente y cuidador, recorridos con teclado y texto ampliado. Las herramientas de comunicación tienen un registro de comprobaciones separado de la entrega APF3 anterior. Son pruebas con datos sintéticos; falta validarlas con personas sordas, con dificultades para hablar y con otras necesidades de acceso. Las pruebas anteriores de zoom nativo y NVDA son antecedentes: falta repetirlas sobre esta versión y completar la lectura de los valores con el lector de pantalla.</p>
      <p><strong>Limitaciones conocidas:</strong> las voces dependen del navegador; algunas fotografías de medicamentos no están disponibles; las gráficas disponen de valores en texto; faltan la validación con participantes y la revisión completa de los criterios aplicables.</p>
      <p>El alcance y los resultados técnicos se conservan en el paquete APF3 del proyecto. Última revisión de esta declaración: 3 de noviembre de 2026.</p>
      <p><strong>Plan de mejora:</strong> cerrar la revisión manual de los criterios aplicables, completar Figma y Stark y validar las tareas con personas diversas que usen sus tecnologías de apoyo. El equipo actualizará esta declaración con las barreras que permanezcan después de esas pruebas.</p>
    </section>
    <section className="space-y-3"><h2 className="section-title">Reportar una barrera</h2><p>Puedes <a className="underline font-semibold" href="https://github.com/julio060606/HOMBRE-MAQUINA-APLIACION-CONTIGO/issues/new" target="_blank" rel="noopener noreferrer">abrir una incidencia en el repositorio del equipo (se abre en otra pestaña)</a>. Indica la pantalla, qué intentabas hacer y qué ocurrió. Evita incluir información médica, contraseñas o datos personales. GitHub puede pedir una cuenta.</p></section>
    <Link to="/login" className="btn-primary">Ir al acceso de CONTIGO</Link>
  </main>;
}
