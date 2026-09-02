export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">Polityka prywatności serwisu Novidia</h1>
        <p className="text-sm text-ink-muted">
          Data ostatniej aktualizacji: 17 sierpnia 2026 r.
        </p>

        <div className="space-y-4 text-sm leading-7 text-ink">
          <p>
            Szanujemy Twoją prywatność. Niniejsza polityka prywatności określa,
            w jaki sposób zbieramy, przetwarzamy i chronimy Twoje dane osobowe
            w ramach platformy Novidia.
          </p>

          <h2 className="text-base font-semibold text-ink">1. Wstęp</h2>
          <p>
            Korzystając z Serwisu, wyrażasz zgodę na zasady opisane w tym dokumencie.
          </p>

          <h2 className="text-base font-semibold text-ink">2. Administrator danych</h2>
          <p>
            Administratorem Twoich danych osobowych jest Dominik Mażul - Guty / Novidia News,
            z siedzibą w Szczecinie, kontakt: info@novidia.eu.
          </p>

          <h2 className="text-base font-semibold text-ink">3. Jakie dane zbieramy?</h2>
          <p>
            Zbieramy tylko te dane, które są niezbędne do działania platformy:
            dane rejestracyjne, dane aktywności, dane techniczne oraz dane płatności
            w przypadku subskrypcji Novidia+.
          </p>

          <h2 className="text-base font-semibold text-ink">4. Wykorzystanie sztucznej inteligencji</h2>
          <p>
            W ramach Serwisu korzystamy z narzędzi AI, takich jak modele
            przetwarzania języka naturalnego dostarczane przez Google Gemini
            oraz DeepSeek. Twoje zapytania i treści mogą być przesyłane do
            dostawców tych usług w celu przetworzenia.
          </p>

          <h2 className="text-base font-semibold text-ink">5. Cel przetwarzania danych</h2>
          <p>
            Twoje dane przetwarzamy w celu świadczenia usług, zapewnienia
            bezpieczeństwa i moderacji, obsługi rozliczeń oraz analizy statystyk.
          </p>

          <h2 className="text-base font-semibold text-ink">6. Podmioty trzecie</h2>
          <p>
            Twoje dane przekazujemy wyłącznie podmiotom niezbędnym do działania
            Serwisu, takim jak dostawcy usług IT, operatorzy płatności oraz
            władze szkolne w przypadku poważnych naruszeń Regulaminu.
          </p>

          <h2 className="text-base font-semibold text-ink">7. Twoje prawa</h2>
          <p>
            Zgodnie z RODO masz prawo dostępu do swoich danych, ich sprostowania,
            usunięcia, przenoszenia oraz wniesienia sprzeciwu wobec przetwarzania.
            Aby skorzystać z tych praw, napisz na adres: gdpr@novidia.eu.
          </p>

          <h2 className="text-base font-semibold text-ink">8. Pliki cookies i statystyki odwiedzin</h2>
          <p>
            Serwis wykorzystuje pliki cookies w celach utrzymania sesji,
            personalizacji ustawień oraz analizy statystycznej. Statystyki
            odwiedzin są zbierane wyłącznie po wyrażeniu zgody analitycznej
            (przełącznik w oknie preferencji plików cookies) — bez tej zgody
            Twoje odwiedziny nie są w ogóle rejestrowane.
          </p>
          <p>
            W ramach zgody analitycznej rejestrujemy: odwiedzoną ścieżkę strony
            oraz przybliżoną lokalizację (kraj i miasto) ustaloną na podstawie
            adresu IP, przeglądarkę i datę odwiedziny. Pełny adres IP nie jest
            przechowywany — przed zapisem jest skracany o ostatni oktet,
            a następnie zamieniany na jednokierunkowy hasz (SHA-256), który nie
            pozwala nam zidentyfikować konkretnego użytkownika. Dane statystyczne
            są automatycznie i nieodwracalnie usuwane po 90 dniach. Możesz
            w każdej chwili cofnąć zgodę, a zgromadzone dotychczas dane zostaną
            usunięte — także na Twoje żądanie za pośrednictwem adresu
            gdpr@novidia.eu.
          </p>

          <h2 className="text-base font-semibold text-ink">9. Ochrona przed nadużyciami</h2>
          <p>
            W celu ochrony Serwisu przed atakami i nadużyciami stosujemy
            limity liczby żądań oraz automatyczne blokowanie adresów IP
            naruszających regulamin (np. przy próbach wielokrotnego logowania).
            Takie blokady są usuwane automatycznie po upływie ograniczonego
            czasu. Administratorzy mogą również ręcznie zablokować adres IP
            użytkownika łamiącego Regulamin — ban działa natychmiastowo.
          </p>

          <h2 className="text-base font-semibold text-ink">10. Zmiany w polityce prywatności</h2>
          <p>
            O wszelkich zmianach w niniejszej polityce będziemy informować
            z wyprzedzeniem poprzez komunikat w Serwisie.
          </p>
        </div>
      </div>
    </main>
  );
}
