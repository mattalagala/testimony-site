import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { usePageTitle } from '../lib/usePageTitle';

/*
 * DRAFT COPY — Matt to rewrite/approve before launch (tracked in the project brief).
 * Scripture quotations are from the World English Bible (public domain), so they can
 * be quoted freely; swap translations once licensing is confirmed if preferred.
 */

function Verse({ children, cite }: { children: ReactNode; cite: string }) {
  return (
    <blockquote className="my-6 border-l-4 border-dawn pl-5">
      <p className="font-serif text-[1.15rem] italic leading-relaxed text-night">{children}</p>
      <footer className="mt-2 text-sm text-slate">{cite}</footer>
    </blockquote>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-10">
      <h2 id={id} className="font-serif text-3xl font-semibold leading-tight text-night">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[1.08rem] leading-[1.75]">{children}</div>
    </section>
  );
}

export function KnowJesusPage() {
  usePageTitle('Know Jesus');

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mx-auto max-w-[40rem] pb-24">
        <header className="pb-12 pt-14 sm:pt-20">
          <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-night sm:text-6xl">
            You can know Jesus too.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate">
            Every story on this site points to the same Person. Here is the good news they
            discovered, in plain words — and how you can respond to Him today.
          </p>
        </header>

        <div className="space-y-12">
          <Section id="loved" title="God made you, and He loves you">
            <p>
              You aren’t an accident. God created you on purpose and knows you completely — and He
              loves you more than you’ve ever been loved.
            </p>
            <Verse cite="John 3:16">
              For God so loved the world, that he gave his one and only Son, that whoever believes
              in him should not perish, but have eternal life.
            </Verse>
          </Section>

          <Section id="broken" title="Something is broken between us and God">
            <p>
              We all go our own way. The Bible calls it sin: the wrong we do, the good we don’t, and
              hearts that push God out. It separates us from Him, and we can’t fix it by trying
              harder or being good enough.
            </p>
            <Verse cite="Romans 3:23; 6:23">
              For all have sinned, and fall short of the glory of God … For the wages of sin is
              death, but the free gift of God is eternal life in Christ Jesus our Lord.
            </Verse>
          </Section>

          <Section id="jesus" title="Jesus came to make it right">
            <p>
              Jesus is God’s Son. He lived the life we couldn’t, died on the cross in our place to
              pay for our sin, and rose from the dead three days later. Because He is alive, He can
              still change lives today — that’s what the stories here are about.
            </p>
            <Verse cite="Romans 5:8">
              But God commends his own love toward us, in that while we were yet sinners, Christ
              died for us.
            </Verse>
          </Section>

          <Section id="respond" title="You can receive Him today">
            <p>
              Forgiveness and new life are a gift. You can’t earn them; you receive them by turning
              from your sin and trusting Jesus as your Savior and Lord.
            </p>
            <Verse cite="Romans 10:9">
              If you will confess with your mouth that Jesus is Lord, and believe in your heart that
              God raised him from the dead, you will be saved.
            </Verse>
            <p>
              There are no magic words — God looks at your heart. If you’re ready, you could pray
              something like this:
            </p>
            <div className="rounded-2xl bg-mist px-6 py-6 font-serif text-[1.12rem] leading-relaxed text-night sm:px-8">
              <p>
                Jesus, I know I’ve sinned and I can’t fix it on my own. I believe you died for me
                and rose again. Please forgive me. I turn from my sin and I trust you as my Savior
                and my Lord. Give me new life and help me follow you. Amen.
              </p>
            </div>
          </Section>

          <Section id="next" title="If you just prayed">
            <p>
              Welcome to God’s family. This is the start of a relationship, not the end of a
              ceremony. A few things will help you grow:
            </p>
            <ul className="list-disc space-y-3 pl-6 marker:text-dawn-deep">
              <li>
                <strong className="font-semibold text-night">Tell someone.</strong> A Christian
                friend or family member will want to celebrate with you and help you take next
                steps.
              </li>
              <li>
                <strong className="font-semibold text-night">Read the Gospel of John.</strong> A
                chapter a day is a good pace. You’ll get to know Jesus through what He said and did.
              </li>
              <li>
                <strong className="font-semibold text-night">Find a church.</strong> Look for a
                local church that teaches the Bible and talks about Jesus. Following Him was never
                meant to be done alone.
              </li>
              <li>
                <strong className="font-semibold text-night">Keep talking to God.</strong> Prayer is
                simply talking with Him — honestly, any time, about anything.
              </li>
            </ul>
            <p>
              Not ready yet? That’s okay. Keep reading the{' '}
              <Link
                to="/"
                className="font-medium text-night underline decoration-dawn decoration-2 underline-offset-4"
              >
                stories
              </Link>{' '}
              and bring your questions to God. He isn’t going anywhere.
            </p>
          </Section>

          <aside className="rounded-xl border border-line px-5 py-4 text-[0.95rem] text-slate">
            If you’re in crisis or thinking about ending your life, please call or text{' '}
            <a href="tel:988" className="font-semibold text-night underline underline-offset-2">
              988
            </a>{' '}
            (Suicide &amp; Crisis Lifeline, US) or your local emergency number now. You matter, and
            help is available.
          </aside>
        </div>
      </div>
    </div>
  );
}
