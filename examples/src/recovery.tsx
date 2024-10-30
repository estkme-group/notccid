import 'bootstrap/dist/css/bootstrap.min.css'
import ready from 'domready'
import { createRoot } from 'react-dom/client'
import { Entry } from './components/RecoveryEntry'

document.documentElement.translate = false
document.documentElement.classList.add('notranslate')

const container = document.createElement('main')
createRoot(container).render(<Entry />)

ready(() => {
  document.body = document.createElement('body')
  document.body.appendChild(container)
})
