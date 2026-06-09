import Link from 'next/link'
import { Logo } from '@/components/logo'

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div>
          <Link href="/" style={{ display: 'inline-block' }}>
            <Logo width={125} />
          </Link>
          <p className="footer-brand-text">
            La plateforme dédiée à l&apos;organisation et au suivi en direct des enduros de pêche à
            la carpe. Pour les organisateurs, les commissaires et les pêcheurs passionnés.
          </p>
        </div>
        <div className="footer-col">
          <h4>Compétitions</h4>
          <ul>
            <li>
              <Link href="/enduros">Enduros en direct</Link>
            </li>
            <li>
              <Link href="/enduros">Calendrier</Link>
            </li>
            <li>
              <Link href="/classements">Classements</Link>
            </li>
            <li>
              <Link href="/enduros">Records</Link>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Espace Pro</h4>
          <ul>
            <li>
              <Link href="/organisateurs">Organisateurs</Link>
            </li>
            <li>
              <Link href="/organisateurs">Commissaires</Link>
            </li>
            <li>
              <Link href="/tarifs">Tarifs</Link>
            </li>
            <li>
              <Link href="/faq">Documentation</Link>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li>
              <Link href="/contact">Support</Link>
            </li>
            <li>
              <Link href="/contact">Partenariats</Link>
            </li>
            <li>
              <Link href="/faq">Mentions légales</Link>
            </li>
            <li>
              <Link href="/faq">CGU</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© 2026 CarpStrike — Tous droits réservés</div>
        <div>Made with passion for carp anglers 🎣</div>
      </div>
    </footer>
  )
}
