import Header from '@/components/Header'
import Hero from '@/components/Hero'
import SearchForm from '@/components/SearchForm'
import Features from '@/components/Features'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-saharan-50 to-white">
      <Header />
      <Hero />
      <SearchForm />
      <Features />
      <Footer />
    </main>
  )
}