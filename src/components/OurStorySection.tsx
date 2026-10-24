import Image from "next/image";
import { Heart } from "lucide-react";

export function OurStorySection() {
  return (
    <section
      id="nossa-historia"
      aria-labelledby="nossa-historia-heading"
      className="scroll-mt-6 rounded-3xl border border-orange-200/80 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white p-5 shadow-sm shadow-orange-950/5 sm:p-7"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <div className="mx-auto shrink-0 md:mx-0">
          <div className="relative h-56 w-40 overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-orange-950/20 p-1 shadow-md sm:h-64 sm:w-44">
            <div className="relative h-full w-full overflow-hidden rounded-xl">
              <Image
                src="/herminio_evangelina.jpg"
                alt="Fotografia de Hermínio e Evangelina, inspiração do encontro da Família Tavares"
                fill
                sizes="(max-width: 640px) 160px, 176px"
                className="object-cover object-top"
              />
            </div>
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-orange-950">
            Hermínio &amp; Evangelina
          </p>
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/70 bg-orange-100/80 px-3 py-1 text-xs font-semibold text-orange-900">
            <Heart
              className="size-3.5 fill-orange-700 text-orange-700"
              aria-hidden="true"
            />
            Memória e Família
          </div>

          <h2
            id="nossa-historia-heading"
            className="text-xl font-bold tracking-tight text-orange-950 sm:text-2xl"
          >
            Nossa história
          </h2>

          <p className="text-sm leading-relaxed text-stone-700 sm:text-base">
            Mais do que reunir pratos à mesa, este encontro é uma oportunidade
            de celebrar os laços que nos unem.
          </p>

          <p className="text-xs leading-relaxed text-stone-500">
            Espaço dedicado às memórias e homenagens da Família Tavares.
          </p>
        </div>
      </div>
    </section>
  );
}
