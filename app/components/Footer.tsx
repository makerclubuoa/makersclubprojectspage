export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__row">
          <div>
            <h4>
              Got a thing you <em className="gradient-text">made</em>?
            </h4>
            <p>
              Submissions for the archive are open all the time. Half-finished, broken or weird is
              welcome — that&rsquo;s usually where the good stuff is.
            </p>
            <a className="btn btn--gradient" href="/submit" style={{ marginTop: 14, display: 'inline-flex' }}>
              Submit a project <span className="arr">→</span>
            </a>
          </div>

          <div>
            <h5>Hang out</h5>
            <ul>
              <li><a href="#">Open hours · Tue 6pm</a></li>
              <li><a href="#suggest">Workshops</a></li>
              <li><a href="#">Discord</a></li>
              <li><a href="#">Instagram</a></li>
            </ul>
          </div>

          <div>
            <h5>Make_UoA</h5>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Sponsors</a></li>
              <li><a href="#">Constitution</a></li>
              <li><a href="https://makeuoa.nz">makeuoa.nz ↗</a></li>
            </ul>
          </div>

          <div>
            <h5>Index</h5>
            <ul>
              <li><a href="#">01 _ Archive</a></li>
              <li><a href="#projects">02 _ Projects</a></li>
              <li><a href="#suggest">03 _ Suggest</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© 2026 Make_UoA · A registered AUSA club</span>
          <span>Built by members, for members.</span>
        </div>
      </div>
    </footer>
  )
}
