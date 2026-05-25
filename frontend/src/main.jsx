import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  
  <React.StrictMode>
    
    <ConfigProvider locale={ptBR}>
      
      <QueryClientProvider client={queryClient}>
        <BrowserRouter> <App /> </BrowserRouter>
      </QueryClientProvider>

    </ConfigProvider>

  </React.StrictMode>
  
)