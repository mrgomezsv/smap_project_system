import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('terms');
  return { title: `${t('title')} - Kidsfun`, description: t('lastUpdated') };
}

export default async function TerminosPage() {
  const t = await getTranslations('terms');
  return (
    <div className="bg-surface min-h-screen">
      <div className="container py-12 max-w-3xl">
        <header className="mb-8">
          <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-3">
            {t('badge')}
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-text-primary mb-3">
            {t('title')}
          </h1>
          <p className="text-text-muted">{t('intro')}</p>
        </header>

        <div className="bg-info/10 border border-info/30 text-info text-sm rounded-lg p-4">
          <strong>{t('lastUpdatedLabel')}:</strong> {t('lastUpdated')}
        </div>

        <div className="mt-8 space-y-8">
          <Section num={1} title={t('s1.title')} body={t('s1.body')} />
          <Section num={2} title={t('s2.title')} body={t('s2.body')} list={t.raw('s2.list') as string[]} />
          <Section num={3} title={t('s3.title')} body={t('s3.body')} list={t.raw('s3.list') as string[]} />
          <Section num={4} title={t('s4.title')} body={t('s4.body')} list={t.raw('s4.list') as string[]} />
          <Section num={5} title={t('s5.title')} body={t('s5.body')} list={t.raw('s5.list') as string[]} />
          <Section num={6} title={t('s6.title')} body={t('s6.body')} />
          <Section num={7} title={t('s7.title')} body={t('s7.body')} />
          <Section num={8} title={t('s8.title')} body={t('s8.body')} />
          <Section num={9} title={t('s9.title')} body={t('s9.body')} />
          <Section num={10} title={t('s10.title')} body={t('s10.body')} />

          <section>
            <h2 className="text-xl font-heading font-bold text-primary mb-3">
              11. {t('s11.title')}
            </h2>
            <p className="text-text-primary leading-relaxed mb-3">{t('s11.body')}</p>
            <ul className="text-text-primary space-y-1.5 mt-3">
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:hello@kidsfunyfiestasinfantiles.com" className="text-primary hover:underline">
                  hello@kidsfunyfiestasinfantiles.com
                </a>
              </li>
              <li>
                <strong>{t('phoneLabel')}:</strong>{' '}
                <a href="tel:+13478704240" className="text-primary hover:underline">
                  +1 (347) 870-4240
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Section({ num, title, body, list }: { num: number; title: string; body: string; list?: string[] }) {
  return (
    <section>
      <h2 className="text-xl font-heading font-bold text-primary mb-3">
        {num}. {title}
      </h2>
      <p className="text-text-primary leading-relaxed mb-3">{body}</p>
      {list && (
        <ul className="list-disc list-inside space-y-1.5 text-text-primary pl-2">
          {list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
