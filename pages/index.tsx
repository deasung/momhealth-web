import Head from "next/head";
import Header from "../components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      <Head>
        <title>MomHealth Web</title>
        <meta name="description" content="MomHealth 웹 애플리케이션" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-red-500 mb-4 bg-blue-200 p-4 rounded-lg">
            MomHealth
          </h1>
          <p className="text-lg text-green-600 bg-yellow-100 p-2 rounded">
            건강 관리 플랫폼
          </p>
        </div>
      </main>
    </div>
  );
}
