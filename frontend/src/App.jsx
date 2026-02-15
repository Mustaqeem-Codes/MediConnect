// frontend/src/App.jsx
import React from 'react';
import Navbar from './components/home/Navbar';
import Hero from './components/home/Hero';
import HowItWorks from './components/home/HowItWorks';
import Features from './components/home/Features';
import DoctorCategories from './components/home/DoctorCategories';
import Testimonials from './components/home/Testimonials';
import Stats from './components/home/Stats';
import CTASection from './components/home/CTASection';
import Footer from './components/home/Footer';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <DoctorCategories />
      <Testimonials />
      <Stats />
      <CTASection />
      <Footer />
      {/* <FloatingBookButton /> */}
    </div>
  );
}

export default App;