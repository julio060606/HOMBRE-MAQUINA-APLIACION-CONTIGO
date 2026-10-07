import React, { Component, ReactNode } from 'react';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; error: Error | null }> {
  state = { failed: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { failed: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary capturó una excepción:', error, errorInfo);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="panel m-5 max-w-xl mx-auto" role="alert">
          <h1 className="section-title">No se pudo mostrar esta pantalla</h1>
          <p className="mt-3">Vuelve a cargar la aplicación para recuperar la vista. Solo las operaciones que terminaron de guardarse estarán disponibles.</p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 overflow-auto">
              <summary className="font-semibold cursor-pointer">Detalles del error técnico (desarrollo)</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack || this.state.error.message}</pre>
            </details>
          )}
          <button className="btn-primary mt-5" onClick={() => window.location.reload()} data-testid="app-reload">Volver a cargar</button>
        </main>
      );
    }
    return this.props.children;
  }
}

