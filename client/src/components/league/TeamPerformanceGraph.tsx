import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from "recharts";
import api from "../../lib/api";

interface Props {
  teamId: number;
  periodId: number;
}

export default function TeamPerformanceGraph({ teamId, periodId }: Props) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/teams/${teamId}/performance/period/${periodId}`);
        if (data.ok && Array.isArray(data.performance)) {
          const formatted = data.performance.map((d: any) => ({
            ...d,
            shortDate: new Date(d.game_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          }));
          setData(formatted);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Graph fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [teamId, periodId]);

  if (loading) return <div className="p-8 text-center text-[10px] font-bold uppercase animate-pulse">Loading Chart Data...</div>;

  return (
    <div className="h-64 w-full p-4 bg-slate-50 border-t border-slate-200">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="shortDate" 
            fontSize={9} 
            fontWeight="bold" 
            tick={{fill: '#94a3b8'}} 
            axisLine={false}
          />
          <YAxis yAxisId="left" fontSize={9} fontWeight="bold" tick={{fill: '#64748b'}} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" fontSize={9} fontWeight="bold" tick={{fill: '#818cf8'}} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '4px', color: '#fff' }}
            itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
          />
          <Bar yAxisId="right" dataKey="active_players_count" fill="#e2e8f0" barSize={20} name="Players Active" />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="points" 
            stroke="#4f46e5" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#4f46e5' }} 
            activeDot={{ r: 6 }}
            name="Points"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}