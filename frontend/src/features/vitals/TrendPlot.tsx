import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDate } from '../../domain/time';
export function TrendPlot({ data, series, label }: { data: { time: number }[]; series: { key: string; name: string; color: string }[]; label: string }) {
  return <div className="h-64 mt-5 min-w-0" role="img" aria-label={label}><ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ left: 0, right: 12, bottom: 10 }}><CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="time" type="number" domain={['dataMin','dataMax']} tickFormatter={v => formatDate(new Date(v).toISOString(), false)} tick={{fontSize:11}} minTickGap={40} />
      <YAxis domain={['auto','auto']} /><Tooltip labelFormatter={v => formatDate(new Date(Number(v)).toISOString())} /><Legend />
      {series.map(s => <Line key={s.key} name={s.name} dataKey={s.key} stroke={s.color} strokeWidth={3} dot={{r:4}} isAnimationActive={false} />)}
    </LineChart>
  </ResponsiveContainer></div>;
}
