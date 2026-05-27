import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Rectangle } from 'recharts';
import { useState, useEffect } from 'react';

const COLORS = ['#4e0c1e', '#8b1a4a', '#F18F01', '#C73E1D', '#3D5A80', '#6B8C42', '#9C89B8', '#EF476F', '#06D6A0', '#118AB2'];

const CustomBar = (props) => {
  
  const { x, y, width, height, index } = props;
  const barWidth = 30;
  const adjustedX = x + (width - barWidth) / 2;
  
  return (
    <Rectangle x={adjustedX} y={y} width={barWidth} height={height} fill={COLORS[index % COLORS.length]} radius={[8, 8, 0, 0]} />
  );

};

function GraficoBarraVertical({ data, title }) {

  const [key, setKey] = useState(0);

  useEffect(() => {

      const timeout = setTimeout(() => {
        setKey(prev => prev + 1);
      }, 200);

      return () => clearTimeout(timeout);

  }, []);
  
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ textAlign: 'center', padding: 20, fontSize: 12 }}>Sem dados para exibir</div>;
  }

  const chartData = Object.entries(data).map(([label, value], index) => ({
    label: label,
    value: typeof value === 'object' ? value.quantidade : value,
    color: COLORS[index % COLORS.length],
  }));

  const chartHeight = 300;

  const legendItems = chartData.map((item) => ({
    label: item.label,
    color: item.color,
  }));

  return (
  
  <div style={{ width: '100%', height: chartHeight}}>
    
    <h4 style={{ textAlign: 'center', marginBottom: 8, fontSize: 14 }}>{title}</h4>
      
    <div style={{ height: chartHeight }}>
      
      <ResponsiveContainer key={key}>
        
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${value}`, 'Quantidade']} />
          <Bar dataKey="value" shape={<CustomBar />} />
        </BarChart>

      </ResponsiveContainer>

    </div>
    
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16,  flexWrap: 'wrap' , marginTop: -60 }}>
      
      {legendItems.map((item) => (
        
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: 2 }} />
          <span style={{ fontSize: 11 }}>{item.label}</span>
        </div>

      ))}

    </div>

  </div>
  );
}

export default GraficoBarraVertical;