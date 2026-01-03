import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from '../src/app/store.js'
import './index.css'
import App from './App.jsx'

// Provider - это "мост" между React и Redux, 
// который позволяет компонентам React 
// получать доступ к глобальному хранилищу 
// состояния Redux. 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
