import { Activity, CalendarDays, ClipboardList, FileText, LayoutDashboard, Pill, Settings2 } from 'lucide-react';

export const caregiverNavigation = [
  { title:'Seguimiento', items:[
    { to:'/dashboard', label:'Resumen', icon:LayoutDashboard },
    { to:'/medications', label:'Medicamentos', icon:Pill },
    { to:'/vitals', label:'Mediciones', icon:Activity },
    { to:'/appointments', label:'Citas médicas', icon:CalendarDays },
    { to:'/clinical-profile', label:'Ficha clínica', icon:ClipboardList },
  ] },
  { title:'Herramientas', items:[
    { to:'/reports', label:'Informes', icon:FileText },
    { to:'/settings', label:'Preferencias', icon:Settings2 },
  ] },
];
export const caregiverPageName = (pathname:string) => caregiverNavigation.flatMap(group=>group.items).find(item=>item.to===pathname)?.label ?? 'Mi panel';
