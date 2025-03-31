import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-center">
      <h1 className="text-4xl font-bold text-blue-600">Tailwind is working!</h1>
      <p className="mt-4 text-lg text-gray-700">
        If you can see this styled page, Tailwind is set up correctly.
      </p>
    </main>
  );
}
