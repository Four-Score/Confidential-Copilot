import Image from "next/image";
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/sections/Hero';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
    </>
  );
}