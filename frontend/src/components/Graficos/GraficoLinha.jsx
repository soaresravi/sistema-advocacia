import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

function GraficoLinha({ data, title, ano }) {

    if (!data || Object.keys(data).length === 0) {
        return <div style={{ textAlign: 'center', padding: 40, fontSize: 12 }}>Sem dados para exibir</div>;
    }

    const chartData = meses.map((mes, index) => ({
        mes,
        quantidade: data[index + 1] || 0,
    }));

    return (
    
    <div style={{ width: '100%', height: 350 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14 }}>{title}</h4>
            <span style={{ fontSize: 12, color: '#888' }}>Ano: {ano}</span>
        </div>
        
        <ResponsiveContainer>
            
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="quantidade" name="Quantidade" stroke="#4e0c1e" strokeWidth={2} dot={{ fill: '#8b1a4a', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#c42560' }} />
                
            </LineChart>

        </ResponsiveContainer>
        
    </div>
    );
}

export default GraficoLinha;