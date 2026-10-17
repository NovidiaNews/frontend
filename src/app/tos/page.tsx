export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">Warunki korzystania z usługi Novidia</h1>
        <p className="text-sm text-ink-muted">
          Ostatnia aktualizacja: 4 października 2026 r.
        </p>

        <div className="space-y-4 text-sm leading-7 text-ink">
          <p>
            Niniejszy Regulamin (dalej: „Regulamin") stanowi umowę zawieraną
            pomiędzy podmiotem korzystającym z platformy internetowej Novidia
            (dalej: „Użytkownik") a Administratorem Serwisu, określającą prawa
            i obowiązki stron oraz zasady świadczenia usług drogą elektroniczną
            w rozumieniu ustawy z dnia 18 lipca 2002 r. o świadczeniu usług
            drogą elektroniczną. Zawarcie umowy następuje poprzez rejestrację
            w Serwisie albo rozpoczęcie korzystania z jego funkcjonalności,
            co jest równoznaczne z akceptacją Regulaminu oraz Polityki
            Prywatności w brzmieniu obowiązującym w chwili dokonania czynności.
          </p>

          <h2 className="text-base font-semibold text-ink">1. Postanowienia ogólne i przedmiot umowy</h2>
          <p>
            Serwis stanowi neutralną światopoglądowo platformę edukacyjną
            przeznaczoną dla uczniów oraz członków społeczności szkolnej.
            Przedmiotem umowy jest udostępowanie Użytkownikowi narzędzi
            publikacyjnych, komunikacyjnych oraz moderacyjnych. Użytkownik
            zobowiązuje się korzystać z Serwisu zgodnie z obowiązującymi
            przepisami prawa, niniejszym Regulaminem oraz dobrymi obyczajami.
          </p>

          <h2 className="text-base font-semibold text-ink">2. Rejestracja, weryfikacja wieku i dane konta</h2>
          <p>
            Rejestracja konta następuje w procesie wieloetapowym obejmującym
            podanie adresu poczty elektronicznej oraz nazwy użytkownika,
            weryfikację adresu za pomocą jednorazowego kodu, ustalenie hasła
            oraz podanie daty urodzenia. Podanie daty urodzenia jest warunkiem
            zawarcia umowy i służy weryfikacji wieku Użytkownika oraz wyliczeniu
            grupy wiekowej prezentowanej publicznie; data urodzenia jako taka
            pozostaje daną poufną, chyba że Użytkownik wyrazi odrębną zgodę
            na ujawnienie dnia i miesiąca. Użytkownicy, którzy nie ukończyli
            13. roku życia, zobowiązani są do podania adresu poczty elektronicznej
            przedstawiciela ustawowego, a ich konta podlegają ograniczeniom
            funkcjonalnym wynikającym z obowiązujących przepisów o ochronie
            danych osobowych. Użytkownik oświadcza, że podane dane są prawdziwe
            i nie naruszają praw osób trzecich.
          </p>

          <h2 className="text-base font-semibold text-ink">3. Dołączanie do organizacji szkolnej</h2>
          <p>
            Dostęp do Serwisu może być uzyskany również poprzez dołączenie do
            organizacji szkolnej zarejestrowanej w ramach platformy. W takim
            przypadku Użytkownik zobowiązany jest posługiwać się jednorazowym
            kodem dostępu lub Kluczem Novidia otrzymanym od nauczyciela albo
            administratora danej placówki. Rejestracja placówki odbywa się
            w odrębnym procesie dostępnym pod adresem /register/school i wymaga
            podania m.in. numeru RSPO oraz numeru telefonu szkoły. Podmiot
            dokonujący rejestracji placówki oświadcza, że działa w imieniu
            i na rzecz tej placówki.
          </p>

          <h2 className="text-base font-semibold text-ink">4. Zasady publikacji i moderacja</h2>
          <p>
            Użytkownik zobowiązuje się do publikowania treści zgodnych z
            zasadami bezpieczeństwa, kultury oraz rzetelnej informacji.
            Zabronione jest w szczególności rozpowszechnianie treści
            politycznych i propagandowych o charakterze partyjnym, rasistowskich,
            ksenofobicznych, nawołujących do nienawiści lub przemocy, naruszających
            dobra osobiste osób trzecich, zawierających wulgaryzmy oraz hejt.
            Administrator stosuje system moderacji z wykorzystaniem algorytmów
            sztucznej inteligencji; decyzje moderacyjne mogą być weryfikowane
            przez osoby uprawnione. Naruszenie zasad skutkować może zastosowaniem
            środków przewidzianych w Regulaminie, kolejno: ostrzeżenia
            (żółta kartka), ostatecznego ostrzeżenia, a w przypadku uporczywego
            lub rażącego naruszenia — zawieszenia albo permanentnego usunięcia konta.
          </p>

          <h2 className="text-base font-semibold text-ink">5. Hierarchia uprawnień i środki dyscyplinujące</h2>
          <p>
            System uprawnień Serwisu opiera się na hierarchii ról o ustalonych
            wartościach liczbowych. Osoba uprawniona nie może zastosować środka
            dyscyplinującego (w szczególności zablokowania konta) wobec podmiotu
            danych posiadającego rolę równą lub wyższą; w szczególności
            administrator systemu nie może zablokować konta właściciela platformy.
            Decyzje o zablokowaniu konta podejmowane są z zachowaniem zasady
            proporcjonalności i podlegają rejestracji w dzienniku zdarzeń
            administracyjnych.
          </p>

          <h2 className="text-base font-semibold text-ink">6. Wsparcie AI</h2>
          <p>
            Korzystanie z narzędzi wspomaganych sztuczną inteligencją, w tym
            asystenta Novii, odbywa się na wyłączną odpowiedzialność Użytkownika.
            Użytkownik zobowiązany jest do samodzielnej weryfikacji merytorycznej
            treści wygenerowanych przez systemy AI; Administrator nie ponosi
            odpowiedzialności za błędy, halucynacje ani nieścisłości wygenerowane
            przez te systemy, o ile stanowią one niezamierzoną ingerencję modelu.
          </p>

          <h2 className="text-base font-semibold text-ink">7. Subskrypcje Novidia+</h2>
          <p>
            Plan Novidia+ umożliwia dostęp do zaawansowanych modeli AI oraz
            funkcji premium. W przypadku zawieszenia lub zablokowania konta
            okres subskrypcji pozostaje zawieszony na czas trwania blokady.
            Szczegóły rozliczeń reguluje odrębna dokumentacja płatnicza.
          </p>

          <h2 className="text-base font-semibold text-ink">
            8. Zbiór danych technicznych, profil urządzenia i pliki cookies
          </h2>
          <p>
            Użytkownik przyjmuje do wiadomości, że — po wyrażeniu zgody
            kategorii „analityczne" w mechanizmie preferencji plików cookies —
            Administrator gromadzi rozszerzony profil techniczny urządzenia
            obejmujący w szczególności rozdzielczość i głębię kolorów ekranu,
            proporcje okna przeglądarki, listę wykrytych czcionek, ciąg
            User-Agent, platformę, preferowany język, strefę czasową, liczbę
            rdzeni procesora, przybliżoną wielkość pamięci, parametry karty
            graficznej (WebGL) oraz ustawienia systemowe motywu i redukcji
            animacji, jak również adres IP w postaci skróconej i zahaszowanej.
            Brak zgody oznacza, że żadne odwiedziny ani dane urządzenia nie są
            rejestrowane. Zakres, podstawy prawne i okresy przetwarzania określa
            Polityka Prywatności, stanowiąca integralną załącznik do Regulaminu.
            Funkcje personalizacji interfejsu, w tym indywidualny kolor akcentu,
            służą wyłącznie celom prezentacji wizualnej i nie są udostępniane
            podmiotom trzecim.
          </p>

          <h2 className="text-base font-semibold text-ink">9. Ochrona danych osobowych</h2>
          <p>
            Administrator przetwarza dane osobowe wyłącznie w celach wskazanych
            w Polityce Prywatności. Użytkownikowi przysługuje prawo dostępu do
            danych, ich poprawiania, usunięcia, ograniczenia przetwarzania,
            przenoszenia oraz wniesienia sprzeciwu, a także prawo cofnięcia
            zgody i wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.
            Realizacja praw następuje na wniosek przesłany na adres gdpr@novidia.eu.
          </p>

          <h2 className="text-base font-semibold text-ink">10. Odpowiedzialność i prawa autorskie</h2>
          <p>
            Użytkownik udziela Operatorowi niewyłącznej, nieodpłatnej licencji
            do treści publikowanych w Serwisie w zakresie niezbędnym do
            świadczenia usług, promocji i archiwizacji. Użytkownik oświadcza,
            że dysponuje prawami do udostępnianych materiałów. Operator nie
            ponosi odpowiedzialności za treści publikowane przez Użytkowników,
            zastrzegając sobie prawo do ich moderacji i usuwania.
          </p>

          <h2 className="text-base font-semibold text-ink">11. Postanowienia końcowe</h2>
          <p>
            Administrator zastrzega sobie prawo do zmiany Regulaminu z
            zachowaniem okresu wypowiedzenia lub zawiadomienia Użytkowników
            z wyprzedzeniem. W sprawach nieuregulowanych mają zastosowanie
            przepisy prawa polskiego oraz właściwe regulacje dotyczące ochrony
            danych osobowych. Ewentualne spory rozstrzygane będą przez sąd
            powszechny właściwy ze względu na siedzibę Administratora, o ile
            bezwzględnie obowiązujące przepisy nie stanowią inaczej.
          </p>
        </div>
      </div>
    </main>
  );
}
