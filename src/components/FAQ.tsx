import React from 'react';

export const FAQ: React.FC = () => {
  return (
    <section id="faq" className="section">
      <div className="section__head">
        <h2 className="h2">FAQ</h2>
        <p className="muted">Kurz &amp; klar.</p>
      </div>

      <div className="grid2">
        {/* Bestehende FAQ-Karten */}
        <details className="card" open>
          <summary>Warum Soft‑Limits?</summary>
          <p>Progressive Fees machen Spam unattraktiv, ohne legitime Creator zu blockieren.</p>
        </details>

        <details className="card">
          <summary>Warum auf NeonLaunch Deployn?</summary>
          <p>
            NeonLaunch ist der schnellste, sicherste und benutzerfreundlichste Weg, einen Token auf BSC zu erstellen — mit
            integrierter Anti‑Bot Logik, dynamischen Fees und sofortiger Blockchain‑Transparenz.
          </p>
        </details>

        {/* Impressum als einklappbare Karte */}
        <details className="card">
          <summary>Impressum</summary>
          <article className="prose">
            <h3 className="h3">NeonLaunch</h3>
            <p>
              Inhaber: <strong>Boris Wagner</strong><br />
              Bürgermeister‑Beheim‑Str. 5<br />
              63165 Mühlheim am Main<br />
              Deutschland
            </p>

            <h4>Kontakt</h4>
            <p>
              {/* Optional ausfüllen: */}
              {/* Telefon:  */}
              {/* E‑Mail:  */}
            </p>

            <h4>Umsatzsteuer‑ID</h4>
            <p>Keine USt‑ID vorhanden.</p>

            <h4>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h4>
            <p>
              Boris Wagner<br />
              Bürgermeister‑Beheim‑Str. 5<br />
              63165 Mühlheim am Main
            </p>

            <h4>EU‑Streitschlichtung</h4>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online‑Streitbeilegung (OS‑Plattform) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr/
              </a>.
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </article>
        </details>

        {/* Datenschutzerklärung als einklappbare Karte */}
        <details className="card">
          <summary>Datenschutzerklärung</summary>
          <article className="prose">
            <h3 className="h3">1. Verantwortlicher</h3>
            <p>
              Boris Wagner<br />
              Bürgermeister‑Beheim‑Str. 5<br />
              63165 Mühlheim am Main<br />
              {/* Optional: E‑Mail ergänzen */}
              {/* E‑Mail:  */}
            </p>

            <h3 className="h3">2. Erhebung und Verarbeitung personenbezogener Daten</h3>

            <h4>a) Beim Besuch der Website</h4>
            <p>
              Beim Aufrufen unserer Website werden automatisch durch den Browser Daten an unseren Server übermittelt:
              IP‑Adresse, Datum und Uhrzeit der Anfrage, Referrer‑URL, verwendeter Browser, Betriebssystem.
              Die Verarbeitung ist technisch erforderlich, um die Website darzustellen und die Stabilität sowie Sicherheit zu gewährleisten.
              <br />
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO.
            </p>

            <h4>b) Kontaktaufnahme</h4>
            <p>
              Bei einer Kontaktaufnahme per E‑Mail oder Formular verarbeiten wir Name, E‑Mail‑Adresse sowie den Inhalt der
              Nachricht zur Bearbeitung des Anliegens.
              <br />
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO.
            </p>

            <h4>c) Cookies</h4>
            <p>
              Wir können Cookies einsetzen. Technisch notwendige Cookies dienen der Bereitstellung der Website
              (Art. 6 Abs. 1 lit. f DSGVO). Analyse‑/Marketing‑Cookies werden nur nach Einwilligung eingesetzt
              (Art. 6 Abs. 1 lit. a DSGVO). Die Einwilligung ist jederzeit für die Zukunft widerrufbar.
            </p>

            <h3 className="h3">3. Weitergabe von Daten</h3>
            <p>
              Eine Übermittlung personenbezogener Daten an Dritte erfolgt nur, wenn dies zur Vertragserfüllung notwendig ist,
              eine gesetzliche Verpflichtung besteht oder eine Einwilligung vorliegt.
            </p>

            <h3 className="h3">4. Hosting</h3>
            <p>
              Die Website wird bei einem technischen Dienstleister (Webhoster) betrieben, der die Daten in unserem Auftrag
              gemäß Art. 28 DSGVO verarbeitet. Details zum konkreten Anbieter können auf Anfrage bereitgestellt und hier ergänzt werden.
            </p>

            <h3 className="h3">5. Speicherdauer</h3>
            <p>
              Personenbezogene Daten werden gelöscht, sobald der Zweck der Verarbeitung entfällt oder gesetzliche
              Aufbewahrungsfristen ablaufen.
            </p>

            <h3 className="h3">6. Betroffenenrechte</h3>
            <p>
              Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO),
              Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO), Widerspruch (Art. 21 DSGVO)
              sowie Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO).
            </p>

            <h3 className="h3">7. Beschwerderecht</h3>
            <p>
              Zuständige Aufsichtsbehörde in Hessen:
              <br />
              <strong>Der Hessische Beauftragte für Datenschutz und Informationsfreiheit (HBDI)</strong>{' '}
              <a href="https://datenschutz.hessen.de/" target="_blank" rel="noopener noreferrer">
                https://datenschutz.hessen.de/
              </a>
            </p>

            <h3 className="h3">8. Sicherheit</h3>
            <p>
              Wir setzen technische und organisatorische Maßnahmen ein, um personenbezogene Daten gegen Verlust, Zerstörung,
              Zugriff, Veränderung oder Verbreitung durch unbefugte Personen zu schützen.
            </p>

            <h3 className="h3">9. Änderungen dieser Datenschutzerklärung</h3>
            <p>
              Diese Datenschutzerklärung wird bei Bedarf aktualisiert. Die jeweils aktuelle Fassung ist auf dieser Seite abrufbar.
            </p>
          </article>
        </details>
      </div>
    </section>
  );
};