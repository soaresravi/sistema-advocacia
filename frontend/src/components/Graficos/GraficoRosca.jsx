import { PieChart, Pie, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { useState, useEffect } from 'react';

const COLORS = ['#4e0c1e', '#8b1a4a', '#F18F01', '#C73E1D', '#3D5A80', '#6B8C42', '#9C89B8', '#EF476F', '#06D6A0', '#118AB2'];

const renderActiveShape = (props) => {
  
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={4} />
  );

};

function GraficoRosca({ data, title }) {

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
    percentual: typeof value === 'object' ? value.percentual : 0,
    fill: COLORS[index % COLORS.length],
  }));

  const legendItems = chartData.map((item) => ({
    label: item.label,
    color: item.fill,
  }));

  return (
  
  <div style={{ width: '100%', height: 270 }}>
    
    <h4 style={{ textAlign: 'center', marginBottom: 8, fontSize: 14 }}>{title}</h4>
      
    <div style={{ height: 220 }}>
      
      <ResponsiveContainer key={key}>
        
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="label" label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`} labelLine={false} shape={renderActiveShape} />
          <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentual}%)`, name]} />
        </PieChart>

      </ResponsiveContainer>

    </div>

    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
      
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

export default GraficoRosca;