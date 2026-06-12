import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Rectangle } from 'recharts';
import { useState, useEffect } from 'react';

const COLORS = ['#4e0c1e', '#8b1a4a', '#F18F01', '#C73E1D', '#3D5A80', '#6B8C42', '#9C89B8', '#EF476F', '#06D6A0', '#118AB2'];

const CustomBar = (props) => {

    const { x, y, width, height, index } = props;
    const barHeight = 25;
    const adjustedY = y + (height - barHeight) / 2;
    
    return (
        <Rectangle x={x} y={adjustedY} width={width} height={barHeight} fill={COLORS[index % COLORS.length]} radius={[0, 8, 8, 0]} />
    );

};

function GraficoBarraHorizontal({ data, title, isMobile }) {

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
    
    const chartData = Object.entries(data).map(([label, value]) => ({
        label: label,
        value: typeof value === 'object' ? value.quantidade : value,
    }));
    
    const chartHeight = Math.min(500, Math.max(200, chartData.length * 45));
    
    const legendItems = chartData.map((item, index) => ({
        label: item.label,
        color: COLORS[index % COLORS.length],
    }));
    
    return (
    
    <div style={{ width: '100%', minHeight: chartHeight + 60 }}>
        
        <h4 style={{ textAlign: 'center', marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>{title}</h4>
        
        <div style={{ height: chartHeight }}>
           
            <ResponsiveContainer key={key}>

                <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: isMobile ? 20 : 30, left: isMobile ? 80 : 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 11 }} />
                    <YAxis type="category" dataKey="label" width={isMobile ? 80 : 120} tick={{ fontSize: isMobile ? 9 : 11 }} />
                    <Tooltip formatter={(value) => [`${value}`, 'Quantidade']} />
                    <Bar dataKey="value" shape={<CustomBar />} />
                </BarChart>

            </ResponsiveContainer>

        </div>
        
        <div style={{  display: 'flex', justifyContent: 'center',  gap: isMobile ? 8 : 16,  marginTop: 16,  marginBottom: 8, flexWrap: 'wrap' }}>
            
            {legendItems.map((item) => (
            
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, backgroundColor: item.color, borderRadius: 2 }} />
                    <span style={{ fontSize: isMobile ? 9 : 11 }}>{item.label}</span>
                </div>
            ))}

        </div>

    </div>
    );
}

export default GraficoBarraHorizontal;