import Hero from '@/components/Hero'
import SearchForm from '@/components/SearchForm'
import Features from '@/components/Features'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-saharam-50 to-white">
      <Hero />
      <SearchForm />
      <Features />
      <Footer />
    </main>
  )
}