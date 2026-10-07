import { Link } from 'react-router-dom';
export function RegisterPage() {
  return <main className="min-h-screen grid place-items-center p-6 bg-warmbg"><section className="panel max-w-lg">
    <h1 className="text-2xl font-bold">Acceso del cuidador</h1><p className="mt-3">El registro real necesita el servicio de autenticación y la autorización del paciente. La demostración ofrece cuentas de prueba separadas por rol.</p>
    <Link className="btn-primary mt-6" to="/login">Ver cuentas de demostración</Link>
  </section></main>;
}
