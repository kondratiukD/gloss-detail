import './App.scss'
import { Difference } from './components/Difference'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { HowItWorks } from './components/HowItWorks'
import { MainPage } from './components/MainPage'
import { Package } from './components/Package'
import { RequestQuote } from './components/RequestQuote'

export const App: React.FC = () => {
  return (
    <div className="App">
      <Header />

      <main className="App__main">
        <MainPage />
        <HowItWorks />
        <Difference />
        <Package />
        <RequestQuote />
      </main>
      <Footer />
    </div>
  )
}

