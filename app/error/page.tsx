"use client";

export default function ErrorPage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-white text-black py-8 md:py-10">
      <div className="inline-block max-w-3xl text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#FF3B3B] mb-4">
          Access Denied
        </h1>
        <p className="text-lg text-gray-600 mt-4 mb-8">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
      </div>
    </section>
  );
}