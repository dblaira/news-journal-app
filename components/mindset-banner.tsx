interface MindsetBannerProps {
  headline: string
  subtitle: string
}

export function MindsetBanner({ headline, subtitle }: MindsetBannerProps) {
  return (
    <section className="mindset-banner">
      <div>
        <span className="mindset-kicker">Today's Mindset</span>
        <h2 className="mindset-title" id="mindsetHeadline">
          {headline}
        </h2>
      </div>
      <p className="mindset-subtitle" id="mindsetSubtitle">
        {subtitle}
      </p>
    </section>
  )
}

