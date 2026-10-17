import type { CategoryIconKey } from "./categoryIcons";

export interface MegaTopic {
  title: string;
  /** slug passed as `topic` query param to /categories */
  slug: string;
}

export interface MegaGroup {
  id: string;
  title: string;
  icon: CategoryIconKey;
  /** `tag` query param shared by every topic in the group */
  tag: string;
  topics: MegaTopic[];
}

// Full topic tree behind the "Kategorie" mega-menu. Groups map to the
// /categories?tag=... filter, topics narrow it via /categories?tag=...&topic=...
export const MEGA_GROUPS: MegaGroup[] = [
  {
    id: "sport",
    title: "Sport",
    icon: "sport",
    tag: "sport",
    topics: [
      { title: "Piłka nożna", slug: "pilka-nozna" },
      { title: "Koszykówka", slug: "koszykowka" },
      { title: "Siatkówka", slug: "siatkowka" },
      { title: "Lekkoatletyka", slug: "lekkoatletyka" },
      { title: "Pływanie", slug: "plywanie" },
      { title: "Ręczna", slug: "reczna" },
      { title: "Tenis", slug: "tenis" },
      { title: "Esport", slug: "esport" },
      { title: "Trening i dieta", slug: "trening" },
      { title: "Zawody szkolne", slug: "zawody-szkolne" },
    ],
  },
  {
    id: "culture",
    title: "Kultura",
    icon: "culture",
    tag: "culture",
    topics: [
      { title: "Film i serial", slug: "film" },
      { title: "Muzyka", slug: "muzyka" },
      { title: "Książki", slug: "ksiazki" },
      { title: "Teatr", slug: "teatr" },
      { title: "Sztuka i malarstwo", slug: "sztuka" },
      { title: "Fotografia", slug: "fotografia" },
      { title: "Języki obce", slug: "jezyki" },
      { title: "Historia", slug: "historia" },
      { title: "Subkultury", slug: "subkultury" },
      { title: "Premiery i wydarzenia", slug: "premiery" },
    ],
  },
  {
    id: "science",
    title: "Nauka",
    icon: "science",
    tag: "science",
    topics: [
      { title: "Matematyka", slug: "matematyka" },
      { title: "Fizyka", slug: "fizyka" },
      { title: "Chemia", slug: "chemia" },
      { title: "Biologia", slug: "biologia" },
      { title: "Medycyna", slug: "medycyna" },
      { title: "Astronomia", slug: "astronomia" },
      { title: "Geografia", slug: "geografia" },
      { title: "Badania i wynalazki", slug: "badania" },
      { title: "Psychologia", slug: "psychologia" },
      { title: "Klimat i ekologia", slug: "ekologia" },
    ],
  },
  {
    id: "technology",
    title: "Technologia",
    icon: "technology",
    tag: "technology",
    topics: [
      { title: "Programowanie", slug: "programowanie" },
      { title: "Sztuczna inteligencja", slug: "ai" },
      { title: "Gry i konsole", slug: "gry" },
      { title: "Smartfony i sprzęt", slug: "sprzet" },
      { title: "Internet i media społ.", slug: "internet" },
      { title: "Cyberbezpieczeństwo", slug: "cyberbezpieczenstwo" },
      { title: "Motoryzacja", slug: "motoryzacja" },
      { title: "Kosmos i lotnictwo", slug: "kosmos" },
      { title: "Recenzje produktów", slug: "recenzje" },
      { title: "Startupy i biznes", slug: "startupy" },
    ],
  },
  {
    id: "entertainment",
    title: "Rozrywka",
    icon: "entertainment",
    tag: "entertainment",
    topics: [
      { title: "Memy i humor", slug: "memy" },
      { title: "YouTuberzy i streamy", slug: "streamy" },
      { title: "Anime i manga", slug: "anime" },
      { title: "Komiksy", slug: "komiksy" },
      { title: "Muzyka klubowa", slug: "dj" },
      { title: "Podcasty", slug: "podcasty" },
      { title: "Trendy internetowe", slug: "trendy" },
      { title: "Gry planszowe", slug: "planszowki" },
      { title: "Moda i styl", slug: "moda" },
      { title: "Mem contesty szkolne", slug: "konkursy" },
    ],
  },
  {
    id: "school",
    title: "Szkoła",
    icon: "culture",
    tag: "school",
    topics: [
      { title: "Matura i egzaminy", slug: "matura" },
      { title: "Studniówki i bal", slug: "studniowka" },
      { title: "Wycieczki szkolne", slug: "wycieczki" },
      { title: "Koła zainteresowań", slug: "kola" },
      { title: "Samorząd uczniowski", slug: "samorzad" },
      { title: "Rekrutacja", slug: "rekrutacja" },
      { title: "Przedmioty", slug: "przedmioty" },
      { title: "Legendarne historie", slug: "legendy" },
      { title: "Opinie uczniów", slug: "opinie" },
      { title: "Konkursy", slug: "konkursy-szkolne" },
    ],
  },
  {
    id: "society",
    title: "Społeczeństwo",
    icon: "science",
    tag: "society",
    topics: [
      { title: "Polityka", slug: "polityka" },
      { title: "Prawo", slug: "prawo" },
      { title: "Ekonomia", slug: "ekonomia" },
      { title: "Sporty walki", slug: "walki" },
      { title: "Podróże", slug: "podroze" },
      { title: "Kulinaria", slug: "kulinaria" },
      { title: "Zdrowie i profilaktyka", slug: "zdrowie" },
      { title: "Wolontariat", slug: "wolontariat" },
      { title: "Różnorodność", slug: "roznorodnosc" },
      { title: "Hierarchia redakcji", slug: "redakcja" },
    ],
  },
];
