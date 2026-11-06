/* =========================================================================
   RED DEVILS DATA DESK — the only data file on the site.
   Everything the pages render comes from window.UTD below.
   It is a plain script on purpose: no fetch(), no build step, no server.
   Double-click any .html file and the whole site still works.
   ========================================================================= */

window.UTD = (function () {
  'use strict';

  /* ---- Premier League era: every season since 1992–93 -------------------
     pos  = final league position (1–20)
     pts  = points won
     mgr  = manager(s) who took charge that season
     note = only added where something actually happened worth reading
     Checked against the club's season records: 33 seasons, 13 titles.
     -------------------------------------------------------------------- */
  const seasons = [
    { season: '1992–93', pos: 1,  pts: 84, mgr: 'Ferguson',  note: 'The first Premier League title — and the end of a 26-year wait.' },
    { season: '1993–94', pos: 1,  pts: 92, mgr: 'Ferguson',  note: 'League and FA Cup double; Cantona’s first full season.' },
    { season: '1994–95', pos: 2,  pts: 88, mgr: 'Ferguson',  note: 'Lost the title to Blackburn on the final day by one point.' },
    { season: '1995–96', pos: 1,  pts: 82, mgr: 'Ferguson',  note: 'Eleven points behind Newcastle in January, won by five.' },
    { season: '1996–97', pos: 1,  pts: 75, mgr: 'Ferguson',  note: 'Cantona’s last season; fourth title in five years.' },
    { season: '1997–98', pos: 2,  pts: 77, mgr: 'Ferguson',  note: 'Arsenal’s double season; United finished second.' },
    { season: '1998–99', pos: 1,  pts: 79, mgr: 'Ferguson',  note: 'The Treble. League, FA Cup and European Cup in eleven days.' },
    { season: '1999–2000', pos: 1,  pts: 91, mgr: 'Ferguson', note: 'Won the league by 18 points, a Premier League record margin.' },
    { season: '2000–01', pos: 1,  pts: 80, mgr: 'Ferguson',  note: 'Third title in a row — the first club to do it twice.' },
    { season: '2001–02', pos: 3,  pts: 77, mgr: 'Ferguson',  note: 'Third place behind Arsenal and Liverpool.' },
    { season: '2002–03', pos: 1,  pts: 83, mgr: 'Ferguson',  note: 'Overtook Arsenal in the run-in; van Nistelrooy scored 25.' },
    { season: '2003–04', pos: 3,  pts: 75, mgr: 'Ferguson',  note: 'Arsenal went unbeaten; United third, but won the FA Cup.' },
    { season: '2004–05', pos: 3,  pts: 77, mgr: 'Ferguson',  note: 'Rooney’s first season; Chelsea’s first title under Mourinho.' },
    { season: '2005–06', pos: 2,  pts: 83, mgr: 'Ferguson',  note: 'Runners-up; the League Cup was the only trophy.' },
    { season: '2006–07', pos: 1,  pts: 89, mgr: 'Ferguson',  note: 'Ronaldo and Rooney take over; first title in four years.' },
    { season: '2007–08', pos: 1,  pts: 87, mgr: 'Ferguson',  note: 'League and Champions League double — Moscow, penalties.' },
    { season: '2008–09', pos: 1,  pts: 90, mgr: 'Ferguson',  note: 'Third straight title and the Club World Cup in Japan.' },
    { season: '2009–10', pos: 2,  pts: 85, mgr: 'Ferguson',  note: 'One point behind Chelsea; Rooney scored 34 in all competitions.' },
    { season: '2010–11', pos: 1,  pts: 80, mgr: 'Ferguson',  note: 'A 19th league title, passing Liverpool’s record.' },
    { season: '2011–12', pos: 2,  pts: 89, mgr: 'Ferguson',  note: 'Lost the title on goal difference to Agüero’s last kick.' },
    { season: '2012–13', pos: 1,  pts: 89, mgr: 'Ferguson',  note: 'A 20th title in Ferguson’s final season.' },
    { season: '2013–14', pos: 7,  pts: 64, mgr: 'Moyes',     note: 'First season after Ferguson; seventh, no European football.' },
    { season: '2014–15', pos: 4,  pts: 70, mgr: 'Van Gaal',  note: 'Back into the Champions League places.' },
    { season: '2015–16', pos: 5,  pts: 66, mgr: 'Van Gaal',  note: 'Fifth, but the FA Cup was won at Wembley.' },
    { season: '2016–17', pos: 6,  pts: 69, mgr: 'Mourinho',  note: 'Europa League and League Cup; Champions League via the back door.' },
    { season: '2017–18', pos: 2,  pts: 81, mgr: 'Mourinho',  note: 'Second with 81 points — and no trophy.' },
    { season: '2018–19', pos: 6,  pts: 66, mgr: 'Mourinho / Solskjær', note: 'Mourinho sacked in December; Solskjær’s interim run.' },
    { season: '2019–20', pos: 3,  pts: 66, mgr: 'Solskjær',  note: 'Third on the final day, unbeaten run after the restart.' },
    { season: '2020–21', pos: 2,  pts: 74, mgr: 'Solskjær',  note: 'Runners-up; Europa League final lost on penalties.' },
    { season: '2021–22', pos: 6,  pts: 58, mgr: 'Solskjær / Rangnick', note: 'Ronaldo returned; the season did not.' },
    { season: '2022–23', pos: 3,  pts: 75, mgr: 'Ten Hag',   note: 'Third and the League Cup — the first trophy in six years.' },
    { season: '2023–24', pos: 8,  pts: 60, mgr: 'Ten Hag',   note: 'Eighth, the worst finish of the Premier League era, plus the FA Cup.' },
    { season: '2024–25', pos: 15, pts: 42, mgr: 'Ten Hag / Amorim', note: 'A fifteenth-place finish — the lowest in the club’s top-flight history.' }
  ];

  /* ---- Players ----------------------------------------------------------
     apps / goals are club records, all competitions.
     slot[] = positions this player can fill in the XI builder.
     -------------------------------------------------------------------- */
  const legends = [
    { id: 'schmeichel', name: 'Peter Schmeichel', nation: 'Denmark', years: '1991–1999', apps: 398, goals: 1, slot: ['GK'],
      note: 'The goalkeeper the Treble was built on. Loud, enormous, and unbeatable in one-on-ones.' },
    { id: 'vandersar', name: 'Edwin van der Sar', nation: 'Netherlands', years: '2005–2011', apps: 266, goals: 0, slot: ['GK'],
      note: 'Calm where Schmeichel was loud. Saved the penalty that won the 2008 Champions League.' },
    { id: 'gneville', name: 'Gary Neville', nation: 'England', years: '1992–2011', apps: 602, goals: 7, slot: ['RB'],
      note: 'One club, one position, six hundred matches. The standard for a full-back who never had pace to spare.' },
    { id: 'irwin', name: 'Denis Irwin', nation: 'Ireland', years: '1990–2002', apps: 529, goals: 33, slot: ['LB', 'RB'],
      note: 'Ferguson’s most reliable signing. Free-kicks, penalties, and never once out of position.' },
    { id: 'evra', name: 'Patrice Evra', nation: 'France', years: '2006–2014', apps: 379, goals: 10, slot: ['LB'],
      note: 'Started badly, ended as a cult hero. Overlapped for a living and defended like it mattered.' },
    { id: 'ferdinand', name: 'Rio Ferdinand', nation: 'England', years: '2002–2014', apps: 455, goals: 8, slot: ['CB'],
      note: 'A centre-back who defended by reading the pass before it was played. The most elegant of the modern era.' },
    { id: 'vidic', name: 'Nemanja Vidić', nation: 'Serbia', years: '2006–2014', apps: 300, goals: 21, slot: ['CB'],
      note: 'Ferdinand’s opposite and his perfect partner. Headed everything, including the things he should not have reached.' },
    { id: 'stam', name: 'Jaap Stam', nation: 'Netherlands', years: '1998–2001', apps: 127, goals: 1, slot: ['CB'],
      note: 'Three seasons, three titles. Sold too early, and everyone knew it at the time.' },
    { id: 'pallister', name: 'Gary Pallister', nation: 'England', years: '1989–1998', apps: 437, goals: 15, slot: ['CB'],
      note: 'The quiet half of the partnership that made the first titles of the 1990s possible.' },
    { id: 'keane', name: 'Roy Keane', nation: 'Ireland', years: '1993–2005', apps: 480, goals: 51, slot: ['CM'],
      note: 'The captain who decided the tempo of a match by refusing to lose it. Turin, 1999, is the proof.' },
    { id: 'scholes', name: 'Paul Scholes', nation: 'England', years: '1994–2013', apps: 718, goals: 155, slot: ['CM', 'AM'],
      note: 'Passed like he could see the pitch from above. Retired, came back, and was still the best midfielder there.' },
    { id: 'robson', name: 'Bryan Robson', nation: 'England', years: '1981–1994', apps: 461, goals: 99, slot: ['CM'],
      note: 'Captain Marvel. Carried a mediocre team for a decade before the good one arrived.' },
    { id: 'edwards', name: 'Duncan Edwards', nation: 'England', years: '1953–1958', apps: 177, goals: 21, slot: ['CM'],
      note: 'Eighteen years old and already the best player in England. Died at Munich at twenty-one.' },
    { id: 'beckham', name: 'David Beckham', nation: 'England', years: '1992–2003', apps: 394, goals: 85, slot: ['RM', 'CM'],
      note: 'The crossing was the trick, and everyone still could not stop it. Halfway line, Wimbledon, 1996.' },
    { id: 'giggs', name: 'Ryan Giggs', nation: 'Wales', years: '1991–2014', apps: 963, goals: 168, slot: ['LM', 'AM'],
      note: 'The record appearance maker, and the only player to appear in every Premier League title season.' },
    { id: 'charlton', name: 'Bobby Charlton', nation: 'England', years: '1956–1973', apps: 758, goals: 249, slot: ['AM', 'CM', 'ST'],
      note: 'Survived Munich, won the European Cup ten years later, and held the scoring record for forty years.' },
    { id: 'best', name: 'George Best', nation: 'Northern Ireland', years: '1963–1974', apps: 470, goals: 179, slot: ['RW', 'AM', 'LW'],
      note: 'The first footballer treated like a pop star, and good enough to justify all of it.' },
    { id: 'cantona', name: 'Eric Cantona', nation: 'France', years: '1992–1997', apps: 185, goals: 82, slot: ['ST', 'AM'],
      note: 'Five seasons, five league titles, and a change in the temperature of the whole club.' },
    { id: 'rooney', name: 'Wayne Rooney', nation: 'England', years: '2004–2017', apps: 559, goals: 253, slot: ['ST', 'AM'],
      note: 'The record goalscorer, and for a while the best defender in his own team.' },
    { id: 'law', name: 'Denis Law', nation: 'Scotland', years: '1962–1973', apps: 404, goals: 237, slot: ['ST'],
      note: 'The King. Scored in every way a forward can, usually while the ball was in the air.' },
    { id: 'rvn', name: 'Ruud van Nistelrooy', nation: 'Netherlands', years: '2001–2006', apps: 219, goals: 150, slot: ['ST'],
      note: 'One hundred and fifty goals in five seasons, almost all of them from inside the six-yard box.' },
    { id: 'ronaldo', name: 'Cristiano Ronaldo', nation: 'Portugal', years: '2003–2009, 2021–2022', apps: 346, goals: 145, slot: ['RW', 'LW', 'ST'],
      note: 'Arrived as a show pony, left as the best player in the world, came back and briefly was again.' },
    { id: 'cole', name: 'Andy Cole', nation: 'England', years: '1995–2001', apps: 275, goals: 121, slot: ['ST'],
      note: 'The finisher of the 1999 front line, and half of the Yorke–Cole partnership that made it work.' },
    { id: 'solskjaer', name: 'Ole Gunnar Solskjær', nation: 'Norway', years: '1996–2007', apps: 366, goals: 126, slot: ['ST'],
      note: 'The substitute who won the Champions League. Four goals in eleven minutes at Nottingham Forest, too.' }
  ];

  /* ---- Trophy cabinet ---------------------------------------------------
     years[] are the winning years. `shared` counts shared titles inside years
     (marked * in the UI). Total = 68 major trophies.
     -------------------------------------------------------------------- */
  const trophies = [
    { id: 'league', name: 'League titles', detail: 'First Division / Premier League', group: 'domestic', count: 20, note: 'A joint-record 20 English top-flight titles: seven before 1992, thirteen in the Premier League.',
      years: ['1907–08', '1910–11', '1951–52', '1955–56', '1956–57', '1964–65', '1966–67', '1992–93', '1993–94', '1995–96', '1996–97', '1998–99', '1999–2000', '2000–01', '2002–03', '2006–07', '2007–08', '2008–09', '2010–11', '2012–13'] },
    { id: 'facup', name: 'FA Cup', detail: 'The world’s oldest cup competition', group: 'domestic', count: 13, note: 'Thirteen finals won between 1909 and 2024, including the 1999 Treble and the 2024 upset of Manchester City.',
      years: ['1909', '1948', '1963', '1977', '1983', '1985', '1990', '1994', '1996', '1999', '2004', '2016', '2024'] },
    { id: 'leaguecup', name: 'League Cup', detail: 'EFL Cup', group: 'domestic', count: 6, note: 'Six wins, four of them under Ferguson and one under Ten Hag in 2023.',
      years: ['1992', '2006', '2009', '2010', '2017', '2023'] },
    { id: 'shield', name: 'Community Shield', detail: 'FA Charity / Community Shield', group: 'domestic', count: 21, shared: 4, note: 'A record 21, of which 17 were won outright and 4 shared.',
      years: ['1908', '1911', '1952', '1956', '1957', '1965*', '1967*', '1977*', '1983', '1990*', '1993', '1994', '1996', '1997', '2003', '2007', '2008', '2010', '2011', '2013', '2016'] },
    { id: 'eurocup', name: 'European Cup', detail: 'UEFA Champions League', group: 'european', count: 3, note: '1968 at Wembley, 1999 in Barcelona, 2008 in Moscow. The first English club to win it.',
      years: ['1968', '1999', '2008'] },
    { id: 'cwcup', name: 'Cup Winners’ Cup', detail: 'UEFA Cup Winners’ Cup', group: 'european', count: 1, note: '1991, in Rotterdam, against Barcelona — the night the European habit started.',
      years: ['1991'] },
    { id: 'eurosuper', name: 'European Super Cup', detail: 'UEFA Super Cup', group: 'european', count: 1, note: '1991, against Red Star Belgrade, over two legs.',
      years: ['1991'] },
    { id: 'europa', name: 'Europa League', detail: 'UEFA Europa League', group: 'european', count: 1, note: '2017 in Stockholm. With it, United had won all three of UEFA’s main club competitions.',
      years: ['2017'] },
    { id: 'intercont', name: 'Intercontinental Cup', detail: 'Europe vs South America', group: 'worldwide', count: 1, note: '1999 in Tokyo, against Palmeiras. The Treble became a quadruple in December.',
      years: ['1999'] },
    { id: 'clubwc', name: 'Club World Cup', detail: 'FIFA Club World Cup', group: 'worldwide', count: 1, note: '2008 in Yokohama. The first British club to win it.',
      years: ['2008'] }
  ];

  /* ---- Eras: the timeline on the home page ----------------------------- */
  const eras = [
    { year: '1878', title: 'Newton Heath LYR', text: 'A works team for the railway depot at Newton Heath, playing on a muddy field and passing a hat around for money.' },
    { year: '1902', title: 'The name changes', text: 'Bankrupt and days from folding, the club is rescued, renamed Manchester United, and given red shirts and white shorts.' },
    { year: '1908', title: 'First title', text: 'Twenty years after entering the league, United win the First Division. The FA Cup follows a year later.' },
    { year: '1958', title: 'Munich', text: 'The plane carrying the Busby Babes crashes on the runway at Munich. Twenty-three people die, eight of them players.' },
    { year: '1968', title: 'European champions', text: 'Ten years after Munich, a team built around Charlton, Best and Law becomes the first English club to lift the European Cup.' },
    { year: '1986', title: 'Ferguson arrives', text: 'Appointed in November with the club near the bottom of the table. The first three years are worse, not better.' },
    { year: '1999', title: 'The Treble', text: 'League, FA Cup and Champions League inside eleven days, the last of them two goals down in stoppage time in Barcelona.' },
    { year: '2008', title: 'Moscow', text: 'A third European Cup on penalties in the rain, the same season as a tenth Premier League title.' },
    { year: '2013', title: 'The end of an era', text: 'Ferguson retires after a 20th league title. Nothing since has been the same, which is the honest reason this site exists.' }
  ];

  /* ---- Milestones: the "since then" tickers on the home page ----------- */
  const milestones = [
    { date: '1968-05-29', label: 'European Cup won at Wembley' },
    { date: '1999-05-26', label: 'Treble completed in Barcelona' },
    { date: '2013-05-19', label: "Ferguson's last match in charge" },
    { date: '2024-05-25', label: 'FA Cup won at Wembley' }
  ];

  return { seasons: seasons, legends: legends, trophies: trophies, eras: eras, milestones: milestones };
})();
