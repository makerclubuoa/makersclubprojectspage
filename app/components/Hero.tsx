export default function Hero() {
  return (
    <header className="hero">
      <span className="cross cross--tl" />
      <span className="cross cross--tr" />
      <span className="cross cross--bl" />
      <span className="cross cross--br" />
      <div className="container">
        <div className="seclabel" style={{ marginBottom: 48 }}>
          <span className="num">[01]</span>
          <span>Archive_</span>
          <span className="bar" />
          <span>STATUS: ONLINE · UPDATED MAY 2026</span>
        </div>

        <div className="hero__grid">
          <div className="hero__lead">
            <div className="hero__eyebrow">
              <span className="pip" />
              <span>Student-run · University of Auckland · est. 2019</span>
            </div>
            <h1 className="hero__title">
              Things our
              <br />
              members
              <br />
              <em>made.</em>
            </h1>
            <p className="hero__sub">
              Make_UoA is a student-run maker club at the University of Auckland. This is everything
              we&rsquo;ve built, baked, soldered, woven, printed, coded, sanded and sewn together.
              Borrow ideas. Make your own.
            </p>
            <div className="hero__cta-row">
              <a className="btn btn--primary" href="#projects">
                See the projects <span className="arr">→</span>
              </a>
              <a className="btn btn--ghost" href="#suggest">
                Suggest an event
              </a>
            </div>
          </div>

          <div className="hero__spec">
            <div className="spec-cell">
              <div className="k">
                <span>Members</span>
                <span>01</span>
              </div>
              <div className="v">
                112<small>active</small>
              </div>
            </div>
            <div className="spec-cell">
              <div className="k">
                <span>Projects logged</span>
                <span>02</span>
              </div>
              <div className="v">48</div>
            </div>
            <div className="spec-cell">
              <div className="k">
                <span>Workshops / sem</span>
                <span>03</span>
              </div>
              <div className="v">09</div>
            </div>
            <div className="spec-cell">
              <div className="k">
                <span>Open hours</span>
                <span>04</span>
              </div>
              <div className="v">
                TUE<small>6 — 9 pm</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
